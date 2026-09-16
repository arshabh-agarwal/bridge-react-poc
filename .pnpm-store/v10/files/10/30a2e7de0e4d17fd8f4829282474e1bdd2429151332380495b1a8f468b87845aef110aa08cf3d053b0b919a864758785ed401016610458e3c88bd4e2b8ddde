"use strict";
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const federationRuntime = { instance: null };
function BridgeReactPlugin() {
  return {
    name: "bridge-react-plugin",
    beforeInit(args) {
      federationRuntime.instance = args.origin;
      return args;
    }
  };
}
exports.default = BridgeReactPlugin;
exports.federationRuntime = federationRuntime;
