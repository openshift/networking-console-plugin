const { defineConfig } = require('cypress');

module.exports = defineConfig({
  defaultCommandTimeout: 30000,
  e2e: {
    setupNodeEvents(on, config) {
      return require('./plugins/index.ts')(on, config);
    },
    specPattern: 'tests/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'support/index.ts',
  },
  env: {
    openshift: true,
  },
  fixturesFolder: 'fixtures',
  reporter: '../../node_modules/cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  retries: {
    openMode: 0,
    runMode: 1,
  },
  screenshotsFolder: './screenshots',
  video: true,
  videosFolder: './videos',
  viewportHeight: 1080,
  viewportWidth: 1920,
});
