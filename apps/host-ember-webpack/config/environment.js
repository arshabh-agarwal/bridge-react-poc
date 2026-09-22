'use strict';

module.exports = function (environment) {
  const ENV = {
    modulePrefix: 'host-ember-webpack',
    environment,
    rootURL: '/',
    locationType: 'history',
    EmberENV: {
      EXTEND_PROTOTYPES: false,
      FEATURES: {},
    },

    APP: {},

    // Consumed by the `remote-loader` service from @poc/remote-app-ember-adapter. Remotes are declared in
    // ember-cli-build.js (ModuleFederationPlugin); the name lets the service find that instance.
    moduleFederation: {
      name: 'host_ember_webpack',
    },
  };

  if (environment === 'test') {
    ENV.locationType = 'none';
    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  return ENV;
};
