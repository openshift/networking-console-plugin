const wp = require('@cypress/webpack-preprocessor');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = (on, config) => {
  const options = {
    webpackOptions: {
      module: {
        rules: [
          {
            exclude: /node_modules/,
            loader: 'esbuild-loader',
            test: /\.ts$/,
          },
        ],
      },
      resolve: {
        extensions: ['.ts', '.tsx', '.js'],
      },
    },
  };
  on('file:preprocessor', wp(options));

  let consoleErrorText = null;
  let screenshotIndex = 0;
  const errorDetailsDir = path.resolve(__dirname, '../gui-test-screenshots/error-details');

  const isConsoleErrorDetailsShot = (details) => {
    const name = String(details.name || '');
    const shotPath = String(details.path || '');
    return (
      name.includes('console-error-details') ||
      path.basename(shotPath).includes('console-error-details')
    );
  };

  on('task', {
    execOc({ args }) {
      try {
        return execSync(`oc ${args.join(' ')}`, { encoding: 'utf-8', timeout: 300000 });
      } catch {
        return null;
      }
    },
    // Stashed by support/console-error-details.ts immediately before its screenshot.
    setConsoleErrorText(text) {
      consoleErrorText = typeof text === 'string' ? text : '';
      return null;
    },
  });

  // The prefixed png basename exists only after this rename. Write the matching
  // error-details txt here so its filename is that basename with .txt.
  on('after:screenshot', async (details) => {
    const prefix = String(screenshotIndex).padStart(3, '0');
    screenshotIndex += 1;
    const renamed = path.join(
      path.dirname(details.path),
      `${prefix}.${path.basename(details.path)}`,
    );
    const text = isConsoleErrorDetailsShot(details) ? consoleErrorText : null;
    if (isConsoleErrorDetailsShot(details)) {
      consoleErrorText = null;
    }

    await fs.promises.rename(details.path, renamed);

    if (text !== null) {
      const txtPath = path.join(errorDetailsDir, `${path.parse(renamed).name}.txt`);
      await fs.promises.mkdir(errorDetailsDir, { recursive: true });
      await fs.promises.writeFile(txtPath, text, 'utf8');
    }

    return { path: renamed };
  });

  config.baseUrl = `${process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000/'}`;
  config.env.BRIDGE_KUBEADMIN_PASSWORD = process.env.BRIDGE_KUBEADMIN_PASSWORD;
  config.env.TEST_NS = process.env.TEST_NS;
  config.env.UDN_NS = process.env.UDN_NS;
  config.env.HIDE_XHR = process.env.HIDE_XHR;
  return config;
};
