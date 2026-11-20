# Offline NCR presentation

MATLAB embeds `template.html`, `viewer.css`, `viewer.js`, and both vendored scripts in each generated HTML. Open the result directly with a WebGL-capable browser; there is no server, runtime download, software installation or package build step.

`vendor/` contains Three.js **0.160.1** (MIT), its original OrbitControls module and the narrowly adapted classic-script wrapper. `LICENSE.three` retains the license. `manifest.json` records source URLs, versions, adaptation and SHA-256 hashes. `python tools/prepare_viewer_vendor.py` regenerates only that wrapper and manifest from the saved original; it does not download anything. The older pinned release supplies a classic browser bundle that works with inline scripts under `file://` without module loading or a bundler.

Presentation payload schema **1**:

| Field | Meaning |
| --- | --- |
| `grid` | Full saved cell identities, row/column, UTM centers in m, active mask, population and cell size |
| `overlays` | LGU keys/names and boundary vertices, fault vertices; null coordinates separate rings |
| `scenarios` | Scenario settings and identity; active-cell IDs in display order; S arrivals in s; duration/horizon; PGV in cm/s; final heavy probability; separate expected death/injury columns; 17 LGU rows; saved totals; assumed epicenter in UTM m |
| `scenarios.reference` | MATLAB `animation_state` samples at origin, onset, intermediate and final times |
| `timing` | Display formula, wave-arrival assumptions, disclaimer and default playback speed |
| `encoding` | Shared [0,0.1] probability limits and six percentage ticks; flat heatmap and saved-onset arrival-boundary descriptions. Legacy height fields remain present with zero maximum height |
| `provenance` | Original scientific-run configuration, references and fingerprints |
| `horizon_s` | Shared maximum scenario endpoint |

One-scenario MATLAB struct JSON is normalized to an array in JavaScript. Inactive cells never enter the animated probability/loss arrays. No interpolation of scientific relationships occurs. Active cells are pickable flat planes, with contiguous unlit fills. Awaiting arrival has a distinct neutral fill; arrived probability zero starts at the lightest blue. A fixed sequential scale clips colors at 10%, preserving the underlying probabilities. The camera stays north-up with equal projected scaling and linked pan/zoom. Cell details show current and final probabilities as percentages. Shared active-cell edges with different arrival states form the assumed arrival boundary; exterior and inactive edges do not form that boundary.

`presentation_manifest.json` distinguishes `payload_verified` from browser review. It includes presentation source hashes and dependency hashes separately from the original scientific-run provenance, which is preserved during saved-run exports. The sibling `presentation_payload.json` supports inspection; the HTML does not read it and can be moved/shared alone.

Browser acceptance can use an existing Playwright installation and existing Edge/Chromium binary:

```text
node tools/test_viewer.cjs <path-to-playwright-core> <viewer.html> <evidence-directory> [browser-executable]
```

This test does not install packages or browsers. It opens the local file with the browser network offline, checks MATLAB references, exercises the visible controls and records screenshots, JavaScript errors, requests and measured comparison frame rate. The optional `window.modsimViewer` interface exposes saved data, pure display-state calculation and test controls; it does not change scientific outputs.

REGION VIEW passed fresh [MATLAB, preservation, offline browser and visual checks](../docs/evidence/view-context/region-view/20261120_region_01/README.md). The harness supports complete comparison and independent A/B/C exports, verifies rendered values and independently reconstructed arrival edges, and exercises live inspection, status and compatibility. `python tools/verify_region_view.py <fresh-run-id>` prepares preserved acceptance copies with scientific before/after hashes and isolated standalone HTMLs; see the linked record for commands and environment.

The **hosted Next.js explorer** lives in [`web/`](../web/README.md). It reads the same schema-1 payloads (synced from `results/runs/...`) and exposes `window.modsimExplorer` on `/region`. Offline `file://` use remains this HTML viewer only.
