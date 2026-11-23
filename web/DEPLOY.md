# Vercel deployment

1. Import the repository; set **Root Directory** to `web`.
2. Environment: `VERCEL=1` is set automatically; `prebuild` runs `sync_viewer_payloads` in **copy** mode so `public/data/` contains payloads (junctions do not work on Vercel).
3. Ensure `results/runs/viewer_acceptance_20261120/` is available at build time (commit copied payloads in CI, or run sync in a prebuild step that fetches artifacts).
4. Deploy command: default `npm run build`.
5. Post-deploy: confirm `/region`, `/compare`, and `/city/PH1307403` return 200 and provenance dialog lists sources per `docs/data_sources.md`.

For a first deploy from this machine after freeing disk space:

```bash
cd web
npx vercel login
npx vercel --prod
```