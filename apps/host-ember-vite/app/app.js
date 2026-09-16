import Application from '@ember/application';
import compatModules from '@embroider/virtual/compat-modules';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from 'host-ember-vite/config/environment';

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  // Vite builds have no global AMD loader; the resolver and initializer loader get the
  // module map explicitly (same as the Ember Vite app blueprint).
  Resolver = Resolver.withModules(compatModules);
}

loadInitializers(App, config.modulePrefix, compatModules);
