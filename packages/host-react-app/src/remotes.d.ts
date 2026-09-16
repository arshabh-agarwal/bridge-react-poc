// Virtual modules provided by @module-federation/vite for the configured remotes.
declare module 'remote18/export-app' {
  const provider: () => {
    render(info: { dom: HTMLElement; basename?: string; [key: string]: unknown }): Promise<void>;
    destroy(info: { dom: HTMLElement; moduleName?: string }): void;
  };
  export default provider;
}

declare module 'remote19/export-app' {
  const provider: () => {
    render(info: { dom: HTMLElement; basename?: string; [key: string]: unknown }): Promise<void>;
    destroy(info: { dom: HTMLElement; moduleName?: string }): void;
  };
  export default provider;
}
