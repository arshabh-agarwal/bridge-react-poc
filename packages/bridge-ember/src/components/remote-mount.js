import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

/**
 * Mounts a bridge-react remote into a DOM node owned by Ember.
 *
 *   <RemoteMount @remote="remote18" @basename="/remote18" @props={{hash userId="42"}} />
 *
 * The host route claims a URL prefix (typically via a wildcard child route) and hands it to the
 * remote through `basename`. Route ownership then splits by prefix:
 *   - the remote's own router handles everything under `basename`,
 *   - host-driven navigation inside the prefix is forwarded by dispatching a synthetic `popstate`
 *     (react-router only listens to popstate),
 *   - the remote can leave the prefix through `onHostNavigate`, which goes through Ember's router.
 */
export default class RemoteMount extends Component {
  @service remoteLoader;
  @service router;

  @tracked status = 'loading';
  @tracked error = null;

  provider = null;
  // Note: do not name this `element`; Glimmer components reserve that property.
  targetElement = null;
  torndown = false;
  listeningToRouter = false;

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
      this.router.on('routeDidChange', this.onRouteDidChange);
      this.listeningToRouter = true;
    } catch (error) {
      console.error(`[bridge-ember] failed to mount ${this.args.remote}`, error);
      this.error = error;
      this.status = 'error';
    }
  }

  @action
  unmount(element) {
    this.torndown = true;
    if (this.listeningToRouter) {
      this.router.off('routeDidChange', this.onRouteDidChange);
      this.listeningToRouter = false;
    }
    if (this.provider) {
      this.provider.destroy({ moduleName: this.args.remote, dom: element });
      this.provider = null;
    }
  }

  @action
  onRouteDidChange() {
    // Ember already pushed the new URL; tell the remote's router to re-read window.location.
    if (window.location.pathname.startsWith(this.basename)) {
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    }
  }

  @action
  onHostNavigate(path) {
    this.router.transitionTo(path);
  }

  /**
   * Remote -> host sync. The remote already pushed the new URL; Ember's router never sees
   * pushState, so its currentURL / active LinkTos go stale. Re-sync with a replace transition.
   * Stamping `path` onto the existing history state first makes Ember's HistoryLocation treat
   * the URL as already current, so it does not call replaceState and clobber react-router's
   * own history state.
   */
  @action
  onRouteChange(url) {
    if (this.torndown || this.router.currentURL === url) return;
    window.history.replaceState({ ...(window.history.state || {}), path: url }, '', url);
    this.router.replaceWith(url);
  }
}
