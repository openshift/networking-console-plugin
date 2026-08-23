export const SERVICE_FORM_NS = 'default';

const byTestOr = (dataTest: string, fallback: string): Cypress.Chainable<JQuery<HTMLElement>> =>
  cy.get(`[data-test="${dataTest}"], ${fallback}`);

export const uniqueServiceName = (prefix: string): string =>
  `${prefix}-${Date.now().toString().slice(-8)}`;

export const serviceFormUrl = (namespace = SERVICE_FORM_NS): string =>
  `/k8s/ns/${namespace}/core~v1~Service/~new/form`;

export const serviceDetailsUrl = (name: string, namespace = SERVICE_FORM_NS): string =>
  `/k8s/ns/${namespace}/core~v1~Service/${name}`;

export const serviceEditUrl = (name: string, namespace = SERVICE_FORM_NS): string =>
  `/k8s/ns/${namespace}/core~v1~Service/${name}/form`;

export const dismissGuidedTourIfPresent = (): void => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-test="tour-step-footer-secondary"]').length) {
      cy.byTestID('tour-step-footer-secondary').click();
    }
  });
};

export const serviceNameField = () => byTestOr('service-name', '#service-name');
export const serviceNamespaceField = () => byTestOr('service-namespace', '#service-namespace');
export const serviceTypeToggle = () => byTestOr('service-type', '#toggle-service-type');
export const servicePortsField = () => byTestOr('service-ports', '#service-ports');
export const serviceExternalNameField = () =>
  byTestOr('service-external-name', '#service-external-name');
export const saveChangesButton = () => byTestOr('save-changes', '#save-changes');
export const selectorKeyField = () =>
  byTestOr('pairs-list-name', 'input[aria-labelledby="editor-label-header"]');
export const selectorValueField = () =>
  byTestOr('pairs-list-value', 'input[aria-labelledby="editor-selector-header"]');
export const addSelectorButton = () => byTestOr('pairs-list-add', 'button:contains("Add label")');
export const deleteSelectorButton = () =>
  byTestOr('pairs-list-delete', '[data-test-id="pairs-list__delete-from-btn"]');
export const actionsToggle = () => byTestOr('service-actions-toggle', 'button:contains("Actions")');

export const visitServiceCreateForm = (namespace = SERVICE_FORM_NS): void => {
  cy.visit(serviceFormUrl(namespace));
  dismissGuidedTourIfPresent();
  cy.contains('h2', 'Create Service', { timeout: 90000 }).should('be.visible');
  cy.contains('label', 'Form view', { timeout: 60000 }).click();
  serviceNameField().should('be.visible');
};

export const visitServiceEditForm = (name: string, namespace = SERVICE_FORM_NS): void => {
  cy.visit(serviceEditUrl(name, namespace));
  dismissGuidedTourIfPresent();
  cy.contains('h2', 'Edit Service', { timeout: 90000 }).should('be.visible');
  cy.contains('label', 'Form view', { timeout: 60000 }).click();
  serviceNameField().should('be.visible');
};

export const selectServiceType = (
  type: 'ClusterIP' | 'ExternalName' | 'LoadBalancer' | 'NodePort',
) => {
  serviceTypeToggle().click();
  cy.get(`[data-test="service-type-${type}"], [role="menuitem"]`).contains(type).click();
  serviceTypeToggle().should('contain', type);
};

const setNativeInputValue = (input: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const win = input.ownerDocument.defaultView;
  if (!win) {
    return;
  }
  const proto =
    input.tagName === 'TEXTAREA'
      ? win.HTMLTextAreaElement.prototype
      : win.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
  input.dispatchEvent(new win.Event('change', { bubbles: true }));
};

export const fillServiceName = (name: string): void => {
  serviceNameField().then(($el) => {
    setNativeInputValue($el[0] as HTMLInputElement, name);
  });
  serviceNameField().should('have.value', name);
};

export const fillSelector = (key: string, value: string, index = 0): void => {
  selectorKeyField()
    .eq(index)
    .then(($el) => {
      setNativeInputValue($el[0] as HTMLInputElement, key);
    });
  selectorValueField()
    .eq(index)
    .then(($el) => {
      setNativeInputValue($el[0] as HTMLInputElement, value);
    });
};

