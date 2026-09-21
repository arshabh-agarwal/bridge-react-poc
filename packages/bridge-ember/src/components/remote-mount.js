import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

/**
 * Patch history.pushState and history.replaceState to dispatch a synthetic PopStateEvent
 * after every URL change. This is how the host and remote routers stay in sync — both
 * listen to popstate, and the browser only fires it natively on Back/Forward.
 *
 * This is the same pattern used by single-spa (13.9k stars). Their patchedUpdateState()
 * wraps pushState/replaceState globally and dispatches PopStateEvent after each call.
 * See: https://github.com/single-spa/single-spa/blob/main/src/navigation/navigation-events.js
 */
function patchHistoryIfNeeded() {
  if (window.__mfe_history_patched) return;
  window.__mfe_history_patched = true;

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args) {
    const urlBefore = window.location.href;
    const result = originalPushState(...args);
    const urlAfter = window.location.href;
    if (urlBefore !== urlAfter) {
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    }
    return result;
  };

  history.replaceState = function (...args) {
    const urlBefore = window.location.href;
    const result = originalReplaceState(...args);
    const urlAfter = window.location.href;
    if (urlBefore !== urlAfter) {
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    }
    return result;
  };
}

/**
 * Mounts a bridge-react remote into a DOM node owned by Ember.
 *
 *   <RemoteMount @remote="remote18" @basename="/remote18" @props={{hash userId="42"}} />
 *
 * On mount, patches history.pushState/replaceState to dispatch synthetic popstate events.
 * This keeps the host and remote routers in sync automatically — when the remote calls
 * pushState, Ember hears the synthetic popstate and updates its internal state. When Ember
 * navigates within the prefix, the remote hears the synthetic popstate and re-reads the URL.
 *
 * The only explicit coordination is `onHostNavigate`, which lets the remote leave its
 * prefix through Ember's router.
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
      patchHistoryIfNeeded();
      this.targetElement = element;
      const provider = await this.remoteLoader.loadProvider(this.args.remote, this.args.expose);
      if (this.torndown) return;
      this.provider = provider;
      await provider.render({
        moduleName: this.args.remote,
        dom: element,
        basename: this.basename,
        onHostNavigate: this.onHostNavigate,
        ...(this.args.props || {}),
      });
      if (this.torndown) return;
      this.status = 'ready';
    } catch (error) {
      console.error(`[bridge-ember] failed to mount ${this.args.remote}`, error);
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
}
