import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const evidenceRoot = path.resolve(
  __dirname,
  '../../docs/evidence/view-context/nextjs/20261121_osm_01',
);

test.beforeAll(() => {
  fs.mkdirSync(evidenceRoot, { recursive: true });
});

async function waitMapReady(page: import('@playwright/test').Page, timeout = 45_000) {
  await page.waitForFunction(
    () => {
      const els = document.querySelectorAll('[data-basemap-status]');
      if (els.length === 0) return false;
      return [...els].every((el) => {
        const status = el.getAttribute('data-basemap-status');
        return status === 'ready' || status === 'partial' || status === 'failed';
      });
    },
    null,
    { timeout },
  );
}

test.describe('OSM raster basemap (City / Compare)', () => {
  test('city Pasig and Pateros', async ({ page }) => {
    await page.goto('/city/PH1307403');
    await page.getByText('17 LGUs').waitFor({ timeout: 30_000 });
    await waitMapReady(page);
    await page.screenshot({
      path: path.join(evidenceRoot, 'city_pasig.png'),
      fullPage: true,
    });
    await page.goto('/city/PH1307606');
    await waitMapReady(page);
    await page.screenshot({
      path: path.join(evidenceRoot, 'city_pateros.png'),
      fullPage: true,
    });
  });

  test('compare three panels', async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto('/compare');
    const panels = page.locator('[data-testid="compare-panel"]');
    await expect(panels).toHaveCount(3, { timeout: 30_000 });
    await waitMapReady(page, 180_000);
    await page.screenshot({
      path: path.join(evidenceRoot, 'compare_layout.png'),
      fullPage: false,
    });
  });

  test('offline tile abort on city keeps map canvas', async ({ page }) => {
    await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
    await page.goto('/city/PH1307403');
    await page.getByText('17 LGUs').waitFor({ timeout: 30_000 });
    await waitMapReady(page);
    const status = await page
      .locator('[data-basemap-status]')
      .first()
      .getAttribute('data-basemap-status');
    expect(status).toBe('failed');
    await expect(page.locator('canvas.explorer-map-canvas')).toBeVisible();
    await page.screenshot({
      path: path.join(evidenceRoot, 'city_offline_tiles.png'),
      fullPage: true,
    });
  });
});