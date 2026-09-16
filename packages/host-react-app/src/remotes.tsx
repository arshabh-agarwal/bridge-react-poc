/// <reference path="./remotes.d.ts" />
import { createTanStackRemoteApp } from '@poc/bridge-tanstack';

function Loading({ name }: { name: string }) {
  return <p style={{ opacity: 0.6 }}>Loading {name}...</p>;
}

function Failed({ error }: { error: Error }) {
  return (
    <div style={{ border: '1px solid #dc2626', padding: 12, borderRadius: 6 }}>
      <strong>Remote failed to load</strong>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}</pre>
    </div>
  );
}

// `remote18/export-app` and `remote19/export-app` are virtual modules resolved by
// @module-federation/vite from the host's `remotes` config.
export const Remote18App = createTanStackRemoteApp({
  loader: () => import('remote18/export-app'),
  loading: <Loading name="remote18" />,
  fallback: Failed,
});

export const Remote19App = createTanStackRemoteApp({
  loader: () => import('remote19/export-app'),
  loading: <Loading name="remote19" />,
  fallback: Failed,
});
