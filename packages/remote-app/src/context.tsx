import { createContext, useContext } from 'react';

export interface RemoteContextValue {
  basename: string;
  remoteName: string;
  reactVersion: string;
  onHostNavigate?: (path: string) => void;
}

export const RemoteContext = createContext<RemoteContextValue>({
  basename: '/',
  remoteName: 'remote',
  reactVersion: 'unknown',
});

export const useRemoteContext = () => useContext(RemoteContext);
