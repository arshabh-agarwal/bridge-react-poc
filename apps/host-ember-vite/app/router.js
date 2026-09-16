import EmberRouter from '@ember/routing/router';
import config from 'host-ember-vite/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  // Each remote gets a parent route (matches the bare prefix) plus a wildcard child
  // (matches everything under it). The parent template renders <RemoteMount>, so the
  // remote stays mounted while the URL moves anywhere inside its prefix.
  this.route('remote18', { path: '/remote18' }, function () {
    this.route('catchall', { path: '/*path' });
  });
  this.route('remote19', { path: '/remote19' }, function () {
    this.route('catchall', { path: '/*path' });
  });
});
