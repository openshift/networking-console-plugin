# E2E Test Migration Log

**Epic:** [CNV-87983](https://redhat.atlassian.net/browse/CNV-87983)
**Started:** 2026-06-02

## Progress

### 2026-06-02 — Planning complete

- Analyzed kubevirt-ui `release-4.21` (Cypress source) and `main` (Playwright reference)
- Cypress tests removed from kubevirt-ui `main` — Playwright is the only remaining version
- The `release-4.21` Cypress tests are the primary copy source (did not differ much from main)
- Classified tests by plugin ownership:
  - **networking-console-plugin**: NADs, UDNs, NetworkPolicies, Services, Routes, Ingresses (~14 tests)
  - **nmstate-console-plugin**: NNCPs, NNS, Physical networks, VM networks
  - **kubevirt-plugin**: VM-dependent tests (stay in kubevirt-ui with API-based setup)
- Plan saved to `ui/PLAN.md`

### 2026-06-02 — Cypress infrastructure and specs created

Created support structure:
- `support/selectors.ts` — `cy.byTestID()`, `cy.byButtonText()`, `cy.checkTitle()`, `cy.clickNavLink()`, etc.
- `support/commands.ts` — `cy.deleteResource()`, `cy.beforeSpec()`, `cy.switchProject()`, `cy.setupUdnNamespace()`
- `support/nav.ts` — `cy.visitNAD()`, `cy.visitUDN()`, `cy.visitService()`
- `support/index.ts` — updated to import all new support files

Created views:
- `views/nad.ts` — `createNAD()`, `deleteNAD()`
- `views/udn.ts` — `createUDN()`, `deleteUDN()`
- `views/actions.ts` — `checkActionMenu()`, `getRow()`
- `views/selector-common.ts` — shared selectors

Created utils:
- `utils/const/index.ts` — `TEST_NS`, `UDN_NS`, `K8S_KIND`, `adminOnlyDescribe`
- `utils/const/nad.ts` — `NAD_BRIDGE`, `NAD_OVN`, `NAD_LOCALNET`
- `utils/const/scale.ts` — `MINUTE`, `SECOND`
- `utils/types/nad.ts` — `NadData` interface

Created specs (8 files, ~14 test cases):
- `tests/nad-bridge.cy.ts` — create bridge NAD (CNV-3256)
- `tests/nad-localnet.cy.ts` — create + delete localnet NAD (CNV-3256, CNV-4288)
- `tests/nad-ovn.cy.ts` — create L2 overlay NAD (CNV-3256)
- `tests/udn.cy.ts` — create UDN (CNV-11867), create CUDN (CNV-11871), delete CUDN (CNV-11874)
- `tests/net-policies.cy.ts` — visit page, create NetworkPolicy with form
- `tests/services.cy.ts` — visit page, create Service with YAML
- `tests/routes.cy.ts` — visit page, create Route with form
- `tests/ingresses.cy.ts` — visit page, create Ingress with YAML

Removed: `tests/example-page.cy.ts` (template placeholder)

### Next steps

- [ ] Set up GitHub Actions hot-cluster CI
- [ ] Verify Prow integration works
- [ ] Update Jira epic CNV-87983
