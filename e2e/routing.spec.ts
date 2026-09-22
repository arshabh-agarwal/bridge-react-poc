import { test, expect, type Page, type Locator } from '@playwright/test';

// ---------------------------------------------------------------------------
// Host / remote definitions
// ---------------------------------------------------------------------------

interface HostDef {
  name: string;
  baseURL: string;
  /** CSS selector for the side-nav link that navigates to a given remote prefix. */
  navLinkSelector: (remotePrefix: string) => string;
  /** CSS selector for the "Host home" link in the side nav. */
  hostHomeSelector: string;
}

const HOSTS: HostDef[] = [
  {
    name: 'react18',
    baseURL: 'http://localhost:4018',
    navLinkSelector: (prefix) => `.hg__nav a[href*="${prefix}"]`,
    hostHomeSelector: '.hg__nav a[href="/"]',
  },
  {
    name: 'react19',
    baseURL: 'http://localhost:4019',
    navLinkSelector: (prefix) => `.hg__nav a[href*="${prefix}"]`,
    hostHomeSelector: '.hg__nav a[href="/"]',
  },
  {
    name: 'ember-webpack',
    baseURL: 'http://localhost:4200',
    navLinkSelector: (prefix) => `.hg__nav a[href*="${prefix}"]`,
    hostHomeSelector: '.hg__nav a[href="/"]',
  },
  {
    name: 'ember-vite',
    baseURL: 'http://localhost:4201',
    navLinkSelector: (prefix) => `.hg__nav a[href*="${prefix}"]`,
    hostHomeSelector: '.hg__nav a[href="/"]',
  },
];

interface RemoteDef {
  name: string;
  prefix: string;
}

