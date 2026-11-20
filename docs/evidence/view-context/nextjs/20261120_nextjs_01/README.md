# Next.js NCR scenario explorer evidence (`20261120_nextjs_01`)

## Environment

- OS: Windows 10, Node v24.15.0
- App: `web/` Next.js 16.4.6, Tailwind 4, vendored Three.js 0.160.1 (MIT)
- Data: `tools/sync_viewer_payloads.mjs` → junctions to `results/runs/viewer_acceptance_20261120` (local); copy mode when `VERCEL=1` or `CI=true`
- Browser tests: Playwright 1.65, Microsoft Edge channel, `reuseExistingServer` in CI

## Commands

```text
cd web && npm run sync-data
cd web && npm test
cd web && npm run build
cd web && npx playwright test
```

## Results

| Check | Outcome |
| --- | --- |
| Vitest display/state + housing-share | 5/5 passed |
| `next build` | Passed (routes: `/region`, `/city/[pcode]`, `/compare`, `/dev/components`) |
| Playwright e2e | 4/4 passed |
| Payload fingerprints | `web/public/data/manifest.json` (87 batch scientific files hashed) |

## Screenshots

- `region_origin.png` — Region view at t=0
- `compare_layout.png` — Compare three-panel layout
- `city_pasig.png` — City of Pasig perspective (when browser render succeeded)

## Agent visual review

Compared to [design-reference.png](../../../view-context/design-reference.png): blue-gray shell, three view tabs, scenario selector, map-led region layout, side summary and legend, playback bar, compare grid, and city sidebar are present. Illustrative scenery and buildings are labeled; equal-scale north-up available in bird's-eye mode.

## Limitations

- City geographic focus requires optional `payload.membership` from re-export (`export_scenario_viewer`); current synced JSON predates membership until MATLAB re-export is run.
- Hosted deployment requires `MODSIM_COPY_PAYLOADS=1` on Vercel so presentation payloads are copied into `public/data` (junctions are local-only).
- Offline file:// use is **not** claimed; standalone HTML viewer remains the offline path.