# Hot-Cluster CI Research — kubevirt-plugin & networking-console-plugin

Comparative research into moving console-plugin E2E testing onto persistent ("hot") clusters
driven by GitHub Actions + ARC self-hosted runners.

- **Story**: Scott Dickerson & Gal Kremer enabled hot-cluster CI for
  [kubevirt-ui/kubevirt-plugin](https://github.com/kubevirt-ui/kubevirt-plugin)
  ([CNV-74261](https://redhat.atlassian.net/browse/CNV-74261) epic, implemented via
  [CNV-74265](https://redhat.atlassian.net/browse/CNV-74265)); Leon Kladnitsky replicated the
  model for [openshift/networking-console-plugin](https://github.com/openshift/networking-console-plugin)
  ([OCPNETUI-56](https://redhat.atlassian.net/browse/OCPNETUI-56), under parent epic
  [CNV-87983](https://redhat.atlassian.net/browse/CNV-87983) — _Move network & nmstate E2E
  tests from kubevirt-ui to upstream plugin repos_, which drove both the Cypress choice and the
  test-migration source: Playwright specs from the internal `cnv-qe/kubevirt-ui` repo rewritten
  as Cypress upstream).

## Documents

| Document                                                                         | Contents                                                                                                                                                                                  |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [changelog-kubevirt-plugin.md](changelog-kubevirt-plugin.md)                     | Change log: POC (Apr 2026) → cluster lifecycle → Prow cutover → Prow/Tide replacement → teardown safety → Cypress→Playwright → merge enforcement (Nov 2026); ~60 PRs with dates and links |
| [changelog-networking-console-plugin.md](changelog-networking-console-plugin.md) | Change log: Cypress suite (Aug 2026) → CI scripts + Helm charts → hot-cluster workflows → custom ARC runner image → composite-action refactor → topology coverage (Nov 2026)              |
| [design-differences.md](design-differences.md)                                   | Design & implementation differences: cluster lifecycle ownership, gating model, credentials, console deployment, runner tooling, engine choice; what was deliberately ported              |
| [gha-hot-cluster-vs-jenkins.md](gha-hot-cluster-vs-jenkins.md)                   | Advantages of GHA + hot-cluster CI vs Jenkins-style centralized jobs (cost, DX, ops, fidelity, security) and the honest trade-offs                                                        |

## Sources

- Jira REST API (authenticated): CNV-74261, CNV-74265, CNV-87983, OCPNETUI-56 — full
  descriptions, comments, and status history.
- GitHub PRs/issues API for both repos (titles, merge dates, bodies).
- Local clones: `~/dev/kubevirt-plugin`, `~/dev/networking-console-plugin` (git history,
  workflow files, `ci-scripts/`).

Research date: 2026-11-09.
