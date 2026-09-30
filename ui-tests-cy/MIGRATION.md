# E2E Test Migration Log

**Epic:** [OCPNETUI-56](https://redhat.atlassian.net/browse/OCPNETUI-56)
**Started:** 2026-06-02

## Progress

### 2026-06-02 — Planning complete

- Analyzed kubevirt-ui `release-4.21` (Cypress source) and `main` (Playwright reference)
- Cypress tests removed from kubevirt-ui `main` — Playwright is the only remaining version
- The `release-4.21` Cypress tests are the primary copy source
- Classified tests by plugin ownership:
  - **networking-console-plugin**: NADs, UDNs, NetworkPolicies, Services, Routes, Ingresses (~14 tests)
  - **nmstate-console-plugin**: NNCPs, NNS, Physical networks, VM networks
  - **kubevirt-plugin**: VM-dependent tests (stay in kubevirt-ui with API-based setup)
- Plan saved to `ui-tests-cy/PLAN.md`

### 2026-06-02 — Cypress infrastructure and specs created

Created support structure under `ui-tests-cy/`:
- `support/selectors.ts` — `cy.byTestID()`, `cy.byButtonText()`, `cy.checkTitle()`, `cy.clickNavLink()`, etc.
- `support/commands.ts` — `cy.deleteResource()` (via `cy.task`), `cy.switchProject()`
- `support/nav.ts` — `cy.visitNAD()`, `cy.visitUDN()`, `cy.visitService()`
- `support/index.ts` — imports all support files, filters known console uncaught exceptions

Created views:
- `views/nad.ts` — `createNAD()`, `deleteNAD()`
- `views/udn.ts` — `createUDN()`, `deleteUDN()`
- `views/actions.ts` — `checkActionMenu()`, `getRow()`
- `views/selector-common.ts` — shared selectors

Created utils:
- `utils/const/base.ts` — `TEST_NS`, `UDN_NS`, `MINUTE`, `SECOND`
- `utils/const/nad.ts` — `NAD_BRIDGE`, `NAD_OVN`, `NAD_LOCALNET`
- `utils/types/nad.ts` — `NadData` type

Created specs (10 files):
- `tests/setup/login.cy.ts` — login verification
- `tests/setup/visit-pages.cy.ts` — page navigation checks
- `tests/networking/nad-bridge.cy.ts` — create bridge NAD
- `tests/networking/nad-localnet.cy.ts` — create + delete localnet NAD
- `tests/networking/nad-ovn.cy.ts` — create L2 overlay NAD
- `tests/networking/udn.cy.ts` — create UDN, create CUDN, delete CUDN
- `tests/networking/net-policies.cy.ts` — create NetworkPolicy with form
- `tests/networking/services.cy.ts` — create Service with YAML
- `tests/networking/routes.cy.ts` — create Route with form
- `tests/networking/ingresses.cy.ts` — create Ingress with YAML

### 2026-08-12 — Hot-cluster CI infrastructure

Added CI infrastructure adapted from kubevirt-plugin (CNV-74265):
- CI scripts: health checks, console/plugin startup, test cleanup, nginx configs
- Helm charts: `ci-test-stack` (console + plugin pods), `ci-env-controller` (lifecycle management)
- GitHub Actions: `hot-cluster-e2e.yml` + `hot-cluster-e2e-run.yml` workflows
- Composite actions: `ci-env-request` / `ci-env-release` for test environment lifecycle
- `Dockerfile.ci` with public UBI9 base images for GitHub Actions builds
- FIPS cluster workarounds (`GOLANG_FIPS=0`, `OPENSSL_FORCE_FIPS_MODE=0`)

### Next steps

- [ ] Prepare and validate hot cluster (see `ui-tests-cy/CLUSTER.md`)
- [ ] Run full E2E suite on hot cluster via GitHub Actions
- [ ] Audit data-test IDs for PatternFly 6 compatibility
- [ ] Consider building plugin image via CNO instead of dev mode
- [ ] Add CNO version compatibility check
