import { adminOnlyDescribe } from '../../utils/const/base';
import { NAD_LOCALNET } from '../../utils/const/nad';
import { createNAD, deleteNAD } from '../../views/nad';

adminOnlyDescribe('Test secondary localnet NAD', () => {
  it('create NAD with secondary localnet network', () => {
    createNAD(NAD_LOCALNET);
  });

  it('delete NAD', () => {
    cy.visitNAD();
    deleteNAD(NAD_LOCALNET.name);
  });
});
