/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

import * as path from 'path';

import { Configuration as WebpackConfiguration } from 'webpack';
import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';

import { ConsoleRemotePlugin } from '@openshift-console/dynamic-plugin-sdk-webpack';

import { extensions, pluginMetadata } from './plugin-manifest';

const CopyWebpackPlugin = require('copy-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration;
}

const config: Configuration = {
  context: path.resolve(__dirname, 'src'),
  devServer: {
    // Allow bridge running in a container to connect to the plugin dev server.
    allowedHosts: 'all',
    client: {
      progress: true,
      webSocketURL: {
        port: process.env.PORT || 9001,
      },
    },
    devMiddleware: {
      writeToDisk: true,
    },
    headers: {
      'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
    hot: true,
    liveReload: true,
    port: process.env.PORT || 9001,
    static: {
      directory: path.join(__dirname, 'dist'),
    },
  },
  devtool: 'source-map',
  entry: {},
  mode: 'development',
  module: {
    rules: [
      {
        exclude: /node_modules\/(?!(@kubevirt-ui)\/kubevirt-api).*/,
        test: /\.(jsx?|tsx?)$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json'),
              transpileOnly: true,
            },
          },
        ],
      },
      {
        test: /\.s?css$/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'resolve-url-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                outputStyle: 'compressed',
              },
              sourceMap: true,
            },
          },
        ],
      },
      {
        loader: 'file-loader',
        options: {
          name: 'assets/[name].[ext]',
        },
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot|otf)(\?.*$|$)/,
      },
    ],
  },
  optimization: {
    chunkIds: 'named',
    minimize: false,
  },
  output: {
    chunkFilename: '[name]-chunk.js',
    filename: '[name]-bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new ConsoleRemotePlugin({
      extensions,
      pluginMetadata,
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, 'locales'), to: 'locales' }],
    }),
  ],
  resolve: {
    alias: {
      '@console/internal': path.join(
        __dirname,
        './node_modules/@openshift-console/dynamic-plugin-sdk/lib',
      ),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    plugins: [new TsconfigPathsPlugin()],
  },
};

if (process.env.NODE_ENV === 'production') {
  config.mode = 'production';
  if (config.output) {
    config.output.filename = '[name]-bundle-[hash].min.js';
    config.output.chunkFilename = '[name]-chunk-[chunkhash].min.js';
  }

  if (config.optimization) {
    config.optimization.chunkIds = 'deterministic';
    config.optimization.minimize = true;
  }
}

export default config;
