import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

/**
 * Mounts a bridge-react remote into a DOM node owned by Ember.
 *
 *   <RemoteAppMount @remote="provider_remote18" @basename="/remote18" @props={{hash userId="42"}} />
 *
 * Route sync between host and remote works differently in each direction:
 *
 * Ember host → TanStack remote: TanStack Router monkey-patches history.pushState/replaceState,
 * so it picks up Ember's URL changes automatically. No action needed here.
 *
 * TanStack remote → Ember host: Ember doesn't observe pushState, so the remote calls
 * `onRouteChange(url)` on every internal PUSH/REPLACE navigation. This adapter re-syncs
 * Ember's router state via `replaceWith`.
 *
 * Browser back/forward: both routers independently listen to the native popstate event.
 *
 * The only other coordination is `onHostNavigate`, which lets the remote leave its prefix
 * through Ember's router.
 */
export default class RemoteAppMount extends Component {
  @service remoteLoader;
  @service router;

  @tracked status = 'loading';
  @tracked error = null;

  provider = null;
  // Note: do not name this `element`; Glimmer components reserve that property.
  targetElement = null;
  torndown = false;

  get isLoading() {
    return this.status === 'loading';
  }

  get isError() {
    return this.status === 'error';
  }

  get basename() {
    return this.args.basename || '/';
  }

  @action
  async mount(element) {
    try {
      this.targetElement = element;
      const provider = await this.remoteLoader.loadProvider(this.args.remote, this.args.expose);
      if (this.torndown) return;
      this.provider = provider;
      await provider.render({
        moduleName: this.args.remote,
        dom: element,
        basename: this.basename,
        onHostNavigate: this.onHostNavigate,
        onRouteChange: this.onRouteChange,
        ...(this.args.props || {}),
      });
      if (this.torndown) return;
      this.status = 'ready';
    } catch (error) {
      console.error(`[remote-app-ember-adapter] failed to mount ${this.args.remote}`, error);
      this.error = error;
      this.status = 'error';
    }
  }

  @action
  unmount(element) {
    this.torndown = true;
    if (this.provider) {
      this.provider.destroy({ moduleName: this.args.remote, dom: element });
      this.provider = null;
    }
  }

  @action
  onHostNavigate(path) {
    this.router.transitionTo(path);
  }

  /**
   * Remote → host sync. The remote already pushed the new URL via pushState; Ember's router
   * doesn't observe pushState, so its currentURL and active LinkTos go stale. Re-sync with
   * a replace transition. Stamping `path` onto the existing history state first makes Ember's
   * HistoryLocation treat the URL as already current, so it does not call replaceState and
   * clobber the remote's own history state.
   */
  @action
  onRouteChange(url) {
    if (this.torndown || this.router.currentURL === url) return;
    window.history.replaceState({ ...(window.history.state || {}), path: url }, '', url);
    this.router.replaceWith(url);
  }
}
