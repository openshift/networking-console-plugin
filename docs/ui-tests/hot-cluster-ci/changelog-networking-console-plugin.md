# Hot-Cluster CI — openshift/networking-console-plugin Change Log

Scope: standing up Cypress E2E testing for the networking console plugin and moving it onto a
persistent (hot) OpenShift cluster via GitHub Actions + ARC self-hosted runners, mirroring the
kubevirt-plugin model.

- Parent epic: [CNV-87983](https://redhat.atlassian.net/browse/CNV-87983) — _Move network &
  nmstate E2E tests from kubevirt-ui to upstream plugin repos_ (reporter Ron Lavi, created
  2026-05-21, Closed). Motivation: test/code co-location, cutting ~46 network/nmstate cases
  from CNV CI jobs, and adopting the hot-cluster CI pattern. Approach: rewrite the Playwright
  tests from `cnv-qe/kubevirt-ui` (internal GitLab, `playwright/tests/tier2/networking/` —
  `net-nad.spec.ts` ~25 tests, `s-r-i.spec.ts` 3 tests → this repo; `nnc-p.spec.ts` →
  nmstate-console-plugin) as **Cypress** in the upstream repos, per the epic's "use Cypress to
  match existing upstream infra" decision. All child issues Closed (CNV-87993 audit,
  CNV-87994 networking tests, CNV-87995 nmstate tests, CNV-87996 remove from kubevirt-ui,
  CNV-87997 remove from CNV CI jobs, CNV-87998 docs).
