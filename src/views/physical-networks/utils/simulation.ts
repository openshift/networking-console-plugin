// Test-only seam. The console resolves these models from statically declared GVKs, so a cluster
// cannot report NMState as missing through API responses alone; e2e runs set this global before the
// app boots to render the "NMState is not installed" branch against a cluster that has it. Nothing
// in production sets it.
export const isNMStateSimulatedAbsent = (): boolean =>
  (window as { __NMSTATE_SIMULATED_ABSENT__?: boolean } & Window).__NMSTATE_SIMULATED_ABSENT__ ===
  true;
