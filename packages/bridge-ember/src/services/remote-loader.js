import Service from '@ember/service';
import { getOwner } from '@ember/application';
import { createInstance } from '@module-federation/runtime';

/**
 * Owns the Module Federation runtime instance for this Ember app and caches bridge providers.
 *
 * Remotes are read from `config/environment.js`:
 *
 *   moduleFederation: {
 *     name: 'host_ember',
 *     remotes: [{ name: 'remote18', entry: 'http://localhost:3018/remoteEntry.js', type: 'module' }],
 *   }
 *
 * Ember shares nothing with the React remotes, so no bundler-level MF plugin is needed; the
 * runtime alone is enough to fetch and evaluate remote entries.
 */
export default class RemoteLoaderService extends Service {
  _instance = null;
  _providers = new Map();

  get config() {
    const env = getOwner(this).resolveRegistration('config:environment') || {};
    return env.moduleFederation || {};
  }

  get instance() {
    if (!this._instance) {
      const { name, remotes = [], shared } = this.config;
      this._instance = createInstance({
        name: name || 'ember_host',
        remotes,
        shared,
      });
    }
    return this._instance;
  }

  /**
   * Loads `<remote>/<expose>` and calls the bridge factory once, returning the provider
   * ({ render, destroy }). The provider keeps its own root-per-DOM map, so sharing one
   * provider across mounts is safe.
   */
  loadProvider(remoteName, expose = 'export-app') {
    const id = `${remoteName}/${expose}`;
    if (!this._providers.has(id)) {
      const promise = this.instance
        .loadRemote(id)
        .then((mod) => {
          const factory = mod && (mod.default || mod);
          if (typeof factory !== 'function') {
            throw new Error(`${id} does not export a bridge component factory`);
          }
          return factory();
        })
        .catch((error) => {
          this._providers.delete(id);
          throw error;
        });
      this._providers.set(id, promise);
    }
    return this._providers.get(id);
  }
}
