/**
 * Constants for Route Cypress tests
 * These constants should match the IDs and selectors used in the route components
 */

// Field IDs from route form (matching src/views/routes/form/constants.ts)
export const NAME_FIELD_SELECTOR = '#name';
export const HOST_FIELD_SELECTOR = '#host';
export const PATH_FIELD_SELECTOR = '#path';
export const SERVICE_FIELD_SELECTOR = '#toggle-service';
export const SERVICE_WEIGHT_FIELD_SELECTOR = '#service-weight';
export const SECURITY_FIELD_SELECTOR = '#security';
export const TLS_TERMINATION_FIELD_SELECTOR = '#tls-termination';
export const TLS_TERMINATION_POLICY_FIELD_SELECTOR = '#tls-insecureEdgeTerminationPolicy';
export const CERTIFICATE_FIELD_SELECTOR = '#certificate';
export const CA_CERTIFICATE_FIELD_SELECTOR = '#ca-certificate';
export const DESTINATION_CA_CERT_FIELD_SELECTOR = '#destination-ca-certificate';
export const KEY_FIELD_SELECTOR = '#key';
export const TARGET_PORT_DROPDOWN_TOGGLE = '#toggle-target-port'
  export const SUBMIT_BUTTON = 'button[type="submit"]'
  export const MENU_ITEM = '[role="menuitem"], [role="option"], .pf-c-dropdown__menu-item'

// Data test IDs and attributes
export const DATA_TEST_ID = {
  RESOURCE_SUMMARY: 'resource-summary',
  ROUTES_BREADCRUMB: 'routes-breadcrumb',
  EDIT_ANNOTATIONS: 'edit-annotations',
  DASHBOARD: 'dashboard',
  NAV_ITEM: 'nads-nav-item',
  CREATE_BUTTON: 'create-button',
} as const;

// Button and link text
export const BUTTON_TEXT = {
  CREATE_ROUTE: 'Create Route',
  CREATE: 'Create',
  SAVE: 'Save',
} as const;

// Route model information
export const ROUTE_MODEL = {
  GROUP: 'route.openshift.io',
  VERSION: 'v1',
  KIND: 'Route',
} as const;

// Route paths
export const ROUTE_PATHS = {
  goToRouteList: () => {
    cy.contains('nav li', 'Networking').click()
    cy.contains('nav li', 'Networking').contains('li', 'Route').click();
  }
} as const;

// Labels and text used in the UI
export const UI_LABELS = {
  NAME: 'Name',
  NAMESPACE: 'Namespace',
  DETAILS: 'Details',
  TLS: 'TLS',
  SECURITY: 'Security',
  INGRESS: 'Ingress',
  STATUS: 'Status',
  SELECT_SERVICE: 'Select a Service',
} as const;

// CSS selectors and roles
export const DETAILS_PAGE_SELECTORS = {
  TITLE: 'h1, h2, [class*="title"]',
  DETAIL_LABEL: 'dt, label, [class*="label"]',
  DETAIL_VALUE: 'dd, [class*="value"]',
} as const;

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  PAGE_LOAD: 10000,
  NAVIGATION: 30000,
  ELEMENT_VISIBLE: 15000,
  LIST_LOAD: 2000,
  DROPDOWN_WAIT: 1000,
} as const;
