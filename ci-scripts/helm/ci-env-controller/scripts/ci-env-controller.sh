#!/bin/bash
#
# ci-env-controller — watches trigger ConfigMaps and reconciles test environments.
#
# Each trigger ConfigMap has:
#   data.desired-state: "present" | "absent"
#   data.plugin-image:  container image to deploy
#   data.test-namespace: namespace for the test stack
#
# The controller provisions (helm install) or tears down (helm uninstall)
# based on the desired state, then updates the ConfigMap with status.
#
set -uo pipefail

RECONCILE_INTERVAL="${RECONCILE_INTERVAL:-15}"
REAP_AFTER_MINUTES="${REAP_AFTER_MINUTES:-120}"
CI_ENV_NAMESPACE="${CI_ENV_NAMESPACE:-ci-env}"
CONSOLE_IMAGE_REGISTRY="${CONSOLE_IMAGE_REGISTRY:-quay.io/openshift/origin-console}"
LABEL_SELECTOR="ci.networking-console-plugin/type=test-environment"

resolve_console_image() {
  local version
  version="$(oc get clusterversion version -o jsonpath='{.status.desired.version}' 2>/dev/null || true)"
  if [[ -z "${version}" ]]; then
    echo "${CONSOLE_IMAGE_REGISTRY}:latest"
    return
  fi
  local major minor
  IFS='.' read -r major minor _rest <<< "${version}"
  echo "${CONSOLE_IMAGE_REGISTRY}:${major}.${minor}"
}

resolve_api_server() {
  oc whoami --show-server 2>/dev/null || echo "https://kubernetes.default.svc"
}

patch_cm() {
  local cm_name="$1"
  shift
  oc patch configmap "${cm_name}" -n "${CI_ENV_NAMESPACE}" --type merge -p "$@" 2>/dev/null || true
}

provision_env() {
  local cm_name="$1"
  local plugin_image="$2"
  local test_ns="$3"

  echo "[provision] ${cm_name}: plugin=${plugin_image}, ns=${test_ns}"
  patch_cm "${cm_name}" "{\"data\":{\"status\":\"provisioning\"}}"

  local console_image api_server helm_release
  console_image="$(resolve_console_image)"
  api_server="$(resolve_api_server)"
  helm_release="${cm_name}"

  oc get namespace "${test_ns}" 2>/dev/null || oc create namespace "${test_ns}"

  if helm status "${helm_release}" -n "${test_ns}" &>/dev/null; then
    echo "[provision] Upgrading existing release ${helm_release}"
    helm upgrade "${helm_release}" /charts/ci-test-stack -n "${test_ns}" \
      --set pluginImage="${plugin_image}" \
      --set consoleImage="${console_image}" \
      --set apiServerURL="${api_server}" \
      --set runnerServiceAccount="${RUNNER_SERVICE_ACCOUNT:-}" \
      --wait --timeout 300s
  else
    echo "[provision] Installing new release ${helm_release}"
    helm install "${helm_release}" /charts/ci-test-stack -n "${test_ns}" \
      --set pluginImage="${plugin_image}" \
      --set consoleImage="${console_image}" \
      --set apiServerURL="${api_server}" \
      --set runnerServiceAccount="${RUNNER_SERVICE_ACCOUNT:-}" \
      --wait --timeout 300s
  fi

  if [[ $? -ne 0 ]]; then
    patch_cm "${cm_name}" "{\"data\":{\"status\":\"error\",\"error-message\":\"helm install/upgrade failed\"}}"
    return 1
  fi

  local bridge_url console_route
  bridge_url="http://${helm_release}-console.${test_ns}.svc.cluster.local:9000"
  console_route="$(oc get route "${helm_release}-console" -n "${test_ns}" \
    -o jsonpath='{.spec.host}' 2>/dev/null || echo "")"

  patch_cm "${cm_name}" "{\"data\":{\"status\":\"ready\",\"bridge-base-address\":\"${bridge_url}\",\"console-route\":\"${console_route}\",\"helm-release\":\"${helm_release}\"}}"
  echo "[provision] ${cm_name}: ready (bridge=${bridge_url})"
}