const REMOTES: RemoteDef[] = [
  { name: 'remote18', prefix: '/remote18' },
  { name: 'remote19', prefix: '/remote19' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The host's main content area where the remote renders. */
function main(page: Page): Locator {
  return page.locator('.hg__main');
}

/** Wait for the remote's root element to appear and its hooks probe to start ticking. */
async function waitForRemote(page: Page, remoteName: string) {
  await main(page).locator(`[data-testid="${remoteName}-root"]`).waitFor({ state: 'visible', timeout: 15_000 });
  await expect(main(page).locator('[data-testid="hooks-probe"]')).toHaveAttribute('data-ok', 'true', { timeout: 10_000 });
}

/** Get the host-displayed pathname. */
async function hostPathname(page: Page): Promise<string> {
  const text = await page.locator('[data-testid="host-pathname"]').textContent();
  return text!.replace('pathname=', '').trim();
}

// ---------------------------------------------------------------------------
// Parameterized test matrix: 4 hosts x 2 remotes = 8 combinations
// ---------------------------------------------------------------------------

for (const host of HOSTS) {
  for (const remote of REMOTES) {
    const otherRemote = REMOTES.find((r) => r.name !== remote.name)!;
    const combo = `${host.name} + ${remote.name}`;

    test.describe(combo, () => {
      // ------------------------------------------------------------------
      // 1. Deep Linking — direct navigation to a nested remote route
      // ------------------------------------------------------------------
      test('deep link to nested remote route', async ({ page }) => {
        await page.goto(`${host.baseURL}${remote.prefix}/items/42`);
        await waitForRemote(page, remote.name);

        await expect(main(page).locator('h2')).toHaveText('Item 42');
        expect(page.url()).toContain(`${remote.prefix}/items/42`);
        expect(await hostPathname(page)).toBe(`${remote.prefix}/items/42`);
      });

      // ------------------------------------------------------------------
      // 2. Host-to-Remote Navigation — click host nav to enter a remote
      // ------------------------------------------------------------------
      test('host nav into remote', async ({ page }) => {
        await page.goto(host.baseURL);
        await expect(main(page)).toBeVisible();

        await page.locator(host.navLinkSelector(remote.prefix)).click();
        await waitForRemote(page, remote.name);

        await expect(main(page).locator('h2')).toHaveText('Remote home');
        expect(page.url()).toContain(remote.prefix);
      });

      // ------------------------------------------------------------------
      // 3. Internal Remote Routing — navigation within the remote
      // ------------------------------------------------------------------
      test('nav within remote', async ({ page }) => {
        await page.goto(`${host.baseURL}${remote.prefix}`);
        await waitForRemote(page, remote.name);

        // Click the "About" tab inside the remote.
        await main(page).locator('.remote-tabs a', { hasText: 'About' }).click();
        await expect(main(page).locator('h2')).toHaveText('About');
        expect(page.url()).toContain(`${remote.prefix}/about`);

        // Click the "Item 42" demo link inside the remote.
        await main(page).locator('a', { hasText: 'Item 42' }).click();
        await expect(main(page).locator('h2')).toHaveText('Item 42');
        expect(page.url()).toContain(`${remote.prefix}/items/42`);

        // Programmatic navigate: click "Next item".
        await main(page).locator('button', { hasText: 'Next item' }).click();
        await expect(main(page).locator('h2')).toHaveText('Item 43');
        expect(page.url()).toContain(`${remote.prefix}/items/43`);
      });

      // ------------------------------------------------------------------
      // 4. Cross-Remote Navigation — switch from one remote to the other
      // ------------------------------------------------------------------
      test('cross-remote navigation', async ({ page }) => {
        await page.goto(`${host.baseURL}${remote.prefix}/about`);
        await waitForRemote(page, remote.name);
        await expect(main(page).locator('h2')).toHaveText('About');

        // Click the host nav link for the OTHER remote.
        await page.locator(host.navLinkSelector(otherRemote.prefix)).click();
        await waitForRemote(page, otherRemote.name);

        await expect(main(page).locator('h2')).toHaveText('Remote home');
        expect(page.url()).toContain(otherRemote.prefix);
        // The first remote should be gone.
        await expect(main(page).locator(`[data-testid="${remote.name}-root"]`)).not.toBeVisible();
      });

      // ------------------------------------------------------------------
      // 5. Browser History — back/forward button compatibility
      // ------------------------------------------------------------------
      test('back and forward', async ({ page }) => {
        // Navigate through a sequence: host home → remote home → about → items/42
        await page.goto(host.baseURL);
        await expect(main(page)).toBeVisible();

        // Step 1: host home → remote
        await page.locator(host.navLinkSelector(remote.prefix)).click();
        await waitForRemote(page, remote.name);
        await expect(main(page).locator('h2')).toHaveText('Remote home');

        // Step 2: remote home → about
        await main(page).locator('.remote-tabs a', { hasText: 'About' }).click();
        await expect(main(page).locator('h2')).toHaveText('About');

        // Step 3: about → items/42
        await main(page).locator('a', { hasText: 'Item 42' }).click();
        await expect(main(page).locator('h2')).toHaveText('Item 42');

        // Back: items/42 → about
        await page.goBack();
        await expect(main(page).locator('h2')).toHaveText('About');
        expect(page.url()).toContain(`${remote.prefix}/about`);

        // Back: about → remote home
        await page.goBack();
        await expect(main(page).locator('h2')).toHaveText('Remote home');

        // Forward: remote home → about
        await page.goForward();
        await expect(main(page).locator('h2')).toHaveText('About');

        // Forward: about → items/42
        await page.goForward();
        await expect(main(page).locator('h2')).toHaveText('Item 42');
      });

      // ------------------------------------------------------------------
      // 6. Programmatic Exit — hand routing control back to host
      // ------------------------------------------------------------------
      test('exit via useHostNavigate', async ({ page }) => {
        await page.goto(`${host.baseURL}${remote.prefix}/items/7`);
        await waitForRemote(page, remote.name);
        await expect(main(page).locator('h2')).toHaveText('Item 7');

        // Click the "Host home (useHostNavigate)" button.
        await main(page).locator('button', { hasText: 'Host home' }).click();

        // Should be back at host home — remote should be unmounted.
        await expect(main(page).locator(`[data-testid="${remote.name}-root"]`)).not.toBeVisible();
        expect(await hostPathname(page)).toBe('/');
      });
    });
  }
}
