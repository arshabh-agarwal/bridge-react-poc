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

    // Consumed by the `remote-loader` service from @poc/bridge-ember.
    moduleFederation: {
      name: 'host_ember_vite',
      remotes: [
        { name: 'remote18', entry: 'http://localhost:3018/remoteEntry.js', type: 'module' },
        { name: 'remote19', entry: 'http://localhost:3019/remoteEntry.js', type: 'module' },
      ],
    },
  };

  if (environment === 'test') {
    ENV.locationType = 'none';
    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  return ENV;
};
