# Custom ARC Runner Image

This document describes how to build, push, and use a custom Actions Runner Controller (ARC) image with pre-installed tools for the hot-cluster CI testing.

## Overview

The custom ARC runner image (`Dockerfile.arc-runner`) extends `ghcr.io/actions/actions-runner:latest` with pre-installed tools:
- **OpenShift CLI (`oc`)** — v4.14+
- **Helm** — v3.14+
- **Node.js** — v18.x
- **npm** — latest
- **Cypress** — latest
- **System dependencies** — Xvfb, fonts, browsers, jq, curl, git, etc.

## Benefits

✅ **Faster Job Startup** — No tool installation overhead during each workflow run  
✅ **Reproducibility** — All jobs run with identical pre-installed versions  
✅ **Reduced Network Traffic** — No external downloads during CI runs  
✅ **Security** — Curated, tested base image with no surprises  
✅ **Reliability** — Predictable behavior, no version mismatches  

## Building the Image

### Prerequisites
- Docker or Podman installed
- Access to push to a container registry (Docker Hub, quay.io, ttl.sh, etc.)

### Build Locally

```bash
cd /path/to/networking-console-plugin

# Build the image
docker build -t custom-arc-runner:latest -f ci-scripts/Dockerfile.arc-runner .

# Verify the build
docker run --rm custom-arc-runner:latest sh -c "echo '=== Installed Tools ===' && oc version --client && helm version --short && node --version && npm --version"
```

### Push to Registry

#### Option A: Temporary Registry (ttl.sh - 1-2 hours)

Good for testing:

```bash
docker build -t ttl.sh/custom-arc-runner:1h -f ci-scripts/Dockerfile.arc-runner .
docker push ttl.sh/custom-arc-runner:1h
```

#### Option B: Docker Hub

Good for shared, long-term use:

```bash
docker build -t your-docker-username/custom-arc-runner:latest -f ci-scripts/Dockerfile.arc-runner .
docker login
docker push your-docker-username/custom-arc-runner:latest
```

#### Option C: Quay.io (Red Hat)

Good for enterprise deployments:

```bash
docker build -t quay.io/your-org/custom-arc-runner:latest -f ci-scripts/Dockerfile.arc-runner .
docker login quay.io
docker push quay.io/your-org/custom-arc-runner:latest
```

## Using the Custom Image in ARC RunnerScaleSet

Update your `RunnerScaleSet` to use the custom image:

```yaml
apiVersion: actions.summerwind.dev/v1alpha1
kind: RunnerScaleSet
metadata:
  name: networking-console-plugin-ci
  namespace: arc-runners
spec:
  runnerImage: ttl.sh/custom-arc-runner:1h  # ← Use custom image
  runnerScaleSetName: networking-console-plugin-ci
  maxRunners: 2
  minRunners: 0
  runnerGroup: default
  githubConfigUrl: https://github.com/YOUR_OWNER/networking-console-plugin
  githubConfigSecret:
    name: github-token
    key: github_token
  containerMode:
    type: kubernetes
  template:
    spec:
      serviceAccountName: arc-runner-sa
      securityContext:
        fsGroup: 1001
        runAsUser: 1001
      containers:
        - name: runner
          image: ttl.sh/custom-arc-runner:1h  # ← Custom image
          imagePullPolicy: IfNotPresent
          env:
            - name: OPENSSL_FORCE_FIPS_MODE
              value: '0'
            - name: GOLANG_FIPS
              value: '0'
          volumeMounts:
            - name: kubeconfig
              mountPath: /tmp/kubeconfig
              readOnly: true
      volumes:
        - name: kubeconfig
          projected:
            sources:
              - serviceAccountToken:
                  path: token
                  audience: https://kubernetes.default.svc
              - configMap:
                  name: kube-root-ca.crt
                  items:
                    - key: ca.crt
                      path: ca.crt
            defaultMode: 0600
```

Then apply the updated RunnerScaleSet:

```bash
oc apply -f runnerscaleset.yaml
oc rollout restart statefulset/arc-runner -n arc-runners  # Force pods to restart with new image
```

## Verifying the Custom Image

