import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

const PORT = 4019;
const REACT_RANGE = '^19.0.0';

export default defineConfig({
  plugins: [
    federation({
      name: 'host_react19',
      dts: false,
      remotes: {
        remote18: {
          type: 'module',
          name: 'remote18',
          entry: 'http://localhost:3018/remoteEntry.js',
        },
        remote19: {
          type: 'module',
          name: 'remote19',
          entry: 'http://localhost:3019/remoteEntry.js',
        },
      },
      // The host offers its React to the share scope. A remote whose requiredVersion is
      // satisfied reuses it; otherwise the remote falls back to its own copy.
      shared: {
        react: { singleton: false, requiredVersion: REACT_RANGE },
        'react-dom': { singleton: false, requiredVersion: REACT_RANGE },
      },
    }),
    react(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', '@tanstack/react-router'],
  },
  build: {
    target: 'chrome89',
  },
  server: {
    port: PORT,
    strictPort: true,
  },
  preview: {
    port: PORT,
    strictPort: true,
  },
});
