import { getPublicEnvFlag } from '../../support/env';
import { adminOnlyDescribe } from '../../utils/const/base';
import { NAD_LOCALNET } from '../../utils/const/nad';
import { createNAD, deleteNAD } from '../../views/nad';

// The form validates the physical network name against the cluster's OVN
// bridge mappings; without any, a secondary localnet NAD cannot be created.
const describeLocalnet = getPublicEnvFlag('OVN_HAS_BRIDGE_MAPPINGS')
  ? adminOnlyDescribe
  : describe.skip;

describeLocalnet('Test secondary localnet NAD', () => {
  it('create NAD with secondary localnet network', function () {
    createNAD(NAD_LOCALNET, 'secondary localnet');
  });

  it('delete NAD', function () {
    cy.visitNAD();
    deleteNAD(NAD_LOCALNET.name);
  });
});
