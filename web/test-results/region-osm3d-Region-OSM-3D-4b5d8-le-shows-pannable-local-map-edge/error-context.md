# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: region-osm3d.spec.ts >> Region OSM 3D MapLibre >> blocked vector style shows pannable local map
- Location: e2e\region-osm3d.spec.ts:57:3

# Error details

```
TimeoutError: page.waitForFunction: Timeout 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - heading "This page couldn’t load" [level=1] [ref=e6]
  - paragraph [ref=e7]: Reload to try again, or go back.
  - generic [ref=e8]:
    - button "Reload" [ref=e10] [cursor=pointer]
    - button "Back" [ref=e11] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import fs from 'node:fs';
  3  | import path from 'node:path';
  4  | 
  5  | const evidenceRoot = path.resolve(
  6  |   __dirname,
  7  |   '../../docs/evidence/view-context/nextjs/20261121_region_osm3d_01',
  8  | );
  9  | 
  10 | test.beforeAll(() => {
  11 |   fs.mkdirSync(evidenceRoot, { recursive: true });
  12 | });
  13 | 
  14 | test.describe('Region OSM 3D MapLibre', () => {
  15 |   test('locked low camera, caption, no mode toolbar', async ({ page }) => {
  16 |     const errors: string[] = [];
  17 |     page.on('pageerror', (e) => errors.push(e.message));
  18 |     await page.setViewportSize({ width: 1440, height: 900 });
  19 |     await page.goto('/region');
  20 |     await page.waitForFunction(() => !!window.modsimExplorer, null, { timeout: 30_000 });
  21 |     await expect(page.getByRole('button', { name: "Bird's-eye" })).toHaveCount(0);
  22 |     await expect(page.locator('.explorer-camera-toolbar')).toHaveCount(0);
  23 |     await expect(page.getByTestId('region-map-caption')).toBeVisible();
  24 |     await page
  25 |       .locator('[data-testid="region-osm3d-map"]')
  26 |       .waitFor({ state: 'visible', timeout: 60_000 });
  27 |     await page.waitForFunction(
  28 |       () => {
  29 |         const s = document
  30 |           .querySelector('[data-region-map-status]')
  31 |           ?.getAttribute('data-region-map-status');
  32 |         return s === 'ready' || s === 'local';
  33 |       },
  34 |       null,
  35 |       { timeout: 90_000 },
  36 |     );
  37 |     await expect(page.getByText('Locked low angle (62°)', { exact: false })).toBeVisible();
  38 |     const deaths = await page.locator('[data-testid="region-deaths"]').textContent();
  39 |     expect(deaths).toBeTruthy();
  40 |     await page.screenshot({
  41 |       path: path.join(evidenceRoot, 'region_desktop_oblique.png'),
  42 |       fullPage: true,
  43 |     });
  44 |     expect(errors.filter((e) => !e.includes('getAzimuth'))).toEqual([]);
  45 |   });
  46 | 
  47 |   test('narrow viewport', async ({ page }) => {
  48 |     await page.setViewportSize({ width: 390, height: 844 });
  49 |     await page.goto('/region');
  50 |     await page.locator('[data-testid="region-osm3d-map"]').waitFor({ timeout: 60_000 });
  51 |     await page.screenshot({
  52 |       path: path.join(evidenceRoot, 'region_narrow.png'),
  53 |       fullPage: true,
  54 |     });
  55 |   });
  56 | 
  57 |   test('blocked vector style shows pannable local map', async ({ page }) => {
  58 |     await page.route('https://tiles.openfreemap.org/**', (route) => route.abort());
  59 |     await page.goto('/region');
> 60 |     await page.waitForFunction(
     |                ^ TimeoutError: page.waitForFunction: Timeout 60000ms exceeded.
  61 |       () =>
  62 |         document.querySelector('[data-region-map-status]')?.getAttribute('data-region-map-status') ===
  63 |         'local',
  64 |       null,
  65 |       { timeout: 60_000 },
  66 |     );
  67 |     await expect(page.getByTestId('region-map-local-notice')).toBeVisible();
  68 |     const deaths = await page.locator('[data-testid="region-deaths"]').textContent();
  69 |     expect(deaths).toBeTruthy();
  70 |     await page.screenshot({
  71 |       path: path.join(evidenceRoot, 'region_offline_vector.png'),
  72 |       fullPage: true,
  73 |     });
  74 |   });
  75 | });
```