import { createRoot } from 'react-dom/client';
import { createBridgeComponent } from '@module-federation/bridge-react/v19';
import { App, createDeferredUnmountRender, type AppProps } from '@poc/remote-app';

function Root(props: AppProps) {
  return <App {...props} remoteName="remote19" />;
}

// Exposed as `remote19/export-app`. The bridge turns this into a provider with
// render({ dom, basename, ...props }) / destroy({ dom }).
export default createBridgeComponent<AppProps>({
  rootComponent: Root,
  render: createDeferredUnmountRender(createRoot) as any,
});