- Ticket: [OCPNETUI-56](https://redhat.atlassian.net/browse/OCPNETUI-56) — _Set up hot-cluster
  CI infrastructure in networking-console-plugin_ (reporter Ron Lavi, assignee Leon Kladnitsky,
  created 2026-05-21, status **Testing**): _Adapt Scott's hot-cluster CI approach from
  kubevirt-plugin PR #3713 for the upstream repos._ nmstate-console-plugin was explicitly moved
  out of this story into a separate one. Notable ticket history: as of 2026-06-25 the source
  PR #3713 was still **draft** — the port began against a draft POC; Ron Lavi (2026-07-15)
  noted Gal Kremer planned to make the GH actions more generic for reuse, which is the origin
  of the ported `ci-env-request`/`ci-env-release` design.
- Prior state: Cypress integration tests existed since 2022 (`bc40696` "Setup and config Cypress",
  Nov 2022, with `.ci-operator.yaml` + `test-prow-e2e.sh` for Prow), but coverage was minimal
  (one example spec) and the suite was mostly dormant; a "cypress 15 incompatible with node 18
  prow job" series of commits shows Prow runs failing as tooling aged.

### Ticket scope → delivery

The ticket lists five work items; all five landed, though the final shape evolved beyond them:

| Ticket scope item                                                                           | Delivered as                                                                                                                                                                                                                                                                          | Ref                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Port `ci-env-request` / `ci-env-release` composite actions                                  | Ported verbatim in pattern, plus the backing `ci-env-controller` + `ci-test-stack` Helm charts they drive                                                                                                                                                                             | PRs [#491](https://github.com/openshift/networking-console-plugin/pull/491), [#490](https://github.com/openshift/networking-console-plugin/pull/490), [#497](https://github.com/openshift/networking-console-plugin/pull/497) |
| E2E workflow `e2e-ci-test.yml`: build image → request env → Cypress → teardown              | Delivered as `hot-cluster-e2e.yml` + `hot-cluster-e2e-run.yml` (entry + run split), same pipeline shape: build-plugin-image → ci-env-request → cypress-io/github-action → collect-diagnostics → ci-env-release                                                                        | PRs [#497](https://github.com/openshift/networking-console-plugin/pull/497), [#522](https://github.com/openshift/networking-console-plugin/pull/522)                                                                          |
| Harden Cypress config per PR #3868 patterns (esbuild preprocessor, guided-tour suppression) | `ui-tests-cy/plugins/index.ts` uses webpack-preprocessor with `esbuild-loader`; `ui-tests-cy/support/login.ts` implements `dismissWelcomeTourIfPresent()` (polls `[data-test="tour-step-footer-secondary"]`, caches settled state)                                                    | PR [#468](https://github.com/openshift/networking-console-plugin/pull/468)                                                                                                                                                    |
| Ensure ARC is deployed on the target hot-cluster                                            | ARC deployment itself is cluster-side (out of repo); repo carries the runner-side artifacts: `arc-runner-networking-rbac.yaml`, `runnerscaleset-custom-image.yaml`, `check-cluster-health.sh` (verifies runner set readiness), `Dockerfile.arc-runner` + `build-arc-runner-image.yml` | PRs [#489](https://github.com/openshift/networking-console-plugin/pull/489), [#580](https://github.com/openshift/networking-console-plugin/pull/580)                                                                          |
| GHA workflow runs alongside existing Prow CI                                                | Both coexist: `test-prow-e2e.sh` retained; PR-level `e2e.yml` skips gracefully when `CONSOLE_URL` secret is unset, so Prow and GHA never double-gate                                                                                                                                  | PR [#522](https://github.com/openshift/networking-console-plugin/pull/522)                                                                                                                                                    |

Beyond the ticket: a full test-coverage program (Phases 1 & 4), the custom ARC runner image,
and the composite-action refactor (Phase 3).

## Timeline of changes

### Phase 0 — Pre-existing baseline (2022–2026)

| Date       | Change                                                                                      | Ref                                                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2022-11-04 | Cypress + ci-operator + Prow e2e script scaffold (`integration-tests/`, `test-prow-e2e.sh`) | commit `bc40696`; PRs [#9](https://github.com/openshift/networking-console-plugin/pull/9), [#11](https://github.com/openshift/networking-console-plugin/pull/11), [#12](https://github.com/openshift/networking-console-plugin/pull/12) |

### Phase 1 — Cypress E2E suite (Aug 2026)

Three-PR series (1a infra, 1b views, 1c tests), all by lkladnit under OCPNETUI-56:

| Date       | Change                                                                                                                                                                                                                                                                                                                      | Ref                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 2026-08-19 | **Cypress framework config + support files** — `cypress.config.js` (esbuild preprocessor, timeouts, reporters), login commands, navigation helpers, selectors, dotenv plugin, ESLint/tsconfig/reporter config, `.env.example`, `cypress-multi-reporters` deps; fixes to old `integration-tests/`                            | PR [#468](https://github.com/openshift/networking-console-plugin/pull/468) |
| 2026-08-19 | **Page objects + test constants** — NAD form helpers, UDN form helpers, common selectors/actions, base test values, NAD type definitions                                                                                                                                                                                    | PR [#469](https://github.com/openshift/networking-console-plugin/pull/469) |
| 2026-08-27 | **Test specs + runner scripts** — specs for NADs (bridge/localnet/OVN), network policies, routes, services, ingresses, UDN + CUDN, login/navigation; `setup.sh`/`cleanup.sh` namespace lifecycle; `test-cypress.sh` (GUI `-g` / headless); `research-flakiness.sh`; first `e2e.yml` GitHub Actions workflow; migration docs | PR [#470](https://github.com/openshift/networking-console-plugin/pull/470) |

Follow-up coverage:

| Date       | Change                                                                                                                                                                             | Ref                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 2026-09-02 | Service/Route endpoint-health tests (Healthy/Degraded/Down/ExternalName-Unknown via EndpointSlice fixtures, aria-label assertions); OpenShift OAuth login, `chromeWebSecurity` off | PR [#481](https://github.com/openshift/networking-console-plugin/pull/481) (OCPNETUI-59) |
| 2026-09-08 | Service create/edit form tests                                                                                                                                                     | PR [#480](https://github.com/openshift/networking-console-plugin/pull/480) (OCPNETUI-22) |
| 2026-09-15 | Network-to-VM cross-navigation tests                                                                                                                                               | PR [#493](https://github.com/openshift/networking-console-plugin/pull/493) (OCPNETUI-14) |

### Phase 2 — Hot-cluster infrastructure (Sep 2026)

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                   | Ref                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 2026-09-09 | **CI scripts for hot-cluster E2E** — `check-cluster-health.sh` (API, nodes, ARC runner set, storage, console route pre-flight), `test-cleanup.sh` (NADs, policies, routes, UDNs sweep), `start-console.sh` (off-cluster console container, bearer-token auth), `start-plugin-container.sh`, nginx configs                                                                                                | PR [#489](https://github.com/openshift/networking-console-plugin/pull/489)                   |
| 2026-09-09 | **`ci-test-stack` Helm chart** — console Deployment (off-cluster bridge, SA bearer-token auth), console SA + auto-generated token Secret, console Route (edge TLS), ClusterRoleBinding for networking CRD read, plugin Deployment/Service/ConfigMap                                                                                                                                                      | PR [#490](https://github.com/openshift/networking-console-plugin/pull/490)                   |
| 2026-09-09 | **`ci-env-controller` Helm chart** — controller watches trigger ConfigMaps: CI creates CM with `desired-state: present` + plugin image + test namespace → controller resolves console image from cluster OCP version → `helm install ci-test-stack` → patches CM `status: ready` + bridge URL → CI runs tests against bridge URL → CI patches `desired-state: absent` for teardown                       | PR [#491](https://github.com/openshift/networking-console-plugin/pull/491)                   |
| 2026-10-07 | **Hot-cluster E2E workflows + composite actions + Dockerfile.ci** — `hot-cluster-e2e.yml` (manual dispatch entry) and `hot-cluster-e2e-run.yml` (build plugin image → provision test env via Helm → run Cypress → collect diagnostics → tear down); `ci-env-request`/`ci-env-release` composite actions; `Dockerfile.ci` on public UBI9 base images (GHA runners can't pull `registry.ci.openshift.org`) | PR [#497](https://github.com/openshift/networking-console-plugin/pull/497)                   |
| 2026-09-16 | Xvfb screen 1920×1080 for full-size screenshots; **skip `e2e.yml` when `CONSOLE_URL` secret is unset** (forks/no-secret environments)                                                                                                                                                                                                                                                                    | commit `418f9fe`; PR [#522](https://github.com/openshift/networking-console-plugin/pull/522) |
| 2026-10-21 | **Hot-cluster CI infrastructure and test fixes** (rollup PR): login flow for no-auth mode, test suite updates for OCP 5.0, health-check workflow, cleanup hardening                                                                                                                                                                                                                                      | PR [#522](https://github.com/openshift/networking-console-plugin/pull/522)                   |

### Phase 3 — Runner ergonomics & refactor (Oct–Nov 2026)

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                        | Ref                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 2026-10-27 | **Custom ARC runner image** — `ci-scripts/Dockerfile.arc-runner` pre-installs oc, helm, skopeo, node, cypress cache, etc.; `runnerscaleset-custom-image.yaml` example; `ARC-RUNNER-IMAGE.md` build/push guide. Cuts per-run tool-install time                                                                                                                                                 | PR [#580](https://github.com/openshift/networking-console-plugin/pull/580) |
| 2026-11-01 | **Split `hot-cluster-e2e-run.yml` into composite actions** (Gal Kremer review follow-up): `build-plugin-image` (skopeo registry check → podman build → push, idempotent), `install-oc`, `setup-kubeconfig` (in-pod SA token + CA — no CLUSTER_API/CLUSTER_TOKEN secrets), `log-runner-env`, `setup-test-namespaces`, `collect-ci-diagnostics`; failure diagnostics preserved across the split | PR [#581](https://github.com/openshift/networking-console-plugin/pull/581) |

### Phase 4 — Continued coverage on the hot cluster (Nov 2026, same infra)

| Date       | Change                                                                                                                                              | Ref                                                                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-01 | Topology NAD-node tests                                                                                                                             | PR [#655](https://github.com/openshift/networking-console-plugin/pull/655) (OCPNETUI-31)                                                                            |
| 2026-11-01 | Topology CUDN/UDN-node tests                                                                                                                        | PR [#656](https://github.com/openshift/networking-console-plugin/pull/656) (OCPNETUI-18)                                                                            |
| 2026-11-02 | Topology resource-details drawer tests                                                                                                              | PR [#664](https://github.com/openshift/networking-console-plugin/pull/664) (OCPNETUI-138)                                                                           |
| 2026-11-02 | Topology additional-views tests                                                                                                                     | PR [#665](https://github.com/openshift/networking-console-plugin/pull/665) (OCPNETUI-139)                                                                           |
| 2026-11-06 | (open) Integration-test harness + recorded fixtures — click-driven suites without a cluster                                                         | PRs [#674](https://github.com/openshift/networking-console-plugin/pull/674), [#676](https://github.com/openshift/networking-console-plugin/pull/676) (OCPNETUI-228) |
| —          | `/hot-cluster-e2e-failures` skill: turns a GHA run URL into a self-contained HTML failure report (mochawesome JSON + screenshots + videos via `gh`) | `.claude/skills/hot-cluster-e2e-failures/`                                                                                                                          |

## Resulting architecture (as of 2026-11-09, `main`)

```text
hot-cluster-e2e.yml (workflow_dispatch: branch, test_spec)
  └─ hot-cluster-e2e-run.yml (workflow_call/dispatch)
       ├─ check-runner      (runs-on: networking-console-plugin-ci — ARC label; SA-token kubeconfig)
       ├─ build-plugin-image (ubuntu; skopeo check → podman build Dockerfile.ci → quay.io push)
       └─ run-e2e-tests     (runs-on: networking-console-plugin-ci, 60 min, concurrency per-ref)
            install-oc → setup-kubeconfig → ci-env-request (ConfigMap → ci-env-controller
            → ci-test-stack Helm install → bridge URL) → setup-test-namespaces →
            npm ci + cypress install → cypress-io/github-action@v7 (spec = input) →
            report/artifacts → collect-ci-diagnostics → test-cleanup.sh → ci-env-release

In-cluster components:
  ci-env-controller (Helm, ns ci-env) — watches trigger ConfigMaps, deploys ci-test-stack per run
  ci-test-stack (Helm) — plugin Deployment + console bridge Deployment + Route + SA/RBAC
  ARC runner scale set — label networking-console-plugin-ci, custom pre-baked image

Also on github-hosted runners: e2e.yml (PRs, skips when CONSOLE_URL secret unset)
```

Key properties: single shared hot cluster; per-run test environments (namespaces suffixed with
`github.run_id`) provisioned on demand by the in-cluster controller; no cluster-provisioning or
teardown workflows in-repo (cluster is externally maintained); auth via in-pod ServiceAccount
token — no long-lived cluster secrets in GitHub; manual dispatch only (not yet a required PR
check).
