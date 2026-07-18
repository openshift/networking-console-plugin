import { adminOnlyDescribe } from '../../utils/const/base';
import { NAD_BRIDGE } from '../../utils/const/nad';
import { createNAD } from '../../views/nad';

adminOnlyDescribe('Test linux bridge NAD', () => {
  it('create NAD with MAC Spoof checked', () => {
    createNAD(NAD_BRIDGE);
  });
});
