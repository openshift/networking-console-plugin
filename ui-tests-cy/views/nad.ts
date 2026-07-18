import { NadData } from '../utils/types/nad';

import { row } from './selector-common';

export const name = 'input[name="name"]';
export const description = 'input[name="description"]';
export const type = '#toggle-nads-network-type';
export const cnvBridgeLink = '[data-test-dropdown-menu="cnv-bridge"]';
export const ovnNetwork = 'button[id="ovn-k8s-cni-overlay-link"]';
export const localnet = 'button[id="ovn-k8s-cni-overlay-localnet-link"]';
export const bridgeName = 'input[name="bridge.bridge"]';
export const bridgeVlan = 'input[name="bridge.vlanTagNum"]';
export const bridgeMap = 'input[name="ovn-k8s-cni-overlay-localnet.bridgeMapping"]';
export const bridgeMTU = 'input[name="ovn-k8s-cni-overlay-localnet.mtu"]';
export const localnetVlan = 'input[name="ovn-k8s-cni-overlay-localnet.vlanID"]';
export const confirmBtn = '[data-test="confirm-action"]';
export const heading = '[data-test-section-heading="NetworkAttachmentDefinition details"]';
export const createBtn = '#save-changes';
export const macSpoofCHK = 'input[id="bridge.macspoofchk"]';
export const ovnSubnet = 'input[name="ovn-k8s-cni-overlay.subnets"]';
export const localnetSubnet = 'input[name="ovn-k8s-cni-overlay-localnet.subnets"]';
export const exclude = 'input[name="ovn-k8s-cni-overlay-localnet.excludeSubnets"]';

export const createNAD = (nad: NadData) => {
  cy.visitNAD();
  cy.byButtonText('Create NetworkAttachmentDefinition').click();
  cy.get('#form').check();
  cy.get(name, { timeout: 10000 }).should('be.visible');
  cy.get(name).clear().type(nad.name);
  cy.get(description).clear().type(nad.description);
  cy.get(type).click();
  switch (nad.type) {
    case 'Bridge': {
      cy.byButtonText('Linux bridge').click();
      cy.get(bridgeName).clear().type(nad.bridge);
      if (nad.vlan) {
        cy.get(bridgeVlan).clear().type(nad.vlan);
      }
      if (!nad.macSpoof) {
        cy.get(macSpoofCHK).uncheck();
      }
      break;
    }
    case 'OVN': {
      cy.byButtonText('L2 overlay').click();
      if (nad.subnet) {
        cy.get(ovnSubnet).type(nad.subnet);
      }
      break;
    }
    case 'Localnet': {
      cy.byButtonText('secondary localnet').click();
      cy.get(bridgeMap).clear().type(nad.bridge);
      cy.get(bridgeMTU).clear().type(nad.mtu);
      if (nad.vlan) {
        cy.get(localnetVlan).clear().type(nad.vlan);
      }
      if (nad.subnet) {
        cy.get(localnetSubnet).type(nad.subnet);
        cy.get(exclude).type(nad.exclude);
      }
      break;
    }
  }
  cy.get(createBtn).click();
  cy.get(heading).should('exist');
  cy.contains('[data-test-selector="details-item-label__Description"]', 'Description')
    .parent()
    .should('contain', nad.description);
};

export const deleteNAD = (nadName: string) => {
  cy.contains(row, nadName).find('.pf-v6-c-table__action').find('button').click();
  cy.byButtonText('Delete').click();
  cy.get(confirmBtn).click();
  cy.contains(row, nadName).should('not.exist');
};
