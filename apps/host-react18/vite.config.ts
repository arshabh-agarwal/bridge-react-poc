import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

const PORT = 4018;
const REACT_RANGE = '^18.0.0';

export default defineConfig({
  plugins: [
    federation({
      name: 'host_react18',
      dts: false,
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
