import '../support/login'; // Import to register custom commands and types
import {
  PATH_FIELD_SELECTOR,
  TARGET_PORT_DROPDOWN_TOGGLE,
  DATA_TEST_ID,
  BUTTON_TEXT,
  ROUTE_PATHS,
  UI_LABELS,
  DETAILS_PAGE_SELECTORS,
  TIMEOUTS,
  HOST_FIELD_SELECTOR,
  NAME_FIELD_SELECTOR,
  SERVICE_FIELD_SELECTOR,
  ROUTE_MODEL,
  MENU_ITEM,
  SUBMIT_BUTTON,
} from '../constants/routes';

describe('Route Creation and Details Page', () => {
  const routeName = `test-route-${Date.now()}`;
  const routeHostname = `test-route-${Date.now()}.example.com`;
  const routePath = '/test';
  const testNamespace = 'default';

  before(() => {
    // @ts-ignore - Custom command defined in support/login.ts
    cy.login();
    // Ensure we're in the correct namespace

    ROUTE_PATHS.goToRouteList()
    cy.wait(TIMEOUTS.LIST_LOAD);
  });

  after(() => {
    // Cleanup: Delete the test route if it exists
    cy.exec(
      `oc delete route ${routeName} -n ${testNamespace} || true`,
      { failOnNonZeroExit: false }
    );
    
  });

  it('should create a new route and verify details page', () => {
    // Step 1: Navigate to Routes list page
    cy.wait(TIMEOUTS.LIST_LOAD);


    cy.contains('button', BUTTON_TEXT.CREATE_ROUTE).click();

    // Wait for the form page to load
    cy.url({ timeout: TIMEOUTS.PAGE_LOAD }).should('include', '/~new/form');
    cy.wait(TIMEOUTS.LIST_LOAD);

    // Step 3: Fill in the route form
    // Fill in the name field (required) - using field ID from constants
    cy.get(NAME_FIELD_SELECTOR, { timeout: TIMEOUTS.PAGE_LOAD })
      .should('be.visible')
      .should('not.be.disabled')
      .clear()
      .type(routeName);

    // Fill in the hostname field (optional)
    cy.get(HOST_FIELD_SELECTOR)
      .should('be.visible')
      .clear()
      .type(routeHostname);

    // Fill in the path field (optional)
    cy.get(PATH_FIELD_SELECTOR)
      .should('be.visible')
      .clear()
      .type(routePath);

    // Step 4: Select a service (required)
    // The service selector uses a Select component with dropdown
    cy.get(SERVICE_FIELD_SELECTOR).should('be.visible').click();
    cy.get(MENU_ITEM).first().click();
    cy.wait(TIMEOUTS.DROPDOWN_WAIT);

    cy.get(TARGET_PORT_DROPDOWN_TOGGLE).click();
    cy.get(MENU_ITEM).first().click();
    cy.wait(TIMEOUTS.DROPDOWN_WAIT);

    // Step 5: Submit the form
    cy.get(SUBMIT_BUTTON).click();



    // Step 6: Wait for navigation to details page
    cy.url({ timeout: TIMEOUTS.NAVIGATION }).should('include', `/${ROUTE_MODEL.GROUP}~${ROUTE_MODEL.VERSION}~${ROUTE_MODEL.KIND}/${routeName}`);

    // Step 7: Verify details page shows the route information
    // Check that the route name is displayed in the page
    cy.contains(DETAILS_PAGE_SELECTORS.TITLE, routeName, { timeout: TIMEOUTS.ELEMENT_VISIBLE }).should('be.visible');

    // Verify route details section exists
    cy.getByTestId(DATA_TEST_ID.RESOURCE_SUMMARY, { timeout: TIMEOUTS.PAGE_LOAD }).should('exist');

    // Verify the name field in details
    cy.getByTestId(DATA_TEST_ID.RESOURCE_SUMMARY).within(() => {
      cy.contains(DETAILS_PAGE_SELECTORS.DETAIL_LABEL, UI_LABELS.NAME).should('be.visible');
      cy.contains(DETAILS_PAGE_SELECTORS.DETAIL_VALUE, routeName).should('be.visible');
    });

    // Verify namespace is displayed
    cy.getByTestId(DATA_TEST_ID.RESOURCE_SUMMARY).within(() => {
      cy.contains(DETAILS_PAGE_SELECTORS.DETAIL_LABEL, UI_LABELS.NAMESPACE).should('be.visible');
      cy.contains('dd, a', testNamespace).should('be.visible');
    });

    // Verify hostname if it was set (might be in a different section)
    cy.contains(routeHostname).should('be.visible');

    // Verify path if it was set
    cy.contains(routePath).should('be.visible');

    // Step 8: Verify we can navigate back to routes list via breadcrumbs
    cy.getByTestId(DATA_TEST_ID.ROUTES_BREADCRUMB).click();
    cy.url().should('include', `/${ROUTE_MODEL.GROUP}~${ROUTE_MODEL.VERSION}~${ROUTE_MODEL.KIND}`);
    cy.url().should('not.include', routeName);
  });
});
