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

  on('task', {
    execOc({ args }) {
      try {
        return execSync(`oc ${args.join(' ')}`, { encoding: 'utf-8', timeout: 300000 });
      } catch {
        return null;
      }
    },
  });

  let screenshotIndex = 0;
  on('after:screenshot', (details) => {
    const prefix = String(screenshotIndex).padStart(3, '0');
    screenshotIndex += 1;
    const renamed = path.join(
      path.dirname(details.path),
      `${prefix}.${path.basename(details.path)}`,
    );

    return new Promise((resolve, reject) => {
      fs.rename(details.path, renamed, (err) => (err ? reject(err) : resolve({ path: renamed })));
    });
  });

  config.baseUrl = `${process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000/'}`;
  config.env.BRIDGE_KUBEADMIN_PASSWORD = process.env.BRIDGE_KUBEADMIN_PASSWORD;
  config.env.TEST_NS = process.env.TEST_NS;
  config.env.UDN_NS = process.env.UDN_NS;
  config.env.HIDE_XHR = process.env.HIDE_XHR;
  return config;
};
