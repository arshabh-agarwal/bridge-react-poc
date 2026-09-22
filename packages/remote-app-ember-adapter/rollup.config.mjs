import { babel } from '@rollup/plugin-babel';
import { Addon } from '@embroider/addon-dev/rollup';

const addon = new Addon({
  srcDir: 'src',
  destDir: 'dist',
});

export default {
  output: addon.output(),
  plugins: [
    // Modules the consuming app may import directly.
    addon.publicEntrypoints(['index.js', 'components/**/*.js', 'services/**/*.js']),
    // Modules merged into the app namespace (so `remote-loader` service and `<RemoteAppMount>` resolve).
    addon.appReexports(['components/**/*.js', 'services/**/*.js']),
    // Compiles colocated .hbs templates next to their .js components. Must run before babel.
    addon.hbs(),
    addon.dependencies(),
    babel({ extensions: ['.js'], babelHelpers: 'bundled' }),
    addon.clean(),
  ],
};
