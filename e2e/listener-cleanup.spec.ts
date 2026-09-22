import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Inject instrumentation that tracks the number of active `popstate` listeners.
 * Must be called before any navigation that mounts a remote.
 */
async function injectListenerCounter(page: Page) {
  await page.evaluate(() => {
    // Count only popstate listeners. Track via a simple counter on window.
    (window as any).__popstateListenerCount = 0;

    const origAdd = window.addEventListener.bind(window);
    const origRemove = window.removeEventListener.bind(window);

    window.addEventListener = function (type: string, ...args: any[]) {
      if (type === 'popstate') (window as any).__popstateListenerCount++;
      return (origAdd as any)(type, ...args);
    };

    window.removeEventListener = function (type: string, ...args: any[]) {
      if (type === 'popstate') (window as any).__popstateListenerCount--;
      return (origRemove as any)(type, ...args);
    };
  });
}

async function getPopstateListenerCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as any).__popstateListenerCount as number);
}

function main(page: Page) {
  return page.locator('.hg__main');
}

async function waitForRemote(page: Page, remoteName: string) {
  await main(page).locator(`[data-testid="${remoteName}-root"]`).waitFor({ state: 'visible', timeout: 15_000 });
  await expect(main(page).locator('[data-testid="hooks-probe"]')).toHaveAttribute('data-ok', 'true', { timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const HOSTS = [
  { name: 'react18', baseURL: 'http://localhost:4018' },
  { name: 'react19', baseURL: 'http://localhost:4019' },
  { name: 'ember-webpack', baseURL: 'http://localhost:4200' },
  { name: 'ember-vite', baseURL: 'http://localhost:4201' },
];

for (const host of HOSTS) {
  test.describe(`${host.name}: listener cleanup`, () => {
    test('popstate listeners do not leak across mount/unmount cycles', async ({ page }) => {
      // Load host home and inject the counter before any remote mounts.
      await page.goto(host.baseURL);
      await expect(main(page)).toBeVisible();
      await injectListenerCounter(page);

      const baseline = await getPopstateListenerCount(page);

      // Cycle 1: mount remote18, then exit back to host home.
      await page.locator(`.hg__nav a[href*="/remote18"]`).click();
      await waitForRemote(page, 'remote18');
      const duringMount1 = await getPopstateListenerCount(page);
      // While mounted, there should be at least one new popstate listener.
      expect(duringMount1).toBeGreaterThan(baseline);

      // Exit back to host home via host nav.
      await page.locator('.hg__nav a[href="/"]').click();
      await expect(main(page).locator('[data-testid="remote18-root"]')).not.toBeVisible();
      // Wait a tick for destroy/cleanup to complete.
      await page.waitForTimeout(500);
      const afterUnmount1 = await getPopstateListenerCount(page);

      // Cycle 2: mount remote19, then exit.
      await page.locator(`.hg__nav a[href*="/remote19"]`).click();
      await waitForRemote(page, 'remote19');
      await page.locator('.hg__nav a[href="/"]').click();
      await expect(main(page).locator('[data-testid="remote19-root"]')).not.toBeVisible();
      await page.waitForTimeout(500);
      const afterUnmount2 = await getPopstateListenerCount(page);

      // Cycle 3: mount remote18 again, then exit.
      await page.locator(`.hg__nav a[href*="/remote18"]`).click();
      await waitForRemote(page, 'remote18');
      await page.locator('.hg__nav a[href="/"]').click();
      await expect(main(page).locator('[data-testid="remote18-root"]')).not.toBeVisible();
      await page.waitForTimeout(500);
      const afterUnmount3 = await getPopstateListenerCount(page);

      // After each unmount, the listener count should return to the same level.
      // If listeners leak, each cycle would add more.
      expect(afterUnmount1).toBe(afterUnmount2);
      expect(afterUnmount2).toBe(afterUnmount3);
    });
  });
}
