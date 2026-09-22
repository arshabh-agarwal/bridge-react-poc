// Virtual modules provided by @module-federation/vite for the configured remotes.
declare module 'provider_remote18' {
  const provider: () => {
    render(info: { dom: HTMLElement; basename?: string; [key: string]: unknown }): Promise<void>;
    destroy(info: { dom: HTMLElement; moduleName?: string }): void;
  };
  export default provider;
}

declare module 'provider_remote19' {
  const provider: () => {
    render(info: { dom: HTMLElement; basename?: string; [key: string]: unknown }): Promise<void>;
    destroy(info: { dom: HTMLElement; moduleName?: string }): void;
  };
  export default provider;
}
