/* Browser acceptance against MATLAB reference samples. No test dependencies
 * are installed: pass a path to an already available playwright-core package.
 * node tools/test_viewer.cjs <playwright-core> <viewer.html> <evidence-dir> [browser-exe]
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

(async () => {
  const [modulePath, html, out, executablePath] = process.argv.slice(2);
  const {chromium} = require(path.resolve(modulePath));
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({headless: true, ...(executablePath ? {executablePath} : {})});
  const context = await browser.newContext({viewport: {width: 1440, height: 1100}, offline: true});
  const page = await context.newPage(), requests = [], errors = [];
  page.on('request', r => requests.push(r.url())); page.on('pageerror', e => errors.push(e.message));
  const url = pathToFileURL(path.resolve(html)).href;
  try {
    await page.goto(url); await page.waitForFunction(() => window.modsimViewer);
    const evidence = {browser: await browser.version(), executablePath, file: html, offline: true, checks: []};
    const record = (label, ok) => { assert(ok, label); evidence.checks.push({label, status: 'PASS'}); };
    const data = await page.evaluate(() => {
      const v = modsimViewer, scenarios = Array.isArray(v.payload.scenarios) ? v.payload.scenarios : [v.payload.scenarios];
      let maxError = 0;
      for (const s of scenarios) for (let i = 0; i < s.reference.times_s.length; i++) {
        const a = v.state(s, s.reference.times_s[i]);
        maxError = Math.max(maxError, Math.abs(a.damage[0] - s.reference.damage_first_cell[i]), ...a.counts.map((n, j) => Math.abs(n - s.reference.counters[i][j])));
      }
      return {maxError, time: v.time, playing: v.playing, ids: scenarios.map(s => s.id), lguCount: document.querySelectorAll('#lgu tbody tr').length, pateros: document.querySelector('#lgu').textContent.includes('Pateros')};
    });
    record('Paused at origin; all 17 LGUs and Pateros', data.time === 0 && !data.playing && data.lguCount === 17 && data.pateros);
    record('Zero, onset, half-duration and completion match MATLAB references within 1e-8', data.maxError < 1e-8);
    evidence.maxMatlabReferenceError = data.maxError;
    await page.screenshot({path: path.join(out, 'initial.png'), fullPage: true});
    const samples = await page.evaluate(() => {
      const s = Array.isArray(modsimViewer.payload.scenarios) ? modsimViewer.payload.scenarios : [modsimViewer.payload.scenarios];
      return [Math.min(...s[0].onset_s), 5, 20, modsimViewer.payload.horizon_s];
    });
    for (let i = 0; i < samples.length; i++) {
      await page.evaluate(t => modsimViewer.setTime(t), samples[i]);
      await page.waitForFunction(t => document.querySelector('#clock').textContent === `${t.toFixed(2)} s`, samples[i]);
      await page.screenshot({path: path.join(out, ['onset.png', 'partial.png', 'intermediate.png', 'final.png'][i]), fullPage: true});
    }
    record('Flat unlit north-up tiles; fixed shared scale', await page.evaluate(() => {
      const v = modsimViewer;
      return JSON.stringify(v.payload.encoding.probability_limits) === '[0,0.1]' && v.panels.every(p => p.mesh.geometry.type === 'PlaneGeometry' && p.mesh.material.type === 'MeshBasicMaterial' && !p.controls.enableRotate);
    }));
    const heatmap = await page.evaluate(async () => {
      const v = modsimViewer, snapshots = [];
      const settle = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const times = [0, Math.min(...v.panels[0].s.onset_s), 5, 20, v.payload.horizon_s, 5, 0];
      let boundaryOK = true, colorsOK = true;
      for (const t of times) {
        v.setTime(t); await settle();
        const shot = [];
        for (const p of v.panels) {
          const expected = p.edges.filter(e => (t >= p.s.onset_s[e.i]) !== (t >= p.s.onset_s[e.j])).length;
          boundaryOK &&= p.boundary.geometry.attributes.position.count === 2 * expected;
          const colors = Array.from(p.mesh.instanceColor.array);
          shot.push({colors, boundary: Array.from(p.boundary.geometry.attributes.position.array), counts: v.state(p.s, t).counts});
          const stops = [0xf7fbff,0xc6dbef,0x6baed6,0x2171b5,0x08306b].map(x => new THREE.Color(x));
          v.state(p.s,t).damage.forEach((prob,i) => {
            const f = Math.min(1,Math.max(0,prob/.1))*4, a=Math.min(3,Math.floor(f));
            const expectedColor=t<p.s.onset_s[i] ? new THREE.Color(0xe3e5df) : stops[a].clone().lerp(stops[a+1],f-a);
            const actual=new THREE.Color();p.mesh.getColorAt(i,actual);
            colorsOK &&= Math.max(Math.abs(actual.r-expectedColor.r),Math.abs(actual.g-expectedColor.g),Math.abs(actual.b-expectedColor.b))<1e-6;
          });
        }
        snapshots.push(shot);
      }
      const ss=Array.isArray(v.payload.scenarios)?v.payload.scenarios:[v.payload.scenarios];
      const b=ss.find(s=>s.id==='B'),c=ss.find(s=>s.id==='C');
      return {boundaryOK,colorsOK, backward:JSON.stringify(snapshots[0])===JSON.stringify(snapshots[6]) && JSON.stringify(snapshots[2])===JSON.stringify(snapshots[5]), bc: !b || !c || JSON.stringify(b.onset_s)!==JSON.stringify(c.onset_s), bcMaxFinalDifference: b && c ? Math.max(...b.final_heavy.map((n,i)=>Math.abs(n-c.final_heavy[i]))) : null};
    });
    record('Arrival boundary equals saved-onset shared edges at every sampled phase', heatmap.boundaryOK);
    record('Every displayed cell uses the same probability palette across scenarios and time', heatmap.colorsOK);
    record('Backward scrubbing restores tile colors, boundaries and counts', heatmap.backward);
    record('B/C retain different saved arrival progression', heatmap.bc);
    evidence.bcMaxSavedFinalProbabilityDifference = heatmap.bcMaxFinalDifference;
    await page.evaluate(() => modsimViewer.setTime(modsimViewer.payload.horizon_s));
    await page.waitForFunction(() => document.querySelector('#clock').textContent === `${modsimViewer.payload.horizon_s.toFixed(2)} s`);
    const final = await page.evaluate(() => {
      const v = modsimViewer;
      return v.panels.every(p => { const state = v.state(p.s, v.time); return state.counts.every((n, j) => Math.abs(n - p.s.totals[j]) < 1e-8) && p.node.querySelector('.status').textContent.startsWith('Complete'); });
    });
    record('Final NCR counters equal saved totals and panels stay complete', final);
    // Real controls: backwards scrub, restart, scenario selection, linked pan/zoom/reset.
    await page.locator('#time').fill('5'); await page.locator('#time').dispatchEvent('input');
    await page.waitForFunction(() => modsimViewer.time === 5);
    record('Backward scrub updates displayed state', await page.locator('#clock').textContent() === '5.00 s');
    await page.locator('#restart').click(); record('Restart returns to zero paused', await page.evaluate(() => modsimViewer.time === 0 && !modsimViewer.playing));
    for (const id of data.ids) {
      await page.locator(`[data-view="${id}"]`).click();
      record(`Switch to ${id}`, await page.evaluate(id => modsimViewer.mode === id && modsimViewer.panels.length === 1, id));
      const times = await page.evaluate(() => { const s = modsimViewer.panels[0].s; return [0, Math.min(...s.onset_s), 20, s.horizon_s]; });
      for (let i = 0; i < times.length; i++) {
        await page.evaluate(t => modsimViewer.setTime(t), times[i]);
        await page.waitForFunction(t => document.querySelector('#clock').textContent === `${t.toFixed(2)} s`, times[i]);
        await page.locator('#stage').screenshot({path: path.join(out, `${id}_${['initial', 'onset', 'intermediate', 'final'][i]}.png`)});
      }
    }
    if (data.ids.length > 1) await page.locator('[data-view="all"]').click();
    await page.locator('#restart').click();
    const box = await page.locator('.map').first().boundingBox();
    await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5);
    await page.mouse.down(); await page.mouse.move(box.x + box.width * .65, box.y + box.height * .6, {steps: 12}); await page.mouse.up();
    await page.mouse.wheel(0, -200);
    await page.waitForFunction(() => modsimViewer.panels.every(p => p.camera.position.distanceTo(modsimViewer.panels[0].camera.position) < 1e-8 && Math.abs(p.camera.zoom - modsimViewer.panels[0].camera.zoom) < 1e-10));
    record('Pan and zoom synchronize cameras', true);
    await page.locator('#reset').click();
    record('North-up reset', await page.evaluate(() => modsimViewer.panels.every(p => Math.abs(p.camera.position.x) < 1e-8 && p.camera.zoom === 1 && p.controls.target.length() < 1e-8)));
    record('North projects upward and east projects right after reset', await page.evaluate(() => modsimViewer.panels.every(p => {
      p.camera.updateMatrixWorld();
      const o = new THREE.Vector3(0, 0, 0).project(p.camera), n = new THREE.Vector3(0, 1, 0).project(p.camera), e = new THREE.Vector3(1, 0, 0).project(p.camera);
      return n.y > o.y && e.x > o.x;
    })));
    const point = await page.evaluate(() => {
      const v = modsimViewer, p = v.panels[0], i = Math.floor(p.s.cell_id.length / 2), g = v.payload.grid, j = g.cell_id.indexOf(p.s.cell_id[i]);
      p.scene.updateMatrixWorld(); p.camera.updateMatrixWorld();
      const m = new THREE.Matrix4(); p.mesh.getMatrixAt(i, m);
      const pos = new THREE.Vector3().setFromMatrixPosition(m).project(p.camera), rect = p.map.getBoundingClientRect();
      return {x: rect.left + (pos.x + 1) / 2 * rect.width, y: rect.top + (1 - pos.y) / 2 * rect.height};
    });
    await page.mouse.click(point.x, point.y);
    record('Raycast click selects active cell with final PGV and casualties', await page.evaluate(() => !!document.querySelector('#inspection').dataset.cellId && document.querySelector('#inspection').textContent.includes('cm/s')));
    record('Cell inspection shows current and final percentage probabilities', await page.evaluate(() => { const text=document.querySelector('#inspection').textContent; return text.includes('Current displayed probability') && text.includes('Final heavy probability') && (text.match(/%/g)||[]).length===2; }));
    // Completed A remains unchanged while B/C continue.
    record('Completed panel retained through shared endpoint', await page.evaluate(() => {
      const v = modsimViewer, scenarios = Array.isArray(v.payload.scenarios) ? v.payload.scenarios : [v.payload.scenarios];
      const s = scenarios[0], at = v.state(s, s.horizon_s), later = v.state(s, v.payload.horizon_s);
      return JSON.stringify(at) === JSON.stringify(later);
    }));
    await page.evaluate(() => modsimViewer.setTime(20));
    await page.setViewportSize({width: 390, height: 844});
    await page.waitForFunction(() => { const canvas=document.querySelector('#stage canvas'); return canvas.width>0 && Math.abs(canvas.width / Math.min(devicePixelRatio,1.5)-document.querySelector('#stage').clientWidth)<1; });
    await page.evaluate(() => new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    await page.screenshot({path: path.join(out, 'mobile.png'), fullPage: true});
    record('Responsive layout has no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
    await page.setViewportSize({width: 1440, height: 1100});
    await page.locator('#restart').click(); await page.locator('#speed').selectOption('4');
    const speedStarted = Date.now(); await page.locator('#play').click();
    await page.waitForFunction(() => modsimViewer.time >= 4);
    await page.locator('#play').click();
    const measuredSpeed = await page.evaluate(() => modsimViewer.time);
    record('Playback speed selector changes time advancement', Math.abs(measuredSpeed / ((Date.now() - speedStarted) / 1000) - 4) < .6);
    await page.locator('#speed').selectOption('2');
    await page.locator('#restart').click(); await page.locator('#play').click();
    await page.waitForFunction(() => modsimViewer.time >= 12, {timeout: 20000});
    await page.locator('#play').click();
    evidence.performance = await page.evaluate(() => {
      const dt = modsimViewer.frameIntervals;
      return {frames: dt.length, elapsedMs: dt.reduce((a, b) => a + b, 0), fps: 1000 * dt.length / dt.reduce((a, b) => a + b, 0), hardwareConcurrency: navigator.hardwareConcurrency, userAgent: navigator.userAgent};
    });
    record(`${data.ids.length > 1 ? 'Comparison' : 'Standalone'} playback meets 30 fps target on test machine`, evidence.performance.fps >= 30);
    await page.evaluate(() => modsimViewer.setTime(modsimViewer.payload.horizon_s - .1));
    await page.locator('#play').click();
    await page.waitForFunction(() => modsimViewer.time === modsimViewer.payload.horizon_s && !modsimViewer.playing);
    record('Playback stops at shared endpoint', true);
    record('Local file opening makes no HTTP(S) requests', !requests.some(u => /^https?:/.test(u)));
    record('No browser JavaScript errors', errors.length === 0);
    // WebGL failure on a fresh document with getContext deliberately unavailable.
    const fallback = await context.newPage();
    await fallback.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
    await fallback.goto(url);
    record('WebGL unavailable shows clear fallback', await fallback.locator('#error').isVisible() && (await fallback.locator('#error').textContent()).includes('WebGL'));
    await fallback.screenshot({path: path.join(out, 'webgl-unavailable.png'), fullPage: true});
    evidence.requests = requests; evidence.errors = errors;
    fs.writeFileSync(path.join(out, 'browser_checks.json'), JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
