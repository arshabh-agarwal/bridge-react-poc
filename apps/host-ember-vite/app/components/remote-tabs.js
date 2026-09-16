import Component from '@glimmer/component';
import { inject as service } from '@ember/service';

/**
 * One tab per route the remote owns. Tabs are host LinkTos into the remote's prefix; the
 * bridge-ember adapter forwards the resulting routeDidChange to the remote's router.
 */
export default class RemoteTabs extends Component {
  @service router;

  get indexRoute() {
    return `${this.args.remote}.index`;
  }

  get catchallRoute() {
    return `${this.args.remote}.catchall`;
  }

  // LinkTo's own `active` class only matches an exact model ("items/7"); treat any item as active.
  get isItems() {
    const url = this.router.currentURL || '';
    return url.startsWith(`/${this.args.remote}/items/`);
  }
}
