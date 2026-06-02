const { defineConfig } = require('cypress');

module.exports = defineConfig({
  defaultCommandTimeout: 60000,
  e2e: {
    setupNodeEvents(on, config) {
      return require('./plugins/index.ts')(on, config);
    },
    specPattern: 'tests/**/*.cy.ts',
    supportFile: 'support/index.ts',
    testIsolation: false,
  },
  fixturesFolder: false,
  pageLoadTimeout: 120000,
  reporter: '../node_modules/cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  retries: {
    openMode: 0,
    runMode: 0,
  },
  screenshotOnRunFailure: true,
  screenshotsFolder: './gui-test-screenshots/screenshots/',
  trashAssetsBeforeRuns: true,
  video: true,
  videosFolder: './gui-test-screenshots/videos/',
  viewportHeight: 1080,
  viewportWidth: 1920,
  watchForFileChanges: false,
});
