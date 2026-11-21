import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const evidenceRoot = path.resolve(
  __dirname,
  '../../docs/evidence/view-context/nextjs/20261121_region_osm3d_01',
);

test.beforeAll(() => {
  fs.mkdirSync(evidenceRoot, { recursive: true });
});

test.describe('Region OSM 3D MapLibre', () => {
  test('locked low camera, caption, no mode toolbar', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/region');
    await page.waitForFunction(() => !!window.modsimExplorer, null, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: "Bird's-eye" })).toHaveCount(0);
    await expect(page.locator('.explorer-camera-toolbar')).toHaveCount(0);
    await expect(page.getByTestId('region-map-caption')).toBeVisible();
    await page
      .locator('[data-testid="region-osm3d-map"]')
      .waitFor({ state: 'visible', timeout: 60_000 });
    await page.waitForFunction(
      () => {
        const s = document
          .querySelector('[data-region-map-status]')
          ?.getAttribute('data-region-map-status');
        return s === 'ready' || s === 'local';
      },
      null,
      { timeout: 90_000 },
    );
    await expect(page.getByText('Locked low angle (62°)', { exact: false })).toBeVisible();
    const deaths = await page.locator('[data-testid="region-deaths"]').textContent();
    expect(deaths).toBeTruthy();
    await page.screenshot({
      path: path.join(evidenceRoot, 'region_desktop_oblique.png'),
      fullPage: true,
    });
    expect(errors.filter((e) => !e.includes('getAzimuth'))).toEqual([]);
  });

  test('narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/region');
    await page.locator('[data-testid="region-osm3d-map"]').waitFor({ timeout: 60_000 });
    await page.screenshot({
      path: path.join(evidenceRoot, 'region_narrow.png'),
      fullPage: true,
    });
  });

  test('blocked vector style shows pannable local map', async ({ page }) => {
    await page.route('https://tiles.openfreemap.org/**', (route) => route.abort());
    await page.goto('/region');
    await page.waitForFunction(
      () =>
        document.querySelector('[data-region-map-status]')?.getAttribute('data-region-map-status') ===
        'local',
      null,
      { timeout: 60_000 },
    );
    await expect(page.getByTestId('region-map-local-notice')).toBeVisible();
    const deaths = await page.locator('[data-testid="region-deaths"]').textContent();
    expect(deaths).toBeTruthy();
    await page.screenshot({
      path: path.join(evidenceRoot, 'region_offline_vector.png'),
      fullPage: true,
    });
  });
});