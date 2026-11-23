'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AttributionControl,
  GeoJSONSource,
  Map,
  setWorkerUrl,
  type MapGeoJSONFeature,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { LockedMapChrome } from '@/components/map/LockedMapChrome';
import {
  buildCellIndex,
  damageHexAtUtm,
  featureCentroidLonLat,
  gridIndexAtUtm,
  scenarioIndexForGridIndex,
} from '@/lib/basemap/buildingDamage';
import { epicenterGeoJson, gridBoundsLonLat, lguBoundsLonLat } from '@/lib/basemap/geojsonOverlays';
import {
  emptyGridPaintCache,
  paintGridCells,
  raiseScenarioLines,
} from '@/lib/basemap/gridCellFill';
import {
  BUILDING_DAMAGE_LAYER_ID,
  OPENFREEMAP_ATTRIBUTION,
  OPENFREEMAP_LIBERTY_STYLE,
  REGION_LOCAL_BLANK_STYLE,
  REGION_LOCKED_BEARING,
  REGION_LOCKED_PITCH,
  REGION_MAP_CAPTION,
} from '@/lib/basemap/maplibreConfig';
import {
  addBuildingDamageLayer,
  addModsimOverlaySources,
  applyLockedRegionCamera,
  applyNcrCameraLimits,
  emphasizeLgu,
  findVectorSourceWithBuilding,
  freezeMapZoom,
  hideBaseBuildingLayers,
  holdViewInsideWindow,
  lguFocusZoomFromBoundsFit,
  releaseMapZoom,
  styleHasBuildingLayer,
  visibleWindow,
  type VisibleWindow,
} from '@/lib/basemap/regionMapLayers';
import { paddedNcrBoundsLonLat, type LngLatBoundsPair } from '@/lib/map/ncrCamera';
import { getScenarioById } from '@/lib/payload/load';
import { useExplorerStore } from '@/lib/store/explorer-store';
import { utm51nForward } from '@/lib/terrain/utm51n';

setWorkerUrl('/maplibre-gl-worker');

const DAMAGE_COALESCE_MS = 200;

export type MapFrame = { kind: 'ncr' } | { kind: 'lgu'; pcode: string };

export interface LinkedMapCenter {
  lng: number;
  lat: number;
  nonce: number;
}

