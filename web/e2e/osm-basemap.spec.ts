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
}

test.describe('City and Compare on the Region map', () => {
  test('region LGU frames Pasig and playback stays there', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/city/PH1307403');
    await page.waitForURL('**/region', { timeout: 15_000 });
    await waitForMap(page, 'region-osm3d-map');
    await expect(page.locator('[data-testid="region-osm3d-map"] .maplibregl-canvas')).toBeVisible();
    await expect(page.locator('[data-testid="region-osm3d-map"]')).toHaveAttribute(
      'data-map-frame',
      'PH1307403',
    );
    await expect(page.locator('[data-testid="region-osm3d-map"]')).toHaveAttribute(
      'data-zoom-locked',
      'true',
    );
    const originZoom = Number(
      await page.locator('[data-testid="region-osm3d-map"]').getAttribute('data-map-zoom'),
    );
    expect(originZoom).toBeGreaterThanOrEqual(14.5);
    await page.locator('[data-testid="region-osm3d-map"]').scrollIntoViewIfNeeded();
    await page.locator('[data-testid="region-osm3d-map"]').screenshot({
      path: path.join(evidenceRoot, 'city_pasig_origin.png'),
    });

    await page.getByRole('button', { name: 'Play' }).click();
    await expect.poll(async () => {
      const text = await page.locator('.explorer-clock').innerText();
      return Number(text.replace(/[^\d.]/g, ''));
    }, { timeout: 20_000 }).toBeGreaterThan(1);
    const playingZoom = Number(
      await page.locator('[data-testid="region-osm3d-map"]').getAttribute('data-map-zoom'),
    );
    expect(Math.abs(playingZoom - originZoom)).toBeLessThan(0.05);
    await expect(page.locator('[data-testid="region-osm3d-map"]')).toHaveAttribute(
      'data-map-frame',
      'PH1307403',
    );
    await page.locator('[data-testid="region-osm3d-map"]').screenshot({
      path: path.join(evidenceRoot, 'city_pasig_playback.png'),
    });

    await page.goto('/city/PH1307606');
    await page.waitForURL('**/region', { timeout: 15_000 });
    await waitForMap(page, 'region-osm3d-map');
    await expect(page.locator('[data-testid="region-osm3d-map"]')).toHaveAttribute(
      'data-map-frame',
      'PH1307606',
    );
    await page.locator('[data-testid="region-osm3d-map"]').screenshot({
      path: path.join(evidenceRoot, 'city_pateros.png'),
    });
  });

  test('compare shows three region maps side by side', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/compare');
    const panels = page.locator('[data-testid="compare-panel"]');
    await expect(panels).toHaveCount(3, { timeout: 30_000 });
    await waitForMap(page, 'compare-osm-map-A');
    await waitForMap(page, 'compare-osm-map-B');
    await waitForMap(page, 'compare-osm-map-C');
    await expect(page.locator('.maplibregl-canvas')).toHaveCount(3);
    for (const id of ['A', 'B', 'C']) {
      await expect(page.locator(`[data-testid="compare-osm-map-${id}"]`)).toHaveAttribute(
        'data-map-frame',
        'ncr',
      );
      await expect(page.locator(`[data-testid="compare-osm-map-${id}"]`)).toHaveAttribute(
        'data-zoom-locked',
        'true',
      );
    }
    await page.screenshot({
      path: path.join(evidenceRoot, 'compare_origin_desktop.png'),
      fullPage: false,
    });

    const baseZoom = Number(
      await page.locator('[data-testid="compare-osm-map-A"]').getAttribute('data-map-zoom'),
    );
    await page.getByRole('button', { name: 'Play' }).click();
    await page.waitForFunction(() => (window.modsimExplorer?.time ?? 0) > 1, null, {
      timeout: 10_000,
    });
    const playingZoom = Number(
      await page.locator('[data-testid="compare-osm-map-A"]').getAttribute('data-map-zoom'),
    );
    expect(Math.abs(playingZoom - baseZoom)).toBeLessThan(0.05);
    await page.screenshot({
      path: path.join(evidenceRoot, 'compare_playback_desktop.png'),
      fullPage: false,
    });
    await page.getByRole('button', { name: 'Pause' }).click();

    await page.getByRole('radio', { name: 'City focus' }).check();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="compare-osm-map-A"]')?.getAttribute('data-map-frame') !==
        'ncr',
      null,
      { timeout: 15_000 },
    );
    const frame = await page
      .locator('[data-testid="compare-osm-map-A"]')
      .getAttribute('data-map-frame');
    await expect(page.locator('[data-testid="compare-osm-map-B"]')).toHaveAttribute(
      'data-map-frame',
      frame ?? '',
    );
    await expect(page.locator('[data-testid="compare-osm-map-C"]')).toHaveAttribute(
      'data-map-frame',
      frame ?? '',
    );
    await page.screenshot({
      path: path.join(evidenceRoot, 'compare_lgu_desktop.png'),
      fullPage: false,
    });
  });

  test('compare narrow layout stacks the three maps', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/compare');
    await waitForMap(page, 'compare-osm-map-A');
    await page.screenshot({
      path: path.join(evidenceRoot, 'compare_narrow.png'),
      fullPage: true,
    });
  });

  test('offline vector style on region LGU keeps the scenario map', async ({ page }) => {
    await page.route('https://tiles.openfreemap.org/**', (route) => route.abort());
    await page.goto('/city/PH1307403');
    await page.waitForURL('**/region', { timeout: 15_000 });
    await page.waitForFunction(
      () =>
        document.querySelector('[data-testid="region-osm3d-map"]')?.getAttribute('data-map-status') ===
        'local',
      null,
      { timeout: 60_000 },
    );
    await expect(page.locator('[data-testid="region-osm3d-map"] .maplibregl-canvas')).toBeVisible();
    await page.screenshot({
      path: path.join(evidenceRoot, 'city_offline_vector.png'),
      fullPage: true,
    });
  });
});