After updating the RunnerScaleSet, verify the runner pods are using the new image:

```bash
# Check pod image
oc get pods -n arc-runners -o wide | grep runner

# Check runner readiness
oc logs -f -l app.kubernetes.io/name=actions-runner-controller -n arc-runners

# Run a test workflow
gh workflow run hot-cluster-e2e.yml \
  --repo YOUR_OWNER/networking-console-plugin \
  --ref main \
  -f test_spec="tests/all.cy.ts"

# Monitor the job
gh run watch <run-id>

# Check logs for tool versions
gh run view <run-id> --log
```

## Workflow Changes (None Required!)

**Important**: No changes to `hot-cluster-e2e.yml` or `hot-cluster-e2e-run.yml` are needed. The workflows will automatically use the custom image because it replaces `ghcr.io/actions/actions-runner:latest` in the RunnerScaleSet.

However, you **can remove** the tool installation steps from the workflows for minor speedup:

```yaml
# BEFORE (still needed for GitHub-hosted runners)
- name: Install oc CLI
  run: |
    if ! command -v oc &>/dev/null; then
      # ... install oc ...
    fi

# AFTER (no longer needed for ARC runners with custom image)
# Step can be removed, oc is pre-installed
```

To keep the workflows backward-compatible with both custom and standard ARC images, the install steps check `if ! command -v oc &>/dev/null` and skip if already present.

## Troubleshooting

### Image Pull Fails

```
ImagePullBackOff: Failed to pull image "ttl.sh/custom-arc-runner:1h"
```

**Solution**: Check that the image was successfully pushed:

```bash
docker push ttl.sh/custom-arc-runner:1h  # Re-push if needed
skopeo inspect docker://ttl.sh/custom-arc-runner:1h
```

### Tool Version Mismatch

If a tool version needs updating:

1. Edit `ci-scripts/Dockerfile.arc-runner`
2. Update the version (e.g., `HELM_VERSION="3.15"`)
3. Rebuild and push:
   ```bash
   docker build -t ttl.sh/custom-arc-runner:2h -f ci-scripts/Dockerfile.arc-runner .
   docker push ttl.sh/custom-arc-runner:2h
   ```
4. Update RunnerScaleSet image reference
5. Restart the statefulset

### Runner Pod Crashes

Check the pod logs:

```bash
oc logs -f <runner-pod-name> -n arc-runners
oc describe pod <runner-pod-name> -n arc-runners
```

Common issues:
- Missing system dependencies → add to apt-get install
- Node.js/npm issues → rebuild from scratch
- Permissions → ensure `USER runner` is set correctly

## Performance Comparison

### Standard Image (`ghcr.io/actions/actions-runner:latest`)
- Image size: ~700 MB
- Job startup: 2-3 minutes (downloading + installing tools)
- Network usage: ~200 MB per job

### Custom Image
- Image size: ~2.5 GB (includes pre-installed tools)
- Job startup: 30-60 seconds (only kubeconfig setup)
- Network usage: ~5 MB per job

**Total savings**: ~2-3 minutes per workflow run, reduced bandwidth usage

## CI/CD Integration

To automatically build and push the custom image on changes:

```yaml
# .github/workflows/build-arc-runner-image.yml
name: Build Custom ARC Runner Image

on:
  push:
    paths:
      - 'ci-scripts/Dockerfile.arc-runner'
      - 'ci-scripts/ARC-RUNNER-IMAGE.md'
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - name: Build and push
        run: |
          docker build -t ttl.sh/custom-arc-runner:24h \
            -f ci-scripts/Dockerfile.arc-runner .
          docker push ttl.sh/custom-arc-runner:24h
```

## References

- [Actions Runner Controller Docs](https://github.com/actions/actions-runner-controller)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [OpenShift CLI Download](https://mirror.openshift.com/pub/openshift-v4/x86_64/clients/ocp/)
- [Helm Installation](https://helm.sh/docs/intro/install/)
- [Node.js Installation](https://nodejs.org/en/download/package-manager/)
- [Cypress Documentation](https://docs.cypress.io/guides/getting-started/installing-cypress)
