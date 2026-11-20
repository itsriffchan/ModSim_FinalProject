'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import { projectXY } from '@/lib/display/projection';
import { getScenarioById } from '@/lib/payload/load';
import { CAMERA_LIMITS, cameraOffset } from '@/lib/map/cameraLimits';
import { DEFAULT_MAP_POSE, type MapPose } from '@/lib/map/mapPose';
import { loadVendorThree } from '@/lib/map/loadVendorThree';
import {
  cityCoverage,
  regionCoverage,
} from '@/lib/terrain/coverage';
import { cloneTerrainGroup, loadTerrain } from '@/lib/terrain/loadTerrain';
import type { ScenarioPayload } from '@/lib/payload/types';
import { useExplorerStore } from '@/lib/store/explorer-store';

import { CameraToolbar } from '@/components/map/CameraToolbar';
import {
  createHeatmapLayer,
  setHeatmapTerrainWash,
  updateHeatmapLayer,
} from '@/components/map/HeatmapLayer';
import {
  addIllustrativeScenery,
  IllustrativeSceneryBadge,
  MapboxAttribution,
  type TerrainBadgeState,
} from '@/components/map/IllustrativeScenery';
import { MapNavigationLegend } from '@/components/map/MapNavigationLegend';
import { NorthScaleOverlay } from '@/components/map/NorthScaleOverlay';
import { ScenarioHeatmap } from '@/components/map/ScenarioHeatmap';
import { addMapOverlays, updateArrivalBoundary } from '@/components/map/Overlays';
import {
  addPlaceLabelAnchors,
  placeLabelSpecs,
  type PlaceLabelSpec,
} from '@/components/map/PlaceLabels';

export interface MapCanvasProps {
  scenario?: ScenarioPayload;
  damage?: number[];
  time?: number;
  focusXyM?: (number | null)[][];
  highlightedCellIds?: Set<number>;
  dimUnhighlighted?: boolean;
  pose?: MapPose;
  onPoseChange?: (pose: MapPose) => void;
  className?: string;
  'aria-label'?: string;
}

function finiteFocusPairs(xy: (number | null)[][] | undefined): number[][] {
  if (!xy?.length) return [];
  return xy.filter(
    (p): p is [number, number] =>
      Array.isArray(p) &&
      typeof p[0] === 'number' &&
      typeof p[1] === 'number' &&
      Number.isFinite(p[0]) &&
      Number.isFinite(p[1]),
  );
}

