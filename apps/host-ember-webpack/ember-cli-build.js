'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { Webpack } = require('@embroider/webpack');
const { ModuleFederationPlugin } = require('@module-federation/enhanced/webpack');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {});

  return require('@embroider/compat').compatBuild(app, Webpack, {
    staticAddonTestSupportTrees: true,
    staticAddonTrees: true,
    staticHelpers: true,
    staticModifiers: true,
    staticComponents: true,
    packagerOptions: {
      webpackConfig: {
        devtool: 'source-map',
        plugins: [
          // Module Federation host. The plugin embeds and initialises the MF runtime before the
          // app boots; @poc/bridge-ember's `remote-loader` service picks that instance up by name.
          // Remotes are Vite ESM builds, so point at their manifest: it carries `type: 'module'`
          // and lets a webpack host consume them without any extra config.
          new ModuleFederationPlugin({
            name: 'host_ember_webpack',
            remotes: {
              remote18: 'remote18@http://localhost:3018/mf-manifest.json',
              remote19: 'remote19@http://localhost:3019/mf-manifest.json',
            },
            // Ember shares nothing with the React remotes.
            shared: {},
            dts: false,
            manifest: false,
          }),
        ],
      },
    },
  });
};
