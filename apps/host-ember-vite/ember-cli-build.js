'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');
const { compatBuild } = require('@embroider/compat');

module.exports = async function (defaults) {
  const { buildOnce } = await import('@embroider/vite');
  const app = new EmberApp(defaults, {});

  // Embroider + Vite. As with the webpack flavor, no Module Federation bundler plugin is
  // needed on the host side: @poc/remote-app-ember-adapter loads remotes via @module-federation/runtime.
  return compatBuild(app, buildOnce);
};
