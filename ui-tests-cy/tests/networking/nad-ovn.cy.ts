import { adminOnlyDescribe } from '../../utils/const/base';
import { NAD_OVN } from '../../utils/const/nad';
import { createNAD } from '../../views/nad';

adminOnlyDescribe('Test L2 overlay NAD', () => {
  it('create NAD with L2 overlay network', () => {
    createNAD(NAD_OVN);
  });
});
