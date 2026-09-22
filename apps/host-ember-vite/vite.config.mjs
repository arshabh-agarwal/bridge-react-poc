import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    classicEmberSupport(),
    ember(),
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
    // Module Federation host. The plugin injects a host-init script into index.html that
    // initialises the MF runtime before the Ember app boots; @poc/remote-app-ember-adapter's
    // `remote-loader` service picks that instance up by name.
    federation({
      name: 'host_ember_vite',
      dts: false,
      dev: { disableDynamicRemoteTypeHints: true },
      remotes: {
        provider_remote18: {
          type: 'module',
          name: 'provider_remote18',
          entry: 'http://localhost:3018/remoteEntry.js',
        },
        provider_remote19: {
          type: 'module',
          name: 'provider_remote19',
          entry: 'http://localhost:3019/remoteEntry.js',
        },
      },
      // Ember shares nothing with the React remotes.
      shared: {},
    }),
  ],
  build: {
    // Required by @module-federation/vite (top-level await in the generated init code).
    target: 'chrome89',
  },
  server: {
    port: 4201,
    strictPort: true,
  },
});
