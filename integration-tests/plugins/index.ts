const wp = require('@cypress/webpack-preprocessor');

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
  on('before:browser:launch', (browser = {}, launchOptions) => {
    if (browser.family === 'chromium' || browser.name === 'electron') {
      launchOptions.args.push('--ignore-certificate-errors');
    }
    return launchOptions;
  });
  // `config` is the resolved Cypress config
  config.baseUrl = `${process.env.BRIDGE_BASE_ADDRESS || 'http://localhost:9000/'}`;
  config.env.BRIDGE_KUBEADMIN_PASSWORD = process.env.BRIDGE_KUBEADMIN_PASSWORD;
  return config;
};
