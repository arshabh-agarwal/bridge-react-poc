'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { Webpack } = require('@embroider/webpack');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {});

  // Embroider + webpack. No Module Federation bundler plugin is needed on the host side:
  // the Ember app shares nothing with the React remotes, so @poc/bridge-ember loads them
  // purely through @module-federation/runtime.
  return require('@embroider/compat').compatBuild(app, Webpack, {
    staticAddonTestSupportTrees: true,
    staticAddonTrees: true,
    staticHelpers: true,
    staticModifiers: true,
    staticComponents: true,
    packagerOptions: {
      webpackConfig: {
        devtool: 'source-map',
      },
    },
  });
};
