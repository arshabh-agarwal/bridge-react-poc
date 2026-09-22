/// <reference path="./remotes.d.ts" />
import { createRemoteApp } from '@poc/remote-app-tanstack-adapter';

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

// `provider_remote18` and `provider_remote19` are virtual modules resolved by
// @module-federation/vite from the host's `remotes` config.
export const Remote18App = createRemoteApp({
  loader: () => import('provider_remote18'),
  loading: <Loading name="remote18" />,
  fallback: Failed,
});

export const Remote19App = createRemoteApp({
  loader: () => import('provider_remote19'),
  loading: <Loading name="remote19" />,
  fallback: Failed,
});
