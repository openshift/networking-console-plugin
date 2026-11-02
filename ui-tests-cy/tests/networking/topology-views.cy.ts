import {
  expectPrototypeSvgText,
  expectPrototypeSvgTextAbsent,
  openPrototypeViewMenu,
  selectPrototypeView,
  visitPrototypeTopology,
} from '../../views/topology';

describe('OCPNETUI-139: Network topology additional views', () => {
  beforeEach(() => {
    visitPrototypeTopology();
  });

  it('lists Owner, Namespace, Network, and Resource in the view menu', () => {
    openPrototypeViewMenu();
    ['Owner', 'Namespace', 'Node', 'Network', 'Resource'].forEach((view) => {
      cy.contains('[role="option"] .pf-v6-c-menu__item-text', new RegExp(`^${view}$`)).should(
        'be.visible',
      );
    });
  });

  it('shows Owner view grouped by Deployment and VirtualMachine owners', () => {
    selectPrototypeView('Owner');
    expectPrototypeSvgText('Logical networks');
    expectPrototypeSvgText('Deployment/app-000');
    expectPrototypeSvgText('VirtualMachine/vm-000');
    expectPrototypeSvgTextAbsent('worker-0');
    cy.contains('svg text', 'demo-apps').should('be.visible');
    cy.get('.pf-topology__edge__link').should('have.length.at.least', 1);
  });

  it('shows Namespace view grouped by Kubernetes namespace', () => {
    selectPrototypeView('Namespace');
    expectPrototypeSvgText('Logical networks');
    ['demo-apps', 'virtualization', 'openshift-monitoring', 'payments'].forEach((namespace) => {
      expectPrototypeSvgText(namespace);
    });
    expectPrototypeSvgTextAbsent('worker-0');
    expectPrototypeSvgTextAbsent('Deployment/app-000');
    expectPrototypeSvgTextAbsent('VirtualMachine/vm-000');
    cy.get('.pf-topology__edge__link').should('have.length.at.least', 1);
  });

  it('shows Network view with logical networks and cluster fabric', () => {
    selectPrototypeView('Network');
    expectPrototypeSvgText('Logical networks');
    expectPrototypeSvgText('worker-0');
    expectPrototypeSvgText('br-ex');
    expectPrototypeSvgText('ens5');
    expectPrototypeSvgText('bond0');
    expectPrototypeSvgText('app-000');
    cy.contains('.pf-topology__group__label', 'worker-0').should('be.visible');
    cy.get('.pf-topology__node').should('have.length.at.least', 20);
    cy.get('.pf-topology__edge__link').should('have.length.at.least', 20);
  });

  it('shows Resource view with individual attachments and underlay resources', () => {
    selectPrototypeView('Resource');
    expectPrototypeSvgText('Logical networks');
    expectPrototypeSvgText('worker-0');
    expectPrototypeSvgText('br-ex');
    expectPrototypeSvgText('ovn-k8s-mp0');
    expectPrototypeSvgText('gene_100');
    expectPrototypeSvgText('app-000');
    expectPrototypeSvgText('vm-000');
    cy.get('.ocs-pf-topo-node--kind-bridge').should('exist');
    cy.get('.ocs-pf-topo-node--kind-tunnel').should('exist');
    cy.get('.ocs-pf-topo-node--kind-port').should('exist');
    cy.get('.pf-topology__node').should('have.length.at.least', 30);
    cy.get('.pf-topology__edge__link').should('have.length.at.least', 30);
  });

  it('switches between Owner, Namespace, Network, and Resource views', () => {
    selectPrototypeView('Owner');
    expectPrototypeSvgText('Deployment/app-000');

    selectPrototypeView('Namespace');
    expectPrototypeSvgTextAbsent('Deployment/app-000');
    expectPrototypeSvgText('demo-apps');

    selectPrototypeView('Network');
    expectPrototypeSvgText('bond0');
    expectPrototypeSvgText('worker-0');

    selectPrototypeView('Resource');
    expectPrototypeSvgText('gene_100');
    expectPrototypeSvgText('ovn-k8s-mp0');

    selectPrototypeView('Node');
    expectPrototypeSvgText('worker-0');
    expectPrototypeSvgText('br-ex');
    cy.get('.ocs-pf-topo-node--kind-bridge').should('exist');
  });
});
