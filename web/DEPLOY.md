# Vercel deployment

1. Import the repository; set **Root Directory** to `web`.
2. Environment: `VERCEL=1` is set automatically; `prebuild` runs `sync_viewer_payloads` in **copy** mode so `public/data/` contains payloads (junctions do not work on Vercel).
3. Commit `web/public/data/` payload files. If `results/runs/` is unavailable on the host, `sync_viewer_payloads.mjs` uses the committed payload fallback automatically.
4. Deploy command: default `npm run build`.
5. Post-deploy: confirm `/region`, `/compare`, and `/city/PH1307403` return 200 and provenance dialog lists sources per `docs/data_sources.md`.

For a first deploy from this machine after freeing disk space:

```bash
cd web
npx vercel login
npx vercel --prod
```