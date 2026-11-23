import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const evidenceRoot = path.resolve(
  __dirname,
  '../../docs/evidence/view-context/nextjs/20261121_city_compare_osm_01',
);

test.beforeAll(() => {
  fs.mkdirSync(evidenceRoot, { recursive: true });
});

async function waitForMap(page: Page, testId: string) {
  await page.locator(`[data-testid="${testId}"]`).waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForFunction(
    (id) => {
      const status = document
        .querySelector(`[data-testid="${id}"]`)
        ?.getAttribute('data-map-status');
      return status === 'ready' || status === 'local';
    },
    testId,
    { timeout: 90_000 },
  );
  await page.waitForFunction(
    (id) => {
      const zoom = Number(
        document.querySelector(`[data-testid="${id}"]`)?.getAttribute('data-map-zoom'),
      );
      const stamp = document.querySelector(`[data-testid="${id}"]`)?.getAttribute('data-fill-stamp');
      return Number.isFinite(zoom) && zoom > 0 && Boolean(stamp);
    },
    testId,
    { timeout: 20_000 },
  );
}

function readZoom(page: Page, testId: string) {
  return page.locator(`[data-testid="${testId}"]`).getAttribute('data-map-zoom');
}

test.describe('Region OSM 3D MapLibre', () => {
  test('locked zoom, playback stays on the base frame, LGU selection zooms', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/region');
    await page.waitForFunction(() => !!window.modsimExplorer, null, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: "Bird's-eye" })).toHaveCount(0);
    await expect(page.getByTestId('region-show-buildings')).toHaveCount(0);
    await expect(page.getByTestId('region-map-caption')).toBeVisible();
    await waitForMap(page, 'region-osm3d-map');
    await expect(page.getByText('Scroll and pinch zoom are off', { exact: false })).toBeVisible();
    const deaths = await page.locator('[data-testid="region-deaths"]').textContent();
    expect(deaths).toBeTruthy();

    const baseZoom = Number(await readZoom(page, 'region-osm3d-map'));
    const stampAtOrigin = await page
      .locator('[data-testid="region-osm3d-map"]')
      .getAttribute('data-fill-stamp');
    expect(stampAtOrigin).toBeTruthy();
    await page.screenshot({
      path: path.join(evidenceRoot, 'region_origin_desktop.png'),
      fullPage: true,
    });

    const canvas = page.locator('[data-testid="region-osm3d-map"] canvas').first();
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, -900);
    await page.mouse.dblclick(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.waitForTimeout(400);
    const zoomAfterGesture = Number(await readZoom(page, 'region-osm3d-map'));
    expect(Math.abs(zoomAfterGesture - baseZoom)).toBeLessThan(0.05);

    await page.getByRole('button', { name: 'Play' }).click();
    await page.waitForFunction(() => (window.modsimExplorer?.time ?? 0) > 1, null, {
      timeout: 10_000,
    });
    await page.waitForFunction(
      (origin) => {
        const stamp = document
          .querySelector('[data-testid="region-osm3d-map"]')
          ?.getAttribute('data-fill-stamp');
        return Boolean(stamp && stamp !== origin);
      },
      stampAtOrigin,
      { timeout: 20_000 },
    );
    const zoomWhilePlaying = Number(await readZoom(page, 'region-osm3d-map'));
    expect(Math.abs(zoomWhilePlaying - baseZoom)).toBeLessThan(0.05);
    await page.screenshot({
      path: path.join(evidenceRoot, 'region_playback_desktop.png'),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Pause' }).click();

    await page.locator('[data-testid="region-lgu-option"]').first().click();
    await page.waitForFunction(
      (overview) => {
        const zoom = Number(
          document.querySelector('[data-testid="region-osm3d-map"]')?.getAttribute('data-map-zoom'),
        );
        return Number.isFinite(zoom) && zoom > Number(overview) + 0.35 && zoom >= 14.5;
      },
      baseZoom,
      { timeout: 15_000 },
    );
    const frame = await page
      .locator('[data-testid="region-osm3d-map"]')
      .getAttribute('data-map-frame');
    expect(frame).not.toBe('ncr');
    await page.screenshot({
      path: path.join(evidenceRoot, 'region_lgu_zoom.png'),
      fullPage: true,
    });

    await page.getByRole('button', { name: 'Reset view' }).click();
    await page.waitForFunction(
      (overview) => {
        const zoom = Number(
          document.querySelector('[data-testid="region-osm3d-map"]')?.getAttribute('data-map-zoom'),
        );
        return Number.isFinite(zoom) && Math.abs(zoom - Number(overview)) < 0.35;
      },
      baseZoom,
      { timeout: 15_000 },
    );
    expect(errors.filter((message) => !message.includes('getAzimuth'))).toEqual([]);
  });

  test('narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/region');
    await waitForMap(page, 'region-osm3d-map');
    await page.screenshot({
      path: path.join(evidenceRoot, 'region_narrow.png'),
      fullPage: true,
    });
  });

  test('blocked vector style shows local map', async ({ page }) => {
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
