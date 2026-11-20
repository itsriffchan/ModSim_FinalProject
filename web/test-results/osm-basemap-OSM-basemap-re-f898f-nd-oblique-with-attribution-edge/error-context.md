# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: osm-basemap.spec.ts >> OSM basemap >> region desktop bird and oblique with attribution
- Location: e2e\osm-basemap.spec.ts:27:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "controls.getAzimuthAngle is not a function",
+ ]
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - note [ref=e3]: ASSUMED timing; not a validated rupture or damage-evolution simulation
    - banner [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]: MODELING & SIMULATION
        - heading "NCR scenario explorer" [level=1] [ref=e7]
        - paragraph [ref=e8]: Metro Manila (NCR) · Earthquake scenario explorer
      - generic [ref=e9]:
        - link "Dev gallery" [ref=e10] [cursor=pointer]:
          - /url: /dev/components
        - button "Provenance" [ref=e11] [cursor=pointer]
    - navigation "Primary views" [ref=e12]:
      - link "Region" [ref=e13] [cursor=pointer]:
        - /url: /region
      - link "City perspectives" [ref=e14] [cursor=pointer]:
        - /url: /city/PH1307403
      - link "Compare" [ref=e15] [cursor=pointer]:
        - /url: /compare
    - generic [ref=e16]:
      - group "Scenario" [ref=e17]:
        - generic [ref=e19]:
          - button "A · Pasig · 20 s" [pressed] [ref=e20] [cursor=pointer]
          - button "B · Pasig · 40 s" [ref=e21] [cursor=pointer]
          - button "C · Muntinlupa · 40 s" [ref=e22] [cursor=pointer]
      - generic [ref=e23]:
        - generic [ref=e24]: Dataset
        - combobox "Dataset" [ref=e25] [cursor=pointer]:
          - option "A / B / C batch" [selected]
          - option "Standalone A"
          - option "Standalone B"
          - option "Standalone C"
    - main [ref=e26]:
      - generic [ref=e27]:
        - generic [ref=e28]:
          - generic [ref=e29]:
            - toolbar "Map camera" [ref=e30]:
              - button "Bird's-eye" [ref=e31] [cursor=pointer]
              - button "Oblique" [active] [pressed] [ref=e32] [cursor=pointer]
              - button "Low angle" [ref=e33] [cursor=pointer]
              - button "Orbit" [ref=e34] [cursor=pointer]
              - button "Reset north" [ref=e35] [cursor=pointer]
            - note [ref=e36]: "OpenStreetMap street context (not satellite or terrain). Blue wash: saved heavy-damage probability. Buildings illustrative and do not encode damage."
            - link "OpenStreetMap attribution" [ref=e37] [cursor=pointer]:
              - /url: https://www.openstreetmap.org/copyright
              - text: © OpenStreetMap contributors
            - complementary "How to navigate the map" [ref=e38]:
              - paragraph [ref=e39]: Navigate
              - list [ref=e40]:
                - listitem [ref=e41]: Drag — pan
                - listitem [ref=e42]: Scroll — zoom
                - listitem [ref=e43]: Right-drag — tilt and turn, inside the limits below
                - listitem [ref=e44]: Reset north — heading 0° and this view’s default tilt
              - paragraph [ref=e45]: Tilt 0° (allowed 22°–48°)Heading 0° (allowed -20° to 20°, 0° is north)
              - paragraph [ref=e46]: Oblique, low, and orbit are perspective. Screen scale is not equal.
            - generic [aria-hidden]:
              - generic: Manila
              - generic: Mandaluyong
              - generic: Marikina
              - generic: Pasig
              - generic: Quezon City
              - generic: San Juan
              - generic: Caloocan City
              - generic: Malabon
              - generic: Navotas
              - generic: Valenzuela
              - generic: Las Piñas
              - generic: Makati
              - generic: Muntinlupa
              - generic: Parañaque
              - generic: Pasay City
              - generic: Pateros
              - generic: Taguig City
              - generic: Manila Bay
              - generic: Laguna de Bay
            - application "Scenario A damage heatmap" [ref=e47]
          - region "Playback controls" [ref=e49]:
            - button "Play" [ref=e50] [cursor=pointer]
            - button "Restart" [ref=e51] [cursor=pointer]
            - generic [ref=e52]:
              - generic [ref=e53]: Simulation time
              - slider "Simulation time" [ref=e54]: "0"
            - generic [ref=e55]: t = 0.00 s
            - generic [ref=e56]:
              - text: Speed
              - combobox "Speed" [ref=e57] [cursor=pointer]:
                - option "0.5×"
                - option "1.0×"
                - option "2.0×" [selected]
                - option "4.0×"
                - option "8.0×"
        - complementary [ref=e58]:
          - generic [ref=e59]:
            - paragraph [ref=e60]: Region summary
            - heading "Scenario A · Pasig · 20 s" [level=2] [ref=e61]
            - paragraph [ref=e62]: Paused at origin · animated NCR expectations · assumed timing
            - generic [ref=e63]:
              - generic [ref=e64]:
                - term [ref=e65]: Expected deaths
                - definition [ref=e66]: "0.0"
              - generic [ref=e67]:
                - term [ref=e68]: Expected injuries
                - definition [ref=e69]: "0.0"
            - button "View final LGU totals" [ref=e70] [cursor=pointer]
          - generic [ref=e71]:
            - heading "Heavy-damage probability" [level=3] [ref=e72]
            - generic [ref=e74]:
              - generic [ref=e75]: 0%
              - generic [ref=e76]: 2%
              - generic [ref=e77]: 4%
              - generic [ref=e78]: 6%
              - generic [ref=e79]: 8%
              - generic [ref=e80]: 10%
            - paragraph [ref=e81]: Shared 0–10% palette on the map; inspected values above 10% retain true probability in the cell inspector. >=10%
          - generic [ref=e82]:
            - heading "Overlay key" [level=3] [ref=e83]
            - list [ref=e84]:
              - listitem [ref=e85]: LGU boundaries (17)
              - listitem [ref=e87]: West Valley Fault
              - listitem [ref=e89]: Assumed epicenter
              - listitem [ref=e91]: Inactive grid cell
              - listitem [ref=e93]: Awaiting arrival
              - listitem [ref=e95]: Shared arrived/awaiting cell edges from saved onset times
          - generic [ref=e97]:
            - heading "Cell inspector" [level=3] [ref=e98]
            - paragraph [ref=e99]: Click an active cell on the map to inspect population, PGV, displayed probability, and final separate losses.
  - generic [ref=e104] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e105]
    - generic [ref=e109]:
      - button "Open issues overlay" [ref=e110]:
        - generic [ref=e111]:
          - generic [aria-hidden] [ref=e112]: "0"
          - generic [ref=e113]: "1"
        - generic [ref=e114]: Issue
      - button "Collapse issues badge" [ref=e115]
  - alert [ref=e118]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import fs from 'node:fs';
  3   | import path from 'node:path';
  4   | 
  5   | const evidenceRoot = path.resolve(
  6   |   __dirname,
  7   |   '../../docs/evidence/view-context/nextjs/20261121_osm_01',
  8   | );
  9   | 
  10  | test.beforeAll(() => {
  11  |   fs.mkdirSync(evidenceRoot, { recursive: true });
  12  | });
  13  | 
  14  | async function waitMapReady(page: import('@playwright/test').Page, timeout = 45_000) {
  15  |   await page.waitForFunction(
  16  |     () => {
  17  |       const el = document.querySelector('[data-basemap-status]');
  18  |       const status = el?.getAttribute('data-basemap-status');
  19  |       return status === 'ready' || status === 'partial' || status === 'failed';
  20  |     },
  21  |     null,
  22  |     { timeout },
  23  |   );
  24  | }
  25  | 
  26  | test.describe('OSM basemap', () => {
  27  |   test('region desktop bird and oblique with attribution', async ({ page }) => {
  28  |     const errors: string[] = [];
  29  |     page.on('pageerror', (e) => errors.push(e.message));
  30  |     await page.setViewportSize({ width: 1440, height: 900 });
  31  |     await page.goto('/region');
  32  |     await page.waitForFunction(() => !!window.modsimExplorer, null, { timeout: 30_000 });
  33  |     await waitMapReady(page);
  34  |     await expect(page.getByText('© OpenStreetMap contributors')).toBeVisible();
  35  |     await page.screenshot({
  36  |       path: path.join(evidenceRoot, 'region_desktop_bird.png'),
  37  |       fullPage: true,
  38  |     });
  39  |     await page.getByRole('button', { name: 'Oblique' }).click();
  40  |     await page.waitForTimeout(400);
  41  |     await page.screenshot({
  42  |       path: path.join(evidenceRoot, 'region_desktop_oblique.png'),
  43  |       fullPage: true,
  44  |     });
> 45  |     expect(errors).toEqual([]);
      |                    ^ Error: expect(received).toEqual(expected) // deep equality
  46  |   });
  47  | 
  48  |   test('region narrow viewport', async ({ page }) => {
  49  |     await page.setViewportSize({ width: 390, height: 844 });
  50  |     await page.goto('/region');
  51  |     await waitMapReady(page);
  52  |     await page.screenshot({
  53  |       path: path.join(evidenceRoot, 'region_narrow.png'),
  54  |       fullPage: true,
  55  |     });
  56  |   });
  57  | 
  58  |   test('city Pasig and Pateros', async ({ page }) => {
  59  |     await page.goto('/city/PH1307403');
  60  |     await page.waitForFunction(() => !!window.modsimExplorer, null, { timeout: 30_000 });
  61  |     await waitMapReady(page);
  62  |     await page.screenshot({
  63  |       path: path.join(evidenceRoot, 'city_pasig.png'),
  64  |       fullPage: true,
  65  |     });
  66  |     await page.goto('/city/PH1307606');
  67  |     await waitMapReady(page);
  68  |     await page.screenshot({
  69  |       path: path.join(evidenceRoot, 'city_pateros.png'),
  70  |       fullPage: true,
  71  |     });
  72  |   });
  73  | 
  74  |   test('compare three panels', async ({ page }) => {
  75  |     await page.goto('/compare');
  76  |     await page.waitForLoadState('networkidle');
  77  |     const panels = page.locator('[data-testid="compare-panel"]');
  78  |     await expect(panels).toHaveCount(3);
  79  |     await waitMapReady(page);
  80  |     await page.screenshot({
  81  |       path: path.join(evidenceRoot, 'compare_layout.png'),
  82  |       fullPage: true,
  83  |     });
  84  |   });
  85  | 
  86  |   test('offline tile abort keeps heatmap and deaths', async ({ page }) => {
  87  |     await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
  88  |     await page.goto('/region');
  89  |     await page.waitForFunction(() => !!window.modsimExplorer, null, { timeout: 30_000 });
  90  |     await waitMapReady(page);
  91  |     const status = await page
  92  |       .locator('[data-basemap-status]')
  93  |       .getAttribute('data-basemap-status');
  94  |     expect(status).toBe('failed');
  95  |     const deaths = await page.locator('[data-testid="region-deaths"]').textContent();
  96  |     expect(deaths).toBeTruthy();
  97  |     await expect(page.locator('canvas.explorer-map-canvas')).toBeVisible();
  98  |     await page.screenshot({
  99  |       path: path.join(evidenceRoot, 'region_offline_tiles.png'),
  100 |       fullPage: true,
  101 |     });
  102 |   });
  103 | });
```