export const fillPorts = (portsText: string): void => {
  servicePortsField().then(($el) => {
    setNativeInputValue($el[0] as HTMLTextAreaElement, portsText);
  });
  servicePortsField().should('have.value', portsText);
};

export const submitServiceForm = (): void => {
  saveChangesButton().should('not.be.disabled').click();
};

export const getYamlEditorValue = (): Cypress.Chainable<string> =>
  cy.window().then((win) => {
    const monaco = (
      win as {
        monaco?: { editor: { getModels: () => { getValue: () => string }[] } };
      } & Window
    ).monaco;
    const fromMonaco = monaco?.editor
      ?.getModels()
      ?.map((model) => model.getValue())
      .find((value) => value?.trim());
    if (fromMonaco) {
      return fromMonaco;
    }
    const lines = win.document.querySelector('.yaml-editor .view-lines');
    return (lines?.textContent || '').replace(/\u00a0/g, ' ');
  });

export const setYamlEditorValue = (value: string): void => {
  cy.window().then((win) => {
    const monaco = (
      win as {
        monaco?: {
          editor: {
            getModels: () => { getValue: () => string; setValue: (next: string) => void }[];
          };
        };
      } & Window
    ).monaco;
    const models = monaco?.editor?.getModels() ?? [];
    const target = models.find((model) => model.getValue()?.trim()) || models[0];
    if (!target) {
      throw new Error('YAML editor is not available: no Monaco model found');
    }
    target.setValue(value);
  });
};

export const switchToYamlView = (): void => {
  cy.contains('label', 'YAML view').click();
  cy.get('.yaml-editor', { timeout: 30000 }).should('be.visible');
  cy.get('.yaml-editor .view-line', { timeout: 30000 }).should('contain', 'kind');
};

export const switchToFormView = (): void => {
  cy.contains('label', 'Form view').click();
  serviceNameField().should('be.visible');
};

export const getService = (name: string, namespace = SERVICE_FORM_NS) =>
  cy.request({
    failOnStatusCode: false,
    url: `/api/kubernetes/api/v1/namespaces/${namespace}/services/${name}`,
  });

export const expectServiceSpec = (
  name: string,
  expected: { externalName?: string; selector?: Record<string, string>; type: string },
  namespace = SERVICE_FORM_NS,
) => {
  getService(name, namespace).then((response) => {
    expect(response.status, `Service ${name} should exist`).to.eq(200);
    expect(response.body?.spec?.type).to.eq(expected.type);
    if (expected.externalName) {
      expect(response.body?.spec?.externalName).to.eq(expected.externalName);
    }
    if (expected.selector) {
      expect(response.body?.spec?.selector).to.include(expected.selector);
    }
  });
};

export const expectYamlToContain = (...snippets: string[]): void => {
  cy.get('.yaml-editor', { timeout: 30000 }).should('be.visible');
  cy.get('.yaml-editor .view-lines', { timeout: 30000 })
    .invoke('text')
    .then((text) => {
      const normalized = String(text).replace(/\u00a0/g, ' ');
      snippets.forEach((snippet) => {
        expect(normalized, `YAML should contain "${snippet}"`).to.include(snippet);
      });
    });
};

export const confirmDeleteModal = (name: string): void => {
  cy.get('body').then(($body) => {
    const nameInput = $body.find(
      '[data-test="delete-resource-modal"], input#resource-name, [data-test="confirm-modal-resource"]',
    );
    if (nameInput.length) {
      cy.wrap(nameInput.first()).clear();
      cy.wrap(nameInput.first()).type(name);
    }
  });
  cy.byTestID('confirm-action').click();
};

export const deleteServiceFromDetails = (name: string, namespace = SERVICE_FORM_NS): void => {
  cy.location('pathname').then((pathname) => {
    if (!String(pathname).includes(`/${name}`)) {
      cy.visit(serviceDetailsUrl(name, namespace));
    }
  });
  dismissGuidedTourIfPresent();
  cy.contains('h1', name, { timeout: 60000 }).should('be.visible');
  actionsToggle().should('be.visible').click();
  cy.get('[data-test="delete-services"], [data-test-id="delete-services"]').click();
  confirmDeleteModal(name);
  cy.location('pathname', { timeout: 30000 }).should('match', /service/i);
  cy.location('pathname').should('not.include', `/${name}`);
};
