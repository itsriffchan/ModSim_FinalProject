/* Display only: scientific relationships are evaluated exclusively in MATLAB. */
(() => {
  'use strict';
  const P = JSON.parse(document.getElementById('payload').textContent);
  const scenarios = Array.isArray(P.scenarios) ? P.scenarios : [P.scenarios];
  const $ = id => document.getElementById(id);
  const fmt = n => n.toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1});
  const grid = P.grid, index = new Map(grid.cell_id.map((id, i) => [id, i]));
  const center = [(Math.min(...grid.x_m) + Math.max(...grid.x_m)) / 2, (Math.min(...grid.y_m) + Math.max(...grid.y_m)) / 2];
  const xy = (x, y, z = 0) => new THREE.Vector3((x - center[0]) / 1000, (y - center[1]) / 1000, z);
  const stage = $('stage'); let panels = [], renderer, syncing = false;
  let time = 0, playing = false, mode = scenarios.length > 1 ? 'all' : scenarios[0].id;
  let dirty = true, last = 0, frames = [], renderWidth = 0, renderHeight = 0;
  const colorStops = [0x176b91, 0x3c9d9b, 0xe0c55b, 0xce663f, 0x982e46].map(c => new THREE.Color(c));
  const color = new THREE.Color(), transform = new THREE.Object3D();
  const fraction = (t, onset, duration) => Math.min(1, Math.max(0, (t - onset) / duration));
  function state(s, t) {
    const damage = [], counts = [0, 0];
    for (let i = 0; i < s.cell_id.length; i++) {
      const f = fraction(t, s.onset_s[i], s.duration_s);
      damage.push(f * s.final_heavy[i]);
      counts[0] += f * s.final_losses[i][0]; counts[1] += f * s.final_losses[i][1];
    }
    return {damage, counts};
  }
  function probabilityColor(p) {
    const a = Math.min(3, Math.floor(p * 4));
    return color.copy(colorStops[a]).lerp(colorStops[a + 1], p * 4 - a);
  }
  function line(scene, points, hex, overlay = true) {
    let part = [];
    function flush() {
      if (part.length > 1) {
        const m = new THREE.LineBasicMaterial({color: hex, depthTest: !overlay, transparent: overlay, opacity: 1});
        const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(part), m);
        l.renderOrder = overlay ? 5 : 0; scene.add(l);
      }
      part = [];
    }
    for (const pair of points) { if (pair[0] === null || pair[1] === null) flush(); else part.push(xy(pair[0], pair[1], 0.12)); }
    flush();
  }
  function reset(panel) {
    panel.camera.up.set(0, 0, 1); panel.camera.position.set(0, -34, 48);
    panel.camera.zoom = 1; panel.controls.target.set(0, 0, 0); panel.controls.update();
    panel.camera.updateProjectionMatrix();
  }
  function link(source) {
    if (syncing) return; syncing = true;
    for (const p of panels) if (p !== source) {
      p.camera.position.copy(source.camera.position); p.camera.quaternion.copy(source.camera.quaternion);
      p.camera.zoom = source.camera.zoom; p.controls.target.copy(source.controls.target);
      p.camera.updateProjectionMatrix(); p.controls.update();
    }
    syncing = false; dirty = true;
  }
  function buildPanel(s) {
    const node = document.createElement('article'); node.className = 'panel';
    const city = s.settings.epicenter === 'baseline' ? 'Pasig' : 'Muntinlupa';
    node.innerHTML = `<header><h2>${s.id} / ${city} / ${s.duration_s} s</h2><div class="counter"><span>Deaths <b class="deaths">0.0</b></span><span>Injuries <b class="injuries">0.0</b></span></div><div class="status">Animated NCR expectations · paused at origin</div></header><div class="map" aria-label="Scenario ${s.id} 3D map"><span class="projected north">N ↑</span><span class="projected scale">5 km</span></div>`;
    $('panels').appendChild(node); const map = node.querySelector('.map');
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const light = new THREE.DirectionalLight(0xffffff, 2.1); light.position.set(-10, -15, 40); scene.add(light);
    const camera = new THREE.OrthographicCamera(-24, 24, 27, -27, 0.1, 300);
    // OrbitControls captures the up axis during construction.
    camera.up.set(0, 0, 1);
    const controls = new THREE.OrbitControls(camera, map); controls.enableDamping = false;
    controls.minZoom = 0.45; controls.maxZoom = 8; controls.maxPolarAngle = Math.PI / 2.05;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({roughness: 0.8, metalness: 0});
    const mesh = new THREE.InstancedMesh(geometry, material, s.cell_id.length); mesh.frustumCulled = false;
    const inactive = grid.cell_id.map((_, i) => i).filter(i => !grid.active[i]);
    const grey = new THREE.InstancedMesh(geometry, new THREE.MeshBasicMaterial({color: 0xabb7c0}), inactive.length);
    inactive.forEach((i, j) => {
      transform.position.copy(xy(grid.x_m[i], grid.y_m[i], -0.05));
      transform.scale.set(grid.cell_size_m / 1000 * .94, grid.cell_size_m / 1000 * .94, .08);
      transform.updateMatrix(); grey.setMatrixAt(j, transform.matrix);
    });
    scene.add(mesh, grey);
    for (const lgu of P.overlays.lgu) line(scene, lgu.xy_m, 0x354d60);
    line(scene, P.overlays.fault_xy_m, 0xa92349);
    const [ex, ey] = s.epicenter_xy_m;
    for (const [inner, outer, hex] of [[.52, .72, 0xffffff], [.72, .8, 0x101b27]]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 32), new THREE.MeshBasicMaterial({color: hex, depthTest: false, transparent: true}));
      ring.position.copy(xy(ex, ey, .15)); ring.renderOrder = 6; scene.add(ring);
    }
    line(scene, [[ex - 650, ey], [ex + 650, ey]], 0x101b27);
    line(scene, [[ex, ey - 650], [ex, ey + 650]], 0x101b27);
    const west = Math.min(...grid.x_m) - 1200, south = Math.min(...grid.y_m) + 2500;
    const north = Math.max(...grid.y_m) - 4000;
    line(scene, [[west, north], [west, north + 3000], [west - 400, north + 2200], [west, north + 3000], [west + 400, north + 2200]], 0x20323f);
    line(scene, [[west, south + 300], [west, south], [west + 5000, south], [west + 5000, south + 300]], 0x20323f);
    const panel = {s, node, map, scene, camera, controls, mesh, north: xy(west, north + 4000), scale: xy(west + 1200, south - 800)};
    reset(panel); controls.addEventListener('change', () => link(panel));
    let down;
    map.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    map.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const rect = map.getBoundingClientRect(), pointer = new THREE.Vector2((e.clientX - rect.left) / rect.width * 2 - 1, 1 - (e.clientY - rect.top) / rect.height * 2);
      camera.updateMatrixWorld(); mesh.computeBoundingSphere();
      const ray = new THREE.Raycaster(); ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObject(mesh)[0];
      if (hit) inspect(s, hit.instanceId);
    });
    return panel;
  }
  function inspect(s, i) {
    const id = s.cell_id[i], g = index.get(id);
    const values = [['Population', fmt(grid.population[g])], ['Final PGV', `${fmt(s.pgv_cm_s[i])} cm/s`], ['Final heavy probability', s.final_heavy[i].toFixed(6)], ['Expected deaths', fmt(s.final_losses[i][0])], ['Expected injuries', fmt(s.final_losses[i][1])]];
    $('inspection').innerHTML = `<h2>Scenario ${s.id} · Cell ${id}</h2><p>Final model outputs; independent of the playback position.</p><div class="cellvalues">${values.map(([label, value]) => `<span>${label}<b>${value}</b></span>`).join('')}</div>`;
    $('inspection').dataset.cellId = id;
  }
  function table() {
    const selected = mode === 'all' ? scenarios : scenarios.filter(s => s.id === mode);
    $('lgu').innerHTML = `<thead><tr><th scope="col">LGU</th>${selected.map(s => `<th scope="col">${s.id} deaths</th><th scope="col">${s.id} injuries</th>`).join('')}</tr></thead><tbody>${selected[0].lgu.map(l => `<tr><th scope="row">${l.lgu_name}</th>${selected.map(s => { const v = s.lgu.find(a => a.adm3_pcode === l.adm3_pcode); return `<td>${fmt(v.expected_deaths)}</td><td>${fmt(v.expected_injuries)}</td>`; }).join('')}</tr>`).join('')}</tbody><tfoot><tr><th scope="row">NCR total</th>${selected.map(s => `<td>${fmt(s.totals[0])}</td><td>${fmt(s.totals[1])}</td>`).join('')}</tr></tfoot>`;
  }
  function show(next) {
    mode = next;
    for (const p of panels) { p.controls.dispose(); p.scene.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); }
    panels = []; $('panels').replaceChildren();
    const selected = mode === 'all' ? scenarios : scenarios.filter(s => s.id === mode);
    stage.classList.toggle('compare', selected.length > 1); $('panels').style.setProperty('--count', selected.length);
    panels = selected.map(buildPanel);
    document.querySelectorAll('#views button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === mode)));
    table(); dirty = true;
  }
  function setTime(t) { time = Math.min(P.horizon_s, Math.max(0, Number(t))); if (time >= P.horizon_s) setPlaying(false); dirty = true; }
  function setPlaying(value) { playing = value; $('play').textContent = playing ? 'Pause' : 'Play'; $('play').setAttribute('aria-pressed', String(playing)); }
  function update() {
    $('time').value = time; $('clock').textContent = `${time.toFixed(2)} s`;
    for (const p of panels) {
      const a = state(p.s, time);
      a.damage.forEach((prob, i) => {
        const j = index.get(p.s.cell_id[i]), h = .08 + P.encoding.height_max_km * prob;
        transform.position.copy(xy(grid.x_m[j], grid.y_m[j], h / 2));
        transform.scale.set(grid.cell_size_m / 1000 * .94, grid.cell_size_m / 1000 * .94, h);
        transform.updateMatrix(); p.mesh.setMatrixAt(i, transform.matrix); p.mesh.setColorAt(i, probabilityColor(prob));
      });
      p.mesh.instanceMatrix.needsUpdate = true; p.mesh.instanceColor.needsUpdate = true;
      p.node.querySelector('.deaths').textContent = fmt(a.counts[0]); p.node.querySelector('.injuries').textContent = fmt(a.counts[1]);
      p.node.querySelector('.status').textContent = time >= p.s.horizon_s ? 'Complete · final NCR expectations' : 'Animated NCR expectations · assumed timing';
    }
  }
  function render() {
    const rect = stage.getBoundingClientRect(), w = stage.clientWidth, h = stage.clientHeight;
    if (w !== renderWidth || h !== renderHeight) { renderer.setSize(w, h, false); renderWidth = w; renderHeight = h; }
    renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
    for (const p of panels) {
      const box = p.map.getBoundingClientRect(), aspect = box.width / box.height;
      p.camera.left = -27 * aspect; p.camera.right = 27 * aspect; p.camera.updateProjectionMatrix();
      renderer.setViewport(box.left - rect.left, rect.bottom - box.bottom, box.width, box.height);
      renderer.setScissor(box.left - rect.left, rect.bottom - box.bottom, box.width, box.height);
      renderer.render(p.scene, p.camera);
      for (const name of ['north', 'scale']) {
        const v = p[name].clone().project(p.camera), label = p.map.querySelector(`.${name}`);
        label.style.left = `${(v.x + 1) / 2 * box.width}px`; label.style.top = `${(1 - v.y) / 2 * box.height}px`;
        label.hidden = Math.abs(v.x) > .95 || Math.abs(v.y) > .95;
      }
    }
  }
  function tick(now) {
    if (last && playing) { frames.push(now - last); if (frames.length > 600) frames.shift(); setTime(time + (now - last) / 1000 * Number($('speed').value)); }
    last = now;
    if (dirty || playing) { update(); render(); dirty = false; }
    requestAnimationFrame(tick);
  }
  try {
    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.autoClear = false;
    stage.prepend(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true');
    const choices = scenarios.map(s => [s.id, `${s.id} · ${s.settings.epicenter === 'baseline' ? 'Pasig' : 'Muntinlupa'} ${s.duration_s} s`]);
    if (scenarios.length > 1) choices.push(['all', 'A / B / C comparison']);
    for (const [id, label] of choices) { const b = document.createElement('button'); b.textContent = label; b.dataset.view = id; b.onclick = () => show(id); $('views').appendChild(b); }
    $('time').max = P.horizon_s; $('speed').value = String(P.timing.playback_speed);
    $('play').onclick = () => { if (time >= P.horizon_s) setTime(0); setPlaying(!playing); };
    $('restart').onclick = () => { setPlaying(false); setTime(0); };
    $('time').oninput = e => setTime(e.target.value);
    $('reset').onclick = () => { for (const p of panels) reset(p); dirty = true; };
    new ResizeObserver(() => { dirty = true; }).observe(stage);
    $('provenance').textContent = JSON.stringify({schema_version: P.schema_version, settings: scenarios.map(s => s.settings), provenance: P.provenance}, null, 2);
    show(mode); requestAnimationFrame(tick);
    // Read-only state and explicit controls for reproducible browser acceptance.
    window.modsimViewer = {payload: P, state, setTime, show, inspect, get time() { return time; }, get playing() { return playing; }, get mode() { return mode; }, get panels() { return panels; }, get frameIntervals() { return frames.slice(); }};
  } catch (error) {
    $('error').hidden = false; $('error').textContent = `The 3D viewer needs WebGL. Enable hardware acceleration in your browser or open the static p_heavy.png and numerical CSV files. Details: ${error.message}`;
    stage.hidden = true; document.querySelectorAll('.toolbar button,.toolbar input,.toolbar select').forEach(e => { e.disabled = true; });
  }
})();
