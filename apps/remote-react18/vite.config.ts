import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

const PORT = 3018;
const REACT_RANGE = '^18.0.0';

export default defineConfig({
  plugins: [
    federation({
      name: 'provider_remote18',
      filename: 'remoteEntry.js',
      manifest: true,
      dts: false,
      exposes: {
        '.': './src/main.ts',
      },
      // Non-singleton + requiredVersion: reuse the host's React only when it satisfies the
      // range, otherwise load this remote's own copy. That is what isolates React 18 from
      // React 19 hosts. The plugin auto-discovers subpaths (react/jsx-runtime, react-dom/client).
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
    cors: true,
    origin: `http://localhost:${PORT}`,
  },
  preview: {
    port: PORT,
    strictPort: true,
    cors: true,
  },
});