function InnerMapCanvas({
  scenario: scenarioProp,
  damage: damageProp,
  time: timeProp,
  focusXyM,
  highlightedCellIds,
  dimUnhighlighted = false,
  pose: poseProp,
  onPoseChange,
  className = '',
  'aria-label': ariaLabel,
}: MapCanvasProps) {
  const payload = useExplorerStore((s) => s.payload);
  const scenarioId = useExplorerStore((s) => s.scenarioId);
  const cameraMode = useExplorerStore((s) => s.cameraMode);
  const storeTime = useExplorerStore((s) => s.time);
  const setTime = useExplorerStore((s) => s.setTime);
  const setSelectedCell = useExplorerStore((s) => s.setSelectedCell);
  const stateAt = useExplorerStore((s) => s.stateAt);

  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const applyingPose = useRef(false);
  const glApiRef = useRef<{ applyPose?: (p: MapPose) => void }>({});
  const onPoseChangeRef = useRef(onPoseChange);
  onPoseChangeRef.current = onPoseChange;

  const [webglFailed, setWebglFailed] = useState(false);
  const [terrainBadge, setTerrainBadge] = useState<TerrainBadgeState>('none');
  const [pose, setPose] = useState({ polar: Math.PI / 2, azimuth: 0 });
  const [scaleBar, setScaleBar] = useState({ km: 5, px: 64 });

  const scenario =
    scenarioProp ??
    (payload && scenarioId !== 'all'
      ? getScenarioById(payload, scenarioId)
      : payload
        ? getScenarioById(payload, 'A') ??
          (Array.isArray(payload.scenarios) ? payload.scenarios[0] : payload.scenarios)
        : undefined);

  const time = timeProp ?? storeTime;

  useEffect(() => {
    if (!payload || !scenario || !hostRef.current) return;

    let disposed = false;
    let raf = 0;
    let unsubMode = () => {};
    let controls: import('@/types/three-vendor').ThreeVendor | null = null;
    let renderer: import('@/types/three-vendor').ThreeVendor;
    let scene: import('@/types/three-vendor').ThreeVendor;
    let orthoCamera: import('@/types/three-vendor').ThreeVendor;
    let perspCamera: import('@/types/three-vendor').ThreeVendor;
    let heatmap: ReturnType<typeof createHeatmapLayer> | null = null;
    let overlayRefs: ReturnType<typeof addMapOverlays> | null = null;
    let buildings: { visible: boolean } | null = null;
    let water: { visible: boolean } | null = null;
    let last = 0;
    let shownTime = -1;
    let resizeObserver: ResizeObserver | null = null;
    let onPointerDown: ((e: PointerEvent) => void) | null = null;
    let onPointerUp: ((e: PointerEvent) => void) | null = null;
    let currentMode = useExplorerStore.getState().cameraMode;
    const grid = payload.grid;
    const spanX = (Math.max(...grid.x_m) - Math.min(...grid.x_m)) / 1000;
    const spanY = (Math.max(...grid.y_m) - Math.min(...grid.y_m)) / 1000;
    const pad = 1.06;
    const halfX = (spanX / 2) * pad;
    const halfY = (spanY / 2) * pad;
    const vFov = (40 * Math.PI) / 180;

    const fitRadius = (aspect: number) => {
      const distY = halfY / Math.tan(vFov / 2);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
      const distX = halfX / Math.tan(hFov / 2);
      return Math.max(distX, distY);
    };

    const readPoseFromControls = (): MapPose => {
      if (!controls) return DEFAULT_MAP_POSE;
      const mode = useExplorerStore.getState().cameraMode;
      const cam = mode === 'bird' ? orthoCamera : perspCamera;
      return {
        polar: controls.getPolarAngle(),
        azimuth: controls.getAzimuthAngle(),
        distance: cam.position.distanceTo(controls.target),
        targetX: controls.target.x,
        targetY: controls.target.y,
        orthoZoom: mode === 'bird' ? orthoCamera.zoom : DEFAULT_MAP_POSE.orthoZoom,
      };
    };

    const applyPose = (p: MapPose) => {
      if (!controls) return;
      applyingPose.current = true;
      const mode = useExplorerStore.getState().cameraMode;
      const active = mode === 'bird' ? orthoCamera : perspCamera;
      controls.object = active;
      active.up.set(0, 1, 0);
      controls.target.set(p.targetX, p.targetY, 0);
      const [x, y, z] = cameraOffset(p.polar, p.azimuth, p.distance);
      active.position.set(p.targetX + x, p.targetY + y, z);
      if (mode === 'bird') orthoCamera.zoom = p.orthoZoom;
      active.updateProjectionMatrix();
      controls.update();
      applyingPose.current = false;
    };

    const applyCameraMode = () => {
      const mode = useExplorerStore.getState().cameraMode;
      const limit = CAMERA_LIMITS[mode];
      const aspect = hostRef.current
        ? hostRef.current.clientWidth / Math.max(hostRef.current.clientHeight, 1)
        : 1.6;
      const active = mode === 'bird' ? orthoCamera : perspCamera;
      controls.object = active;
      controls.enableRotate = limit.rotate;
      controls.minPolarAngle = limit.polarMin;
      controls.maxPolarAngle = limit.polarMax;
      controls.minAzimuthAngle = limit.azimuthMin;
      controls.maxAzimuthAngle = limit.azimuthMax;
      const altitude = mode === 'bird' ? 80 : fitRadius(aspect);
      const poseRadius =
        mode === 'bird' ? altitude : altitude / Math.cos(limit.polar - Math.PI / 2);
      controls.minDistance = poseRadius * 0.34;
      controls.maxDistance = poseRadius * 1.06;
      controls.minZoom = 0.88;
      controls.maxZoom = 8;
      const [x, y, z] = cameraOffset(limit.polar, limit.azimuth, poseRadius);
      active.up.set(0, 1, 0);
      active.position.set(x, y, z);
      if (mode === 'bird') active.zoom = 1;
      controls.target.set(0, 0, 0);
      active.lookAt(0, 0, 0);
      active.updateProjectionMatrix();
      controls.update();
    };

    const resetNorth = () => {
      applyCameraMode();
    };
    resetRef.current = resetNorth;

    loadVendorThree()
      .then(() => {
        if (disposed || !hostRef.current) return;
        const THREE = window.THREE;
        const host = hostRef.current;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0xc5d8e6, 1);

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xc5d8e6);

        orthoCamera = new THREE.OrthographicCamera(-24, 24, 27, -27, 0.1, 800);
        orthoCamera.up.set(0, 1, 0);

        perspCamera = new THREE.PerspectiveCamera(40, 1, 0.1, 800);
        perspCamera.up.set(0, 1, 0);

        controls = new THREE.OrbitControls(orthoCamera, renderer.domElement);
        controls.enableDamping = false;
        controls.screenSpacePanning = true;
        controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
        controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
        controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
        controls.touches.ONE = THREE.TOUCH.PAN;
        controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
        glApiRef.current.applyPose = applyPose;

        const focusPairs = finiteFocusPairs(focusXyM);
        const terrainRequest = focusPairs.length
          ? cityCoverage(grid, focusPairs)
          : regionCoverage(grid);
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

        const scenery = addIllustrativeScenery(THREE, scene, grid);
        buildings = scenery.buildings;
        water = scenery.water;

        heatmap = createHeatmapLayer(THREE, scene, grid, scenario);
        overlayRefs = addMapOverlays(THREE, scene, payload, scenario);
        addPlaceLabelAnchors(THREE, scene, grid, payload.overlays);

        void loadTerrain(grid, terrainRequest, token).then((result) => {
          if (disposed) return;
          if (result.status === 'ready' && result.group) {
            const terrain = cloneTerrainGroup(result.group);
            terrain.renderOrder = -10;
            scene.add(terrain);
            if (water) water.visible = false;
            if (heatmap) setHeatmapTerrainWash(heatmap, true);
            setTerrainBadge('ready');
          } else if (result.status === 'absent') {
            setTerrainBadge('absent');
          } else {
            setTerrainBadge('failed');
          }
        });

        const syncCameraBindings = () => {
          currentMode = useExplorerStore.getState().cameraMode;
          applyCameraMode();
        };
        syncCameraBindings();
        if (poseProp) applyPose(poseProp);

        host.appendChild(renderer.domElement);
        renderer.domElement.className = 'explorer-map-canvas';
        renderer.domElement.setAttribute('aria-hidden', 'true');

        let pointerDown: [number, number] | null = null;
        onPointerDown = (e: PointerEvent) => {
          pointerDown = [e.clientX, e.clientY];
        };
        onPointerUp = (e: PointerEvent) => {
          if (!pointerDown || !heatmap) return;
          if (Math.hypot(e.clientX - pointerDown[0], e.clientY - pointerDown[1]) > 5) {
            pointerDown = null;
            return;
          }
          const rect = host.getBoundingClientRect();
          const pointer = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            1 - ((e.clientY - rect.top) / rect.height) * 2,
          );
          const cam =
            useExplorerStore.getState().cameraMode === 'bird'
              ? orthoCamera
              : perspCamera;
          cam.updateMatrixWorld();
          heatmap.mesh.computeBoundingSphere();
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(pointer, cam);
          const hit = raycaster.intersectObject(heatmap.mesh)[0];
          if (hit?.instanceId !== undefined) {
            setSelectedCell({ scenarioId: scenario.id, cellIndex: hit.instanceId });
          }
          pointerDown = null;
        };
        renderer.domElement.addEventListener('pointerdown', onPointerDown);
        renderer.domElement.addEventListener('pointerup', onPointerUp);

        const resize = () => {
          const w = host.clientWidth;
          const h = host.clientHeight;
          if (w < 1 || h < 1) return;
          renderer.setSize(w, h, false);
          perspCamera.aspect = w / h;
          perspCamera.updateProjectionMatrix();
        };
        resize();
        resizeObserver = new ResizeObserver(() => resize());
        resizeObserver.observe(host);

        const labelSpecs: PlaceLabelSpec[] = placeLabelSpecs(grid, payload.overlays);

        let prevMode = useExplorerStore.getState().cameraMode;
        unsubMode = useExplorerStore.subscribe((state) => {
          if (state.cameraMode !== prevMode) {
            prevMode = state.cameraMode;
            currentMode = state.cameraMode;
            applyCameraMode();
          }
        });

        const damageFor = (t: number) =>
          damageProp ?? stateAt(scenario, t).damage;

        const tick = (now: number) => {
          if (disposed) return;
          const store = useExplorerStore.getState();
          if (last && store.playing && timeProp === undefined) {
            const horizon = payload.horizon_s;
            const next = store.time + ((now - last) / 1000) * store.speed;
            setTime(next);
            if (next >= horizon) {
              store.setPlaying(false);
            }
          }
          last = now;

          const t = timeProp ?? store.time;
          const timeChanged = Math.abs(t - shownTime) > 1e-4;
          if (timeChanged && heatmap && overlayRefs) {
            updateHeatmapLayer(THREE, heatmap, grid, scenario, damageFor(t), t, {
              highlightedCellIds,
              dimUnhighlighted,
            });
            updateArrivalBoundary(THREE, grid, overlayRefs, scenario, t);
            shownTime = t;
          }

          const mode = store.cameraMode;
          const camera = mode === 'bird' ? orthoCamera : perspCamera;
          const aspect = host.clientWidth / Math.max(host.clientHeight, 1);
          if (mode === 'bird') {
            const halfH = Math.max(halfY, halfX / aspect);
            orthoCamera.top = halfH;
            orthoCamera.bottom = -halfH;
            orthoCamera.left = -halfH * aspect;
            orthoCamera.right = halfH * aspect;
            orthoCamera.updateProjectionMatrix();
          }
          if (buildings) buildings.visible = mode !== 'bird';

          const cameraMoved = Boolean(controls.update());
          renderer.render(scene, camera);

          if (cameraMoved) {
            const polar = controls.getPolarAngle();
            const azimuth = controls.getAzimuthAngle();
            setPose((prev) =>
              Math.abs(prev.polar - polar) < 0.01 && Math.abs(prev.azimuth - azimuth) < 0.01
                ? prev
                : { polar, azimuth },
            );
            if (onPoseChangeRef.current && !applyingPose.current) {
              onPoseChangeRef.current(readPoseFromControls());
            }
          }

          if (mode === 'bird' && host.clientHeight > 0 && (cameraMoved || timeChanged)) {
            const kmSpan = (orthoCamera.top - orthoCamera.bottom) / (orthoCamera.zoom || 1);
            const pxPerKm = host.clientHeight / kmSpan;
            const choice = [20, 10, 5, 2].find((km) => km * pxPerKm <= 140) ?? 2;
            const px = Math.max(28, choice * pxPerKm);
            setScaleBar((prev) =>
              prev.km === choice && Math.abs(prev.px - px) < 1 ? prev : { km: choice, px },
            );
          }

          if (cameraMoved || timeChanged) {
            const nodes = labelsRef.current?.children;
            if (nodes) {
              labelSpecs.forEach((spec, i) => {
                const el = nodes[i] as HTMLElement | undefined;
                if (!el) return;
                const p = projectXY(grid, spec.x_m, spec.y_m, 300);
                const v = new THREE.Vector3(p.x, p.y, p.z).project(camera);
                const hidden = Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05 || v.z > 1;
                el.style.left = `${((v.x + 1) / 2) * host.clientWidth}px`;
                el.style.top = `${((1 - v.y) / 2) * host.clientHeight}px`;
                el.style.opacity = hidden ? '0' : '1';
              });
            }
          }

          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch(() => {
        setWebglFailed(true);
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      unsubMode();
      resetRef.current = null;
      glApiRef.current.applyPose = undefined;
      resizeObserver?.disconnect();
      if (renderer?.domElement) {
        if (onPointerDown) renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        if (onPointerUp) renderer.domElement.removeEventListener('pointerup', onPointerUp);
      }
      controls?.dispose?.();
      if (renderer?.domElement?.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer?.dispose?.();
    };
  }, [
    payload,
    scenario,
    setSelectedCell,
    setTime,
    stateAt,
    damageProp,
    timeProp,
    focusXyM,
    highlightedCellIds,
    dimUnhighlighted,
  ]);

  useEffect(() => {
    if (poseProp && glApiRef.current.applyPose) {
      glApiRef.current.applyPose(poseProp);
    }
  }, [poseProp]);

  if (!payload || !scenario) {
    return (
      <div className={`explorer-map-stage ${className}`} aria-busy="true">
        <div className="flex items-center justify-center h-full text-sm text-[var(--shell-muted)]">
          Loading map…
        </div>
      </div>
    );
  }

  if (webglFailed) {
    const damage = damageProp ?? stateAt(scenario).damage;
    return (
      <div className={`relative min-h-[280px] ${className}`}>
        <ScenarioHeatmap
          payload={payload}
          scenario={scenario}
          damage={damage}
          time={time}
          viewport={{ panX: 0, panY: 0, zoom: 1 }}
          cameraMode={cameraMode}
          highlightedCellIds={highlightedCellIds}
          dimUnhighlighted={dimUnhighlighted}
          aria-label={ariaLabel ?? `Scenario ${scenario.id} damage map`}
        />
      </div>
    );
  }

  return (
    <div className={`explorer-map-stage ${className}`}>
      <CameraToolbar onResetNorth={() => resetRef.current?.()} />
      <IllustrativeSceneryBadge terrain={terrainBadge} />
      {terrainBadge === 'ready' ? <MapboxAttribution /> : null}
      <NorthScaleOverlay mode={cameraMode} km={scaleBar.km} px={scaleBar.px} />
      <MapNavigationLegend mode={cameraMode} polar={pose.polar} azimuth={pose.azimuth} />
      <div ref={labelsRef} className="explorer-map-labels" aria-hidden>
        {placeLabelSpecs(payload.grid, payload.overlays).map((label) => (
          <span
            key={label.name}
            className={`explorer-place-label${label.name.includes('Bay') ? ' explorer-place-label-water' : ''}`}
          >
            {label.name}
          </span>
        ))}
      </div>
      <div
        ref={hostRef}
        className="explorer-map-host"
        aria-label={ariaLabel ?? `Scenario ${scenario.id} damage heatmap`}
        role="application"
      />
    </div>
  );
}

function MapCanvasClient(props: MapCanvasProps) {
  return <InnerMapCanvas {...props} />;
}

export const MapCanvas = dynamic(() => Promise.resolve(MapCanvasClient), {
  ssr: false,
  loading: () => (
    <div className="explorer-map-stage flex items-center justify-center text-sm text-[var(--shell-muted)]">
      Initializing map…
    </div>
  ),
});

export type { MapPose };