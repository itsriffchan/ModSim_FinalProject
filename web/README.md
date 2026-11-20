# NCR scenario explorer (Next.js)

Hosted presentation app for saved ModSim scenario payloads (schema 1). Implements **Region**, **City perspectives**, and **Compare** against [../docs/view-context/design-reference.png](../docs/view-context/design-reference.png).

## Setup

```bash
cd web
npm install
npm run sync-data   # junction (local) or copy (CI/Vercel)
```

Optional satellite terrain (Region, City, Compare): create `web/.env.local` with a URL-restricted Mapbox public token:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
```

Never commit `.env.local`. Without a token the app still runs with the flat illustrative basemap and saved damage wash.

```bash
npm run dev
```

Open [http://localhost:3000/region](http://localhost:3000/region). Dev component gallery: `/dev/components` (development only).

## Data

Presentation JSON is not duplicated locally by default:

| Key | Source |
| --- | --- |
| `comparison` | `results/runs/viewer_acceptance_20261120/batch/comparison/` |
| `A` / `B` / `C` | independent acceptance run folders |

Set `MODSIM_VIEWER_RUN` to point at another run id. Set `MODSIM_COPY_PAYLOADS=1` or deploy on Vercel (`VERCEL=1`) to **copy** payloads into `public/data` for hosting.

## Tests

```bash
npm test              # Vitest (display + allocation)
npm run build
npm run test:e2e      # Playwright (Edge channel)
```

## Deploy (Vercel)

1. Set project **Root Directory** to `web`.
2. Build command: `npm run build` (runs `prebuild` sync with copy on Vercel).
3. Surface attribution via in-app provenance dialog (`docs/data_sources.md`).

## Browser test adapter

`window.modsimExplorer` on `/region` mirrors the standalone `window.modsimViewer` contract (display state only).

## Limitations

- Not an offline `file://` viewer; use [../viewer/README.md](../viewer/README.md).
- City cell/LGU allocation focus needs optional `membership` in exported JSON (re-run `export_scenario_viewer`).
- Map buildings remain procedural and labeled illustrative. Satellite terrain uses Mapbox tiles through three-geo when `NEXT_PUBLIC_MAPBOX_TOKEN` is set; otherwise water and heatmap only.