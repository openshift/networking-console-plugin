// Login must run first: every later spec reuses that browser session.
// eslint-disable-next-line simple-import-sort/imports
import './setup/login.cy.ts';

import './setup/visit-pages.cy.ts';

import './networking/ingresses.cy.ts';
import './networking/nad-bridge.cy.ts';
import './networking/nad-localnet.cy.ts';
import './networking/nad-ovn.cy.ts';
import './networking/net-policies.cy.ts';
import './networking/routes.cy.ts';
import './networking/services.cy.ts';
import './networking/topology-cudn-udn.cy.ts';
import './networking/topology-drawer.cy.ts';
import './networking/topology-nads.cy.ts';
import './networking/topology-node-view.cy.ts';
import './networking/topology-toolbar.cy.ts';
import './networking/topology-views.cy.ts';
import './networking/udn.cy.ts';
// Physical networks page is removed in this version of the plugin.
// import './networking/physical-networks.cy.ts';
