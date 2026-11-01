const { defineConfig } = require('cypress');

module.exports = defineConfig({
  defaultCommandTimeout: 60000,
  e2e: {
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser = {}, launchOptions) => {
        // Failure screenshots capture the runner and scale the app into the
        // browser window. Electron's default 1280x720 window shrinks the
        // 1920x1080 viewport to about 41%. Size the window so that viewport
        // fits beside the command log at full scale.
        const width = 2560;
        const height = 1440;
        if (browser.name === 'electron' && browser.isHeadless) {
          launchOptions.preferences.width = width;
          launchOptions.preferences.height = height;
        }
        if (browser.family === 'chromium' && browser.name !== 'electron') {
          launchOptions.args = (launchOptions.args || []).filter(
            (arg) => !String(arg).startsWith('--window-size='),
          );
          launchOptions.args.push(`--window-size=${width},${height}`);
          launchOptions.args.push('--force-device-scale-factor=1');
        }
        return launchOptions;
      });
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
  videoCompression: true,
  videosFolder: './gui-test-screenshots/videos/',
  viewportHeight: 1080,
  viewportWidth: 1920,
  watchForFileChanges: false,
});
