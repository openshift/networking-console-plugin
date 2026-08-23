import {
  addSelectorButton,
  deleteSelectorButton,
  deleteServiceFromDetails,
  expectServiceSpec,
  expectYamlToContain,
  fillPorts,
  fillSelector,
  fillServiceName,
  getService,
  getYamlEditorValue,
  saveChangesButton,
  selectorKeyField,
  selectorValueField,
  selectServiceType,
  SERVICE_FORM_NS,
  serviceExternalNameField,
  serviceNameField,
  serviceNamespaceField,
  servicePortsField,
  serviceTypeToggle,
  setYamlEditorValue,
  submitServiceForm,
  switchToFormView,
  switchToYamlView,
  uniqueServiceName,
  visitServiceCreateForm,
  visitServiceEditForm,
} from '../support/service-form';

describe('Service creation and editing form', { testIsolation: false }, () => {
  const createdServices: string[] = [];
  const track = (name: string): string => {
    createdServices.push(name);
    return name;
  };

  before(() => {
    cy.login();
  });

  after(() => {
    createdServices.splice(0).forEach((name) => {
      cy.visit(`/k8s/ns/${SERVICE_FORM_NS}/core~v1~Service/${name}`, { failOnStatusCode: false });
      cy.get('body').then(($body) => {
        if ($body.find('[data-test="service-actions-toggle"], button:contains("Actions")').length) {
          deleteServiceFromDetails(name);
        }
      });
    });
    cy.logout();
  });

  it('creates a ClusterIP Service via form with a pod selector and a single port', () => {
    const name = track(uniqueServiceName('e2e-clusterip'));
    visitServiceCreateForm();

    fillServiceName(name);
    serviceNamespaceField().should('have.value', SERVICE_FORM_NS);
    serviceTypeToggle().should('contain', 'ClusterIP');
    fillSelector('app', 'e2e-clusterip');
    fillPorts('http:80:8080/TCP');
    submitServiceForm();

    cy.contains('h1', name, { timeout: 60000 }).should('be.visible');
    expectServiceSpec(name, { selector: { app: 'e2e-clusterip' }, type: 'ClusterIP' });
  });

  it('keeps selector and ports visible for NodePort and creates the Service', () => {
    const name = track(uniqueServiceName('e2e-nodeport'));
    visitServiceCreateForm();

    selectServiceType('NodePort');
    selectorKeyField().should('be.visible');
    servicePortsField().should('be.visible');
    serviceExternalNameField().should('not.exist');

    fillServiceName(name);
    fillSelector('app', 'e2e-nodeport');
    fillPorts('http:80:8080/TCP');
    submitServiceForm();

    cy.contains('h1', name, { timeout: 60000 }).should('be.visible');
    cy.contains('Node port').should('be.visible');
    expectServiceSpec(name, { selector: { app: 'e2e-nodeport' }, type: 'NodePort' });
  });

  it('keeps selector and ports visible for LoadBalancer and creates the Service', () => {
    const name = track(uniqueServiceName('e2e-lb'));
    visitServiceCreateForm();

    selectServiceType('LoadBalancer');
    selectorKeyField().should('be.visible');
    servicePortsField().should('be.visible');
    serviceExternalNameField().should('not.exist');

    fillServiceName(name);
    fillSelector('app', 'e2e-lb');
    fillPorts('http:80:8080/TCP');
    submitServiceForm();

    cy.contains('h1', name, { timeout: 60000 }).should('be.visible');
    expectServiceSpec(name, { selector: { app: 'e2e-lb' }, type: 'LoadBalancer' });
  });

  it('shows ExternalName and hides selector and ports, then creates the Service', () => {
    const name = track(uniqueServiceName('e2e-extname'));
    visitServiceCreateForm();

    selectServiceType('ExternalName');
    serviceExternalNameField().should('be.visible');
    selectorKeyField().should('not.exist');
    servicePortsField().should('not.exist');
    saveChangesButton().should('be.disabled');

    fillServiceName(name);
    serviceExternalNameField().type('example.com');
    submitServiceForm();

    cy.contains('h1', name, { timeout: 60000 }).should('be.visible');
    expectServiceSpec(name, { externalName: 'example.com', type: 'ExternalName' });
  });

  it('adds and removes multiple port entries in the ports field', () => {
    visitServiceCreateForm();
    fillServiceName('e2e-ports');
    fillSelector('app', 'e2e-ports');

    fillPorts('http:80:8080/TCP\nmetrics:9090:9090/TCP');
    servicePortsField().should('have.value', 'http:80:8080/TCP\nmetrics:9090:9090/TCP');
    saveChangesButton().should('not.be.disabled');

    fillPorts('http:80:8080/TCP');
    servicePortsField().should('have.value', 'http:80:8080/TCP');
  });

  it('adds selector pairs and previews matching pods', () => {
    visitServiceCreateForm();

    fillSelector('app', 'MyApp');
    addSelectorButton().click();
    selectorKeyField().should('have.length', 2);
    fillSelector('tier', 'frontend', 1);
    selectorKeyField().should('have.length', 2);

    deleteSelectorButton().eq(1).click();
    selectorKeyField().should('have.length', 1);

    cy.byTestID('show-matching-pods').click();
    cy.byTestID('selector-preview-title', { timeout: 30000 }).should('be.visible');
  });

  it('syncs form changes into YAML and YAML changes back into the form', () => {
    const name = uniqueServiceName('e2e-sync');
    visitServiceCreateForm();

    fillServiceName(name);
    fillSelector('app', 'synced');
    fillPorts('http:80:8080/TCP');
    selectServiceType('NodePort');

    switchToYamlView();
    expectYamlToContain(`name: ${name}`, 'type: NodePort', 'app: synced');
    getYamlEditorValue().then((yaml) => {
      const updated = yaml
        .replace(`name: ${name}`, `name: ${name}-from-yaml`)
        .replace('type: NodePort', 'type: ClusterIP');
      setYamlEditorValue(updated);
    });

    switchToFormView();
    serviceNameField().should('have.value', `${name}-from-yaml`);
    serviceTypeToggle().should('contain', 'ClusterIP');
  });

  it('shows validation errors for missing and invalid fields', () => {
    visitServiceCreateForm();

    serviceNameField().clear().blur();
    cy.contains('Name is required').should('be.visible');
    saveChangesButton().should('be.disabled');

    fillServiceName(uniqueServiceName('e2e-invalid'));
    fillSelector('', '', 0);
    cy.contains('Selector is required').should('be.visible');

    fillSelector('app', 'valid');
    fillPorts('not-a-port');
    cy.contains('Ports must use the format [name:]port:targetPort/PROTOCOL').should('be.visible');
    saveChangesButton().should('be.disabled');

    fillPorts('http:99999:80/TCP');
    cy.contains('Port must be between 1 and 65535').should('be.visible');

    selectServiceType('ExternalName');
    serviceExternalNameField().type('x').clear().blur();
    cy.contains('External name is required').should('be.visible');
    serviceExternalNameField().type('Not_A_Host');
    cy.contains('External name must be a valid hostname').should('be.visible');
    saveChangesButton().should('be.disabled');
  });

  it('edits an existing Service and pre-populates form fields', () => {
    const name = track(uniqueServiceName('e2e-edit'));
    visitServiceCreateForm();
    fillServiceName(name);
    fillSelector('app', 'before-edit');
    fillPorts('http:80:8080/TCP');
    submitServiceForm();
    cy.contains('h1', name, { timeout: 60000 }).should('be.visible');

    visitServiceEditForm(name);
    serviceNameField().should('have.value', name).and('be.disabled');
    serviceNamespaceField().should('have.value', SERVICE_FORM_NS).and('be.disabled');
    serviceTypeToggle().should('contain', 'ClusterIP');
    selectorKeyField().should('have.value', 'app');
    selectorValueField().should('have.value', 'before-edit');
    servicePortsField().should('contain.value', '80:8080/TCP');

    fillSelector('app', 'after-edit');
    fillPorts('http:8080:9090/TCP');
    submitServiceForm();

    cy.contains('h1', name, { timeout: 60000 }).should('be.visible');
    expectServiceSpec(name, { selector: { app: 'after-edit' }, type: 'ClusterIP' });
    getService(name).its('body.spec.ports.0.port').should('eq', 8080);
  });

  it('deletes a created Service from the details page', () => {
    const name = uniqueServiceName('e2e-delete');
    visitServiceCreateForm();
    fillServiceName(name);
    fillSelector('app', 'e2e-delete');
    fillPorts('80:8080/TCP');
    submitServiceForm();
    cy.contains('h1', name, { timeout: 60000 }).should('be.visible');

    deleteServiceFromDetails(name);
    cy.visit(`/k8s/ns/${SERVICE_FORM_NS}/core~v1~Service`);
    cy.byTestID('name-filter-input').type(name);
    cy.contains('[data-test="resource-row"]', name).should('not.exist');
  });
});