export function ScenarioOsmMap({
  scenarioId,
  frame,
  resetNonce = 0,
  className = '',
  testId = 'scenario-osm-map',
  ariaLabel = 'Scenario map',
  nav = 'region',
  showCaption = true,
  layout = 'region',
  highlightCellIds = null,
  highlightKey = '',
  onResetView,
  linkedCenter = null,
  onUserPan,
}: {
  /** Scenario id resolved from the shared payload. The map reads that scenario from the store. */
  scenarioId: string;
  frame: MapFrame;
  resetNonce?: number;
  className?: string;
  testId?: string;
  ariaLabel?: string;
  nav?: 'region' | 'city' | 'compare';
  showCaption?: boolean;
  layout?: 'region' | 'compare';
  highlightCellIds?: Set<number> | null;
  highlightKey?: string;
  onResetView?: () => void;
  linkedCenter?: LinkedMapCenter | null;
  onUserPan?: (center: { lng: number; lat: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<string | null>(null);
  const cellIndexRef = useRef<ReturnType<typeof buildCellIndex> | null>(null);
  const boundsRef = useRef<LngLatBoundsPair | null>(null);
  const viewLimitRef = useRef<VisibleWindow | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paintFrameRef = useRef(0);
  const stampTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stampUiRef = useRef(0);
  const latestStampRef = useRef('');
  const loadSettledRef = useRef(false);
  const fittedTokenRef = useRef<string | null>(null);
  const fittingRef = useRef(false);
  const applyingPanRef = useRef(false);
  const userDragRef = useRef(false);
  const cacheRef = useRef(emptyGridPaintCache());
  const frameRef = useRef(frame);
  const resetNonceRef = useRef(resetNonce);
  const highlightRef = useRef(highlightCellIds);
  const onUserPanRef = useRef(onUserPan);
  const requestFitRef = useRef<() => void>(() => {});
  const paintRef = useRef<() => void>(() => {});
  const styleFailedRef = useRef(false);
  const vectorBasemapRef = useRef(true);
  const linkedNonceRef = useRef(0);
  const fitGenerationRef = useRef(0);

  const payload = useExplorerStore((s) => s.payload);
  const time = useExplorerStore((s) => s.time);
  const playing = useExplorerStore((s) => s.playing);
  const setSelectedCell = useExplorerStore((s) => s.setSelectedCell);
  const stateAt = useExplorerStore((s) => s.stateAt);

  const scenario = payload ? getScenarioById(payload, scenarioId) : undefined;

  const timeRef = useRef(time);
  const scenarioRef = useRef(scenario);
  const stateAtRef = useRef(stateAt);
  const payloadRef = useRef(payload);
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'local'>('loading');
  const [localNotice, setLocalNotice] = useState(false);
  const [viewZoom, setViewZoom] = useState<number | null>(null);
  const [fillStamp, setFillStamp] = useState('');

  const frameKey = frame.kind === 'lgu' ? frame.pcode : 'ncr';

  const publishZoom = () => {
    const map = mapRef.current;
    if (!map) return;
    const zoom = map.getZoom();
    setViewZoom(zoom);
    rootRef.current?.setAttribute('data-region-zoom', zoom.toFixed(2));
    rootRef.current?.setAttribute('data-map-zoom', zoom.toFixed(2));
  };

  const publishStamp = (stamp: string, immediate = false) => {
    latestStampRef.current = stamp;
    const flush = () => {
      stampUiRef.current = performance.now();
      setFillStamp(latestStampRef.current);
    };
    if (immediate || performance.now() - stampUiRef.current > 180) {
      if (stampTimerRef.current) {
        clearTimeout(stampTimerRef.current);
        stampTimerRef.current = null;
      }
      flush();
      return;
    }
    if (stampTimerRef.current) return;
    stampTimerRef.current = setTimeout(() => {
      stampTimerRef.current = null;
      flush();
    }, 200);
  };

  const queuePaint = () => {
    if (paintFrameRef.current) return;
    paintFrameRef.current = requestAnimationFrame(() => {
      paintFrameRef.current = 0;
      paintRef.current();
    });
  };

  const applyDamageToBuildings = () => {
    const map = mapRef.current;
    const sc = scenarioRef.current;
    const pl = payloadRef.current;
    if (!map || !pl || !sc || !cellIndexRef.current || !vectorBasemapRef.current) return;
    if (!map.getLayer(BUILDING_DAMAGE_LAYER_ID)) return;
    const source = vectorSourceRef.current;
    if (!source) return;
    const t = timeRef.current;
    const damage = stateAtRef.current(sc, t).damage;
    const features = map.queryRenderedFeatures({
      layers: [BUILDING_DAMAGE_LAYER_ID],
    }) as MapGeoJSONFeature[];
    for (const feature of features) {
      const stateId = feature.id;
      if (stateId === undefined) continue;
      const center = featureCentroidLonLat(feature.geometry);
      if (!center) continue;
      const [east, north] = utm51nForward(center[0], center[1]);
      const { hex } = damageHexAtUtm(
        sc,
        pl.grid,
        cellIndexRef.current,
        damage,
        t,
        east,
        north,
      );
      map.setFeatureState({ source, sourceLayer: 'building', id: stateId }, { damage: hex });
    }
  };

  const queueDamageRefresh = (immediate = false) => {
    if (immediate) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      applyDamageToBuildings();
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      applyDamageToBuildings();
    }, DAMAGE_COALESCE_MS);
  };

  useEffect(() => {
    timeRef.current = time;
    scenarioRef.current = scenario;
    stateAtRef.current = stateAt;
    payloadRef.current = payload;
    frameRef.current = frame;
    resetNonceRef.current = resetNonce;
    highlightRef.current = highlightCellIds;
    onUserPanRef.current = onUserPan;
    paintRef.current = () => {
      const map = mapRef.current;
      const sc = scenarioRef.current;
      const pl = payloadRef.current;
      if (!map || !pl || !sc || !map.getSource('modsim-grid-fill')) return;
      const damage = stateAtRef.current(sc, timeRef.current).damage;
      const painted = paintGridCells(
        map,
        pl.grid,
        sc,
        damage,
        timeRef.current,
        cacheRef.current,
        highlightRef.current,
      );
      publishStamp(`${painted.arrived}:${painted.checksum >>> 0}`);
    };
    requestFitRef.current = () => {
    const map = mapRef.current;
    const pl = payloadRef.current;
    const ncr = boundsRef.current;
    if (!map || !pl || !ncr || !loadSettledRef.current) return;
    const current = frameRef.current;
    const token = `${current.kind === 'lgu' ? current.pcode : 'ncr'}#${resetNonceRef.current}`;
    if (fittedTokenRef.current === token) return;
    const first = fittedTokenRef.current == null;
    fittedTokenRef.current = token;
    const lgu =
      current.kind === 'lgu' ? lguBoundsLonLat(pl.overlays, current.pcode) : null;
    const bounds = lgu ?? ncr;
    rootRef.current?.setAttribute('data-fit-bounds', lgu ? 'lgu' : 'ncr');
    const duration = first ? 0 : 450;
    const generation = ++fitGenerationRef.current;
    releaseMapZoom(map);
    if (lgu) map.setMaxBounds(null);
    fittingRef.current = true;
    map.resize();
    const camera = map.cameraForBounds(bounds, {
      padding: layout === 'compare' ? 24 : 48,
      pitch: REGION_LOCKED_PITCH,
      bearing: REGION_LOCKED_BEARING,
    });
    if (camera?.zoom != null && camera.center) {
      // At 62° the raw bounds fit still shows most of the region. Step in so the
      // selected LGU fills the foreground and vector buildings can load.
      const zoom = lgu ? lguFocusZoomFromBoundsFit(camera.zoom) : camera.zoom;
      rootRef.current?.setAttribute('data-target-zoom', zoom.toFixed(2));
      const target = {
        ...camera,
        zoom,
        pitch: REGION_LOCKED_PITCH,
        bearing: REGION_LOCKED_BEARING,
      };
      if (duration <= 0) map.jumpTo(target);
      else map.easeTo({ ...target, duration });
    } else {
      map.fitBounds(bounds, {
        padding: layout === 'compare' ? 24 : 48,
        pitch: REGION_LOCKED_PITCH,
        bearing: REGION_LOCKED_BEARING,
        duration,
      });
    }
    map.setMaxBounds(ncr);
    let settled = false;
    const finish = () => {
      if (generation !== fitGenerationRef.current || settled) return;
      settled = true;
      map.resize();
      freezeMapZoom(map);
      applyLockedRegionCamera(map);
      emphasizeLgu(map, current.kind === 'lgu' ? current.pcode : null);
      viewLimitRef.current = visibleWindow(map);
      fittingRef.current = false;
      publishZoom();
      queueDamageRefresh(true);
      queuePaint();
    };
    map.once('moveend', finish);
    if (duration <= 0) finish();
    };
  });

  useEffect(() => {
    requestFitRef.current();
  }, [frameKey, resetNonce]);

  useEffect(() => {
    const pl = payload;
    const sc = scenario;
    if (!containerRef.current || !pl || !sc) return;

    styleFailedRef.current = false;
    loadSettledRef.current = false;
    fittedTokenRef.current = null;
    cacheRef.current = emptyGridPaintCache();
    setLocalNotice(false);
    cellIndexRef.current = buildCellIndex(pl.grid);
    const bounds = paddedNcrBoundsLonLat(pl.overlays) ?? gridBoundsLonLat(pl.grid);
    boundsRef.current = bounds;
    vectorBasemapRef.current = true;

    const map = new Map({
      container: containerRef.current,
      style: OPENFREEMAP_LIBERTY_STYLE,
      center: bounds[0],
      zoom: 10,
      pitch: REGION_LOCKED_PITCH,
      bearing: REGION_LOCKED_BEARING,
      maxBounds: bounds,
      renderWorldCopies: false,
      attributionControl: false,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    });
    applyLockedRegionCamera(map);
    applyNcrCameraLimits(map, bounds);
    mapRef.current = map;

    const switchToLocalBasemap = () => {
      if (loadSettledRef.current) return;
      styleFailedRef.current = true;
      vectorBasemapRef.current = false;
      vectorSourceRef.current = null;
      setLocalNotice(true);
      map.setStyle(REGION_LOCAL_BLANK_STYLE);
      map.once('style.load', () => {
        finishSetup(false);
      });
    };

    const finishSetup = (withBuildings: boolean) => {
      addModsimOverlaySources(map, pl.overlays, sc, pl.grid, timeRef.current);
      applyNcrCameraLimits(map, bounds);
      if (withBuildings && vectorSourceRef.current) {
        hideBaseBuildingLayers(map);
        addBuildingDamageLayer(map, vectorSourceRef.current);
      }
      raiseScenarioLines(map);
      loadSettledRef.current = true;
      setMapStatus(withBuildings ? 'ready' : 'local');
      requestFitRef.current();
      queuePaint();
    };

    const setupFromStyle = () => {
      if (loadSettledRef.current || styleFailedRef.current) return;
      const vectorId = findVectorSourceWithBuilding(map);
      const hasBuilding = styleHasBuildingLayer(map, vectorId);
      if (!vectorId || !hasBuilding) {
        switchToLocalBasemap();
        return;
      }
      vectorSourceRef.current = vectorId;
      finishSetup(true);
    };

    map.on('error', () => {
      if (loadSettledRef.current || styleFailedRef.current) return;
      if (!map.isStyleLoaded()) switchToLocalBasemap();
    });
    map.on('load', () => {
      if (styleFailedRef.current) return;
      setupFromStyle();
    });

    let holding = false;
    map.on('move', () => {
      if (holding || fittingRef.current || applyingPanRef.current) return;
      const limit = viewLimitRef.current;
      if (!limit) return;
      holding = true;
      holdViewInsideWindow(map, limit);
      holding = false;
    });

    map.on('dragstart', () => {
      userDragRef.current = true;
    });
    map.on('moveend', () => {
      const fitting = fittingRef.current;
      if (!fitting) publishZoom();
      if (userDragRef.current && !fitting && !applyingPanRef.current) {
        const center = map.getCenter();
        onUserPanRef.current?.({ lng: center.lng, lat: center.lat });
      }
      userDragRef.current = false;
      if (!fitting && vectorBasemapRef.current && map.isStyleLoaded()) {
        hideBaseBuildingLayers(map);
        queueDamageRefresh(true);
      }
    });
    let baseBuildingsHidden = false;
    map.on('idle', () => {
      if (baseBuildingsHidden || !vectorBasemapRef.current || !map.isStyleLoaded()) return;
      hideBaseBuildingLayers(map);
      baseBuildingsHidden = true;
    });
    map.on('click', (event) => {
      const current = scenarioRef.current;
      const currentPayload = payloadRef.current;
      const index = cellIndexRef.current;
      if (!current || !currentPayload || !index) return;
      const [east, north] = utm51nForward(event.lngLat.lng, event.lngLat.lat);
      const gridIndex = gridIndexAtUtm(currentPayload.grid, index, east, north);
      if (gridIndex === null) return;
      const picked = scenarioIndexForGridIndex(current, currentPayload.grid, gridIndex);
      if (picked === null) return;
      setSelectedCell({ scenarioId: current.id, cellIndex: picked });
    });
    let fittingResize = false;
    map.on('resize', () => {
      if (!loadSettledRef.current || fittingRef.current || fittingResize) return;
      fittingResize = true;
      fittedTokenRef.current = null;
      requestFitRef.current();
      fittingResize = false;
    });

    map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

    const fallback = window.setTimeout(() => {
      if (!loadSettledRef.current && !styleFailedRef.current) switchToLocalBasemap();
    }, 12_000);

    return () => {
      window.clearTimeout(fallback);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (paintFrameRef.current) cancelAnimationFrame(paintFrameRef.current);
      paintFrameRef.current = 0;
      loadSettledRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // Recreate the WebGL map only when the saved scenario identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, scenario?.id]);

  const queueDamageRef = useRef(queueDamageRefresh);
  useEffect(() => {
    queueDamageRef.current = queueDamageRefresh;
  });
  useEffect(() => {
    queuePaint();
    queueDamageRef.current(false);
  }, [time, scenario?.id, highlightKey]);

  useEffect(() => {
    const map = mapRef.current;
    const sc = scenario;
    if (!map || !sc || !map.isStyleLoaded()) return;
    const source = map.getSource('modsim-epicenter') as GeoJSONSource | undefined;
    source?.setData(epicenterGeoJson(sc));
    queuePaint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario?.id]);

  useEffect(() => {
    if (!linkedCenter || linkedCenter.nonce === linkedNonceRef.current) return;
    linkedNonceRef.current = linkedCenter.nonce;
    const map = mapRef.current;
    if (!map || !loadSettledRef.current || fittingRef.current) return;
    const center = map.getCenter();
    if (
      Math.abs(center.lng - linkedCenter.lng) < 1e-6 &&
      Math.abs(center.lat - linkedCenter.lat) < 1e-6
    ) {
      return;
    }
    applyingPanRef.current = true;
    map.jumpTo({
      center: [linkedCenter.lng, linkedCenter.lat],
      pitch: REGION_LOCKED_PITCH,
      bearing: REGION_LOCKED_BEARING,
    });
    if (viewLimitRef.current) holdViewInsideWindow(map, viewLimitRef.current);
    applyingPanRef.current = false;
    publishZoom();
  }, [linkedCenter]);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    if (!playing) {
      host.style.transform = '';
      return;
    }
    let frame = 0;
    const tick = () => {
      const t = timeRef.current;
      const horizon = payloadRef.current?.horizon_s || 1;
      const progress = Math.min(1, Math.max(0, t / horizon));
      const amp = Math.sqrt(progress) * 22;
      const x = Math.sin(t * 23.1) * amp + Math.sin(t * 51.7) * amp * 0.45;
      const y = Math.cos(t * 19.4) * amp * 0.8 + Math.sin(t * 41.2) * amp * 0.25;
      const rot = Math.sin(t * 17.6) * progress * 0.5;
      host.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rot.toFixed(3)}deg)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      host.style.transform = '';
    };
  }, [playing]);

  if (!payload || !scenario) {
    return (
      <div className={`explorer-map-stage ${className}`} aria-busy="true">
        <div className="flex h-full items-center justify-center text-sm text-[var(--shell-muted)]">
          Loading map…
        </div>
      </div>
    );
  }

  const statusAttr = mapStatus === 'ready' ? 'ready' : mapStatus === 'local' ? 'local' : 'loading';
  const stageClass =
    layout === 'compare'
      ? 'explorer-map-stage explorer-map-stage--compare overflow-hidden !h-[42vh] !min-h-[300px]'
      : 'explorer-map-stage explorer-map-stage--region-fill overflow-hidden !h-[62vh] !min-h-[420px]';

  return (
    <div
      ref={rootRef}
      className={`${stageClass} ${className}`}
      data-testid={testId}
      data-scenario-id={scenario.id}
      data-map-status={statusAttr}
      data-region-map-status={statusAttr}
      data-map-zoom={viewZoom === null ? undefined : viewZoom.toFixed(2)}
      data-region-zoom={viewZoom === null ? undefined : viewZoom.toFixed(2)}
      data-map-frame={frameKey}
      data-zoom-locked="true"
      data-fill-stamp={fillStamp || undefined}
      data-arrived-cells={fillStamp ? fillStamp.split(':')[0] : undefined}
    >
      <p className="sr-only" role="note">
        {REGION_MAP_CAPTION} {OPENFREEMAP_ATTRIBUTION}
      </p>
      {localNotice ? (
        <p className="explorer-map-local-notice" role="status" data-testid="region-map-local-notice">
          OpenStreetMap vector context unavailable. Saved scenario totals and playback still use
          stored grid data; a missing map is not missing damage.
        </p>
      ) : null}
      {showCaption ? (
        <div className="explorer-region-map-notes">
          <p className="explorer-region-map-caption" data-testid="region-map-caption">
            {REGION_MAP_CAPTION}
          </p>
        </div>
      ) : null}
      <LockedMapChrome mode={nav} onResetView={onResetView} />
      <div
        ref={containerRef}
        className="explorer-maplibre-host absolute inset-0"
        aria-label={ariaLabel}
      />
    </div>
  );
}
