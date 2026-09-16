'use strict';

module.exports = function (environment) {
  const ENV = {
    modulePrefix: 'host-ember-vite',
    environment,
    rootURL: '/',
    locationType: 'history',
    EmberENV: {
      EXTEND_PROTOTYPES: false,
      FEATURES: {},
    },

    APP: {},

    // Consumed by the `remote-loader` service from @poc/bridge-ember. Remotes are declared in
    // vite.config.mjs (@module-federation/vite); the name lets the service find that instance.
    moduleFederation: {
      name: 'host_ember_vite',
    },
  };

  if (environment === 'test') {
    ENV.locationType = 'none';
    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  return ENV;
};
