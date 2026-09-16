import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@poc/remote-app';

// Standalone mode: the remote runs on its own with basename "/".
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App basename="/" remoteName="remote19 (standalone)" />
  </StrictMode>,
);
