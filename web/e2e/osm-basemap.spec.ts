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
      const el = document.querySelector('[data-basemap-status]');
      const status = el?.getAttribute('data-basemap-status');
      return status === 'ready' || status === 'partial' || status === 'failed';
    },
    null,
    { timeout },
  );
}

test.describe('OSM basemap', () => {
  test('region desktop bird and oblique with attribution', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/region');
    await page.waitForFunction(() => !!window.modsimExplorer, null, { timeout: 30_000 });
    await waitMapReady(page);
    await expect(page.getByText('© OpenStreetMap contributors')).toBeVisible();
    await page.screenshot({
      path: path.join(evidenceRoot, 'region_desktop_bird.png'),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Oblique' }).click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(evidenceRoot, 'region_desktop_oblique.png'),
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });

  test('region narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/region');
    await waitMapReady(page);
    await page.screenshot({
      path: path.join(evidenceRoot, 'region_narrow.png'),
      fullPage: true,
    });
  });

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
    await page.goto('/compare');
    await page.waitForLoadState('networkidle');
    const panels = page.locator('[data-testid="compare-panel"]');
    await expect(panels).toHaveCount(3);
    await waitMapReady(page);
    await page.screenshot({
      path: path.join(evidenceRoot, 'compare_layout.png'),
      fullPage: true,
    });
  });

  test('offline tile abort keeps heatmap and deaths', async ({ page }) => {
    await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
    await page.goto('/region');
    await page.waitForFunction(() => !!window.modsimExplorer, null, { timeout: 30_000 });
    await waitMapReady(page);
    const status = await page
      .locator('[data-basemap-status]')
      .getAttribute('data-basemap-status');
    expect(status).toBe('failed');
    const deaths = await page.locator('[data-testid="region-deaths"]').textContent();
    expect(deaths).toBeTruthy();
    await expect(page.locator('canvas.explorer-map-canvas')).toBeVisible();
    await page.screenshot({
      path: path.join(evidenceRoot, 'region_offline_tiles.png'),
      fullPage: true,
    });
  });
});