'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import { projectXY } from '@/lib/display/projection';
import { getScenarioById } from '@/lib/payload/load';
import { cameraOffset } from '@/lib/map/cameraLimits';
import { LOCKED_CAMERA } from '@/lib/map/lockedCamera';
import { DEFAULT_MAP_POSE, type MapPose } from '@/lib/map/mapPose';
import { loadVendorThree } from '@/lib/map/loadVendorThree';
import { basemapLayers } from '@/lib/basemap/osmTiles';
import type { BasemapLoadStatus } from '@/lib/basemap/tileCache';
import { addOsmBasemap } from '@/components/map/OsmBasemap';
import type { ScenarioPayload } from '@/lib/payload/types';
import { useExplorerStore } from '@/lib/store/explorer-store';

import { LockedMapChrome } from '@/components/map/LockedMapChrome';
import {
  createHeatmapLayer,
  setHeatmapBasemapWash,
  updateHeatmapLayer,
} from '@/components/map/HeatmapLayer';
import {
  addIllustrativeScenery,
  IllustrativeSceneryBadge,
  OsmAttribution,
  type BasemapBadgeState,
} from '@/components/map/IllustrativeScenery';
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

  useEffect(() => {
    onPoseChangeRef.current = onPoseChange;
  }, [onPoseChange]);

  const [webglFailed, setWebglFailed] = useState(false);
  const [basemapBadge, setBasemapBadge] = useState<BasemapBadgeState>('loading');
  const [pose, setPose] = useState({ polar: Math.PI / 2, azimuth: 0 });

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
    let controls: import('@/types/three-vendor').ThreeVendor | null = null;
    let renderer: import('@/types/three-vendor').ThreeVendor;
    let scene: import('@/types/three-vendor').ThreeVendor;
    let orthoCamera: import('@/types/three-vendor').ThreeVendor;
    let perspCamera: import('@/types/three-vendor').ThreeVendor;
    let heatmap: ReturnType<typeof createHeatmapLayer> | null = null;
    let overlayRefs: ReturnType<typeof addMapOverlays> | null = null;
    let buildings: { visible: boolean } | null = null;
    let osmBasemap: ReturnType<typeof addOsmBasemap> | null = null;
    let last = 0;
    let shownTime = -1;
    let resizeObserver: ResizeObserver | null = null;
    let onPointerDown: ((e: PointerEvent) => void) | null = null;
    let onPointerUp: ((e: PointerEvent) => void) | null = null;
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
      const cam = perspCamera;
      return {
        polar: controls.getPolarAngle(),
        azimuth:
          controls.getAzimuthAngle?.() ?? controls.getAzimuthalAngle?.() ?? 0,
        distance: cam.position.distanceTo(controls.target),
        targetX: controls.target.x,
        targetY: controls.target.y,
        orthoZoom: DEFAULT_MAP_POSE.orthoZoom,
      };
    };

    const applyPose = (p: MapPose) => {
      if (!controls) return;
      applyingPose.current = true;
      const active = perspCamera;
      controls.object = active;
      active.up.set(0, 1, 0);
      controls.target.set(p.targetX, p.targetY, 0);
      const [x, y, z] = cameraOffset(p.polar, p.azimuth, p.distance);
      active.position.set(p.targetX + x, p.targetY + y, z);
      active.updateProjectionMatrix();
      controls.update();
      applyingPose.current = false;
    };

    const applyCameraMode = () => {
      const limit = LOCKED_CAMERA;
      const aspect = hostRef.current
        ? hostRef.current.clientWidth / Math.max(hostRef.current.clientHeight, 1)
        : 1.6;
      const active = perspCamera;
      controls.object = active;
      controls.enableRotate = false;
      controls.minPolarAngle = limit.polar;
      controls.maxPolarAngle = limit.polar;
      controls.minAzimuthAngle = limit.azimuth;
      controls.maxAzimuthAngle = limit.azimuth;
      /* OrbitControls MOUSE.PAN */
      controls.mouseButtons.LEFT = 2;
      controls.mouseButtons.RIGHT = 2;
      const poseRadius = fitRadius(aspect) / Math.cos(limit.polar - Math.PI / 2);
      controls.minDistance = poseRadius * 0.34;
      controls.maxDistance = poseRadius * 1.06;
      const [x, y, z] = cameraOffset(limit.polar, limit.azimuth, poseRadius);
      active.up.set(0, 1, 0);
      active.position.set(x, y, z);
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

        const scenery = addIllustrativeScenery(THREE, scene, grid);
        buildings = scenery.buildings;

        heatmap = createHeatmapLayer(THREE, scene, grid, scenario);
        overlayRefs = addMapOverlays(THREE, scene, payload, scenario);
        addPlaceLabelAnchors(THREE, scene, grid, payload.overlays);

        const layers = basemapLayers(grid, focusXyM);
        const onBasemapStatus = (status: BasemapLoadStatus) => {
          if (disposed) return;
          const badge: BasemapBadgeState =
            status === 'ready' || status === 'partial' || status === 'failed'
              ? status
              : 'loading';
          setBasemapBadge(badge);
          const wash = status === 'ready' || status === 'partial';
          if (heatmap) setHeatmapBasemapWash(heatmap, wash);
        };
        osmBasemap = addOsmBasemap(THREE, scene, grid, layers, onBasemapStatus);

        const syncCameraBindings = () => {
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
          perspCamera.updateMatrixWorld();
          heatmap.mesh.computeBoundingSphere();
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(pointer, perspCamera);
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

          const camera = perspCamera;
          if (buildings) buildings.visible = true;

          const cameraMoved = Boolean(controls.update());
          renderer.render(scene, camera);

          if (cameraMoved) {
            const polar = controls.getPolarAngle();
            const azimuth =
              controls.getAzimuthAngle?.() ?? controls.getAzimuthalAngle?.() ?? 0;
            setPose((prev) =>
              Math.abs(prev.polar - polar) < 0.01 && Math.abs(prev.azimuth - azimuth) < 0.01
                ? prev
                : { polar, azimuth },
            );
            if (onPoseChangeRef.current && !applyingPose.current) {
              onPoseChangeRef.current(readPoseFromControls());
            }
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
      resetRef.current = null;
      glApiRef.current.applyPose = undefined;
      resizeObserver?.disconnect();
      if (renderer?.domElement) {
        if (onPointerDown) renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        if (onPointerUp) renderer.domElement.removeEventListener('pointerup', onPointerUp);
      }
      osmBasemap?.dispose();
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
          cameraMode="low"
          highlightedCellIds={highlightedCellIds}
          dimUnhighlighted={dimUnhighlighted}
          aria-label={ariaLabel ?? `Scenario ${scenario.id} damage map`}
        />
      </div>
    );
  }

  return (
    <div className={`explorer-map-stage ${className}`}>
      <LockedMapChrome onResetView={() => resetRef.current?.()} />
      <IllustrativeSceneryBadge basemap={basemapBadge} />
      {basemapBadge === 'ready' || basemapBadge === 'partial' ? (
        <OsmAttribution />
      ) : null}
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