teardown_env() {
  local cm_name="$1"
  local test_ns="$2"
  local helm_release="${cm_name}"

  echo "[teardown] ${cm_name}: ns=${test_ns}"
  patch_cm "${cm_name}" "{\"data\":{\"status\":\"cleaning\"}}"

  helm uninstall "${helm_release}" -n "${test_ns}" --wait --timeout 120s 2>/dev/null || true
  oc delete namespace "${test_ns}" --ignore-not-found --wait=false 2>/dev/null || true

  patch_cm "${cm_name}" "{\"data\":{\"status\":\"cleaned\"}}"
  echo "[teardown] ${cm_name}: cleaned"
}

reconcile_one() {
  local cm_name="$1"
  local desired_state plugin_image test_ns status

  desired_state="$(oc get configmap "${cm_name}" -n "${CI_ENV_NAMESPACE}" \
    -o jsonpath='{.data.desired-state}' 2>/dev/null || echo "")"
  plugin_image="$(oc get configmap "${cm_name}" -n "${CI_ENV_NAMESPACE}" \
    -o jsonpath='{.data.plugin-image}' 2>/dev/null || echo "")"
  test_ns="$(oc get configmap "${cm_name}" -n "${CI_ENV_NAMESPACE}" \
    -o jsonpath='{.data.test-namespace}' 2>/dev/null || echo "")"
  status="$(oc get configmap "${cm_name}" -n "${CI_ENV_NAMESPACE}" \
    -o jsonpath='{.data.status}' 2>/dev/null || echo "")"

  case "${desired_state}" in
    present)
      if [[ "${status}" == "ready" || "${status}" == "provisioning" ]]; then
        return
      fi
      if [[ -z "${plugin_image}" || -z "${test_ns}" ]]; then
        patch_cm "${cm_name}" "{\"data\":{\"status\":\"error\",\"error-message\":\"missing plugin-image or test-namespace\"}}"
        return
      fi
      provision_env "${cm_name}" "${plugin_image}" "${test_ns}"
      ;;
    absent)
      if [[ "${status}" == "cleaned" || "${status}" == "cleaning" ]]; then
        return
      fi
      teardown_env "${cm_name}" "${test_ns}"
      ;;
  esac
}

reap_stale() {
  local now_epoch cm_list cm_name created_str created_epoch age_minutes
  now_epoch=$(date +%s)

  cm_list="$(oc get configmap -n "${CI_ENV_NAMESPACE}" -l "${LABEL_SELECTOR}" \
    -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.metadata.creationTimestamp}{"\n"}{end}' 2>/dev/null || true)"

  while IFS=$'\t' read -r cm_name created_str; do
    [[ -z "${cm_name}" ]] && continue
    created_epoch=$(date -d "${created_str}" +%s 2>/dev/null || echo "0")
    age_minutes=$(( (now_epoch - created_epoch) / 60 ))

    if (( age_minutes >= REAP_AFTER_MINUTES )); then
      echo "[reap] ${cm_name} is ${age_minutes}m old (threshold: ${REAP_AFTER_MINUTES}m), tearing down"
      local test_ns
      test_ns="$(oc get configmap "${cm_name}" -n "${CI_ENV_NAMESPACE}" \
        -o jsonpath='{.data.test-namespace}' 2>/dev/null || echo "")"
      teardown_env "${cm_name}" "${test_ns}"
      oc delete configmap "${cm_name}" -n "${CI_ENV_NAMESPACE}" 2>/dev/null || true
    fi
  done <<< "${cm_list}"
}

echo "ci-env-controller starting (ns=${CI_ENV_NAMESPACE}, interval=${RECONCILE_INTERVAL}s, reap=${REAP_AFTER_MINUTES}m)"

while true; do
  CM_NAMES="$(oc get configmap -n "${CI_ENV_NAMESPACE}" -l "${LABEL_SELECTOR}" \
    -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null || true)"

  while IFS= read -r cm_name; do
    [[ -z "${cm_name}" ]] && continue
    reconcile_one "${cm_name}" || true
  done <<< "${CM_NAMES}"

  reap_stale || true

  sleep "${RECONCILE_INTERVAL}"
done
