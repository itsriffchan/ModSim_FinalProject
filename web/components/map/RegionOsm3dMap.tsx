'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AttributionControl,
  GeoJSONSource,
  Map,
  setWorkerUrl,
  type MapGeoJSONFeature,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  buildCellIndex,
  damageHexAtUtm,
  featureCentroidLonLat,
  gridIndexAtUtm,
  scenarioIndexForGridIndex,
} from '@/lib/basemap/buildingDamage';
import { epicenterGeoJson, gridBoundsLonLat } from '@/lib/basemap/geojsonOverlays';
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
  findVectorSourceWithBuilding,
  fitRegionView,
  hideBaseExtrusions,
  styleHasBuildingLayer,
  updateGridOutlines,
} from '@/lib/basemap/regionMapLayers';
import { LockedMapChrome } from '@/components/map/LockedMapChrome';
import { gridCenterM } from '@/lib/display/projection';
import { getScenarioById, normalizeScenarios } from '@/lib/payload/load';
import { utm51nForward } from '@/lib/terrain/utm51n';
import { useExplorerStore } from '@/lib/store/explorer-store';

setWorkerUrl('/maplibre-gl-worker');

const DAMAGE_COALESCE_MS = 200;

export function RegionOsm3dMap({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<string | null>(null);
  const cellIndexRef = useRef<ReturnType<typeof buildCellIndex> | null>(null);
  const boundsRef = useRef<[[number, number], [number, number]] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeRef = useRef(0);
  const scenarioRef = useRef<ReturnType<typeof getScenarioById>>(undefined);
  const stateAtRef = useRef(useExplorerStore.getState().stateAt);
  const styleFailedRef = useRef(false);
  const vectorBasemapRef = useRef(true);

  const payload = useExplorerStore((s) => s.payload);
  const scenarioId = useExplorerStore((s) => s.scenarioId);
  const time = useExplorerStore((s) => s.time);
  const setSelectedCell = useExplorerStore((s) => s.setSelectedCell);
  const stateAt = useExplorerStore((s) => s.stateAt);

  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'local'>('loading');
  const [localNotice, setLocalNotice] = useState(false);

  const scenarios = payload ? normalizeScenarios(payload) : [];
  const scenario =
    payload && scenarioId !== 'all'
      ? getScenarioById(payload, scenarioId) ?? scenarios[0]
      : payload
        ? getScenarioById(payload, 'A') ?? scenarios[0]
        : undefined;

  timeRef.current = time;
  scenarioRef.current = scenario;
  stateAtRef.current = stateAt;

  const applyDamageToBuildings = () => {
    const map = mapRef.current;
    const sc = scenarioRef.current;
    const pl = payload;
    if (!map || !pl || !sc || !cellIndexRef.current || !vectorBasemapRef.current) return;
    if (!map.getLayer(BUILDING_DAMAGE_LAYER_ID)) return;

    const source = vectorSourceRef.current;
    if (!source) return;

    const t = timeRef.current;
    const damage = stateAtRef.current(sc, t).damage;
    const features = map.queryRenderedFeatures({
      layers: [BUILDING_DAMAGE_LAYER_ID],
    }) as MapGeoJSONFeature[];

    for (const f of features) {
      const stateId = f.id;
      if (stateId === undefined) continue;

      const center = featureCentroidLonLat(f.geometry);
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
      map.setFeatureState(
        { source, sourceLayer: 'building', id: stateId },
        { damage: hex },
      );
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

  const resetView = useCallback(() => {
    const map = mapRef.current;
    const bounds = boundsRef.current;
    if (!map || !bounds) return;
    fitRegionView(map, bounds);
    applyLockedRegionCamera(map);
    queueDamageRefresh(true);
  }, []);

  const refreshGridOutlines = () => {
    const map = mapRef.current;
    const sc = scenarioRef.current;
    const pl = payload;
    if (!map || !pl || !sc || !map.isStyleLoaded()) return;
    updateGridOutlines(map, pl.grid, sc, timeRef.current);
  };

  const pickCellAtLngLat = (lon: number, lat: number) => {
    const sc = scenarioRef.current;
    const pl = payload;
    const index = cellIndexRef.current;
    if (!sc || !pl || !index) return;
    const [east, north] = utm51nForward(lon, lat);
    const gridIndex = gridIndexAtUtm(pl.grid, index, east, north);
    if (gridIndex === null) return;
    const scenarioIndex = scenarioIndexForGridIndex(sc, pl.grid, gridIndex);
    if (scenarioIndex === null) return;
    setSelectedCell({ scenarioId: sc.id, cellIndex: scenarioIndex });
  };

  useEffect(() => {
    if (!containerRef.current || !payload || !scenario) return;

    styleFailedRef.current = false;
    setLocalNotice(false);
    cellIndexRef.current = buildCellIndex(payload.grid);

    const [cx, cy] = gridCenterM(payload.grid);
    const bounds = gridBoundsLonLat(payload.grid);
    boundsRef.current = bounds;

    const useVector = !styleFailedRef.current;
    vectorBasemapRef.current = useVector;

    const map = new Map({
      container: containerRef.current,
      style: useVector ? OPENFREEMAP_LIBERTY_STYLE : REGION_LOCAL_BLANK_STYLE,
      center: bounds[0],
      zoom: 10,
      pitch: REGION_LOCKED_PITCH,
      bearing: REGION_LOCKED_BEARING,
      attributionControl: false,
    });

    applyLockedRegionCamera(map);
    mapRef.current = map;

    let loadSettled = false;

    const switchToLocalBasemap = () => {
      if (loadSettled) return;
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
      addModsimOverlaySources(map, payload.overlays, scenario, payload.grid, timeRef.current);
      fitRegionView(map, bounds);
      applyLockedRegionCamera(map);
      if (withBuildings && vectorSourceRef.current) {
        hideBaseExtrusions(map);
        addBuildingDamageLayer(map, vectorSourceRef.current);
        queueDamageRefresh(true);
      }
      setMapStatus(withBuildings ? 'ready' : 'local');
      loadSettled = true;
    };

    const setupFromStyle = () => {
      if (loadSettled || styleFailedRef.current) return;
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
      if (loadSettled || styleFailedRef.current) return;
      if (!map.isStyleLoaded()) {
        switchToLocalBasemap();
      }
    });

    map.on('load', () => {
      if (styleFailedRef.current) return;
      setupFromStyle();
    });

    map.on('moveend', () => {
      queueDamageRefresh(true);
    });
    map.on('idle', () => {
      queueDamageRefresh(true);
    });

    map.on('click', (e) => {
      pickCellAtLngLat(e.lngLat.lng, e.lngLat.lat);
    });

    map.addControl(new AttributionControl({ compact: true }), 'bottom-right');

    const tFallback = window.setTimeout(() => {
      if (!loadSettled && useVector && !styleFailedRef.current) {
        switchToLocalBasemap();
      }
    }, 12_000);

    return () => {
      window.clearTimeout(tFallback);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map mount once per payload + scenario id
  }, [payload, scenario?.id]);

  useEffect(() => {
    queueDamageRefresh();
    refreshGridOutlines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, scenarioId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !payload || !scenario || !map.isStyleLoaded()) return;
    const src = map.getSource('modsim-epicenter') as GeoJSONSource | undefined;
    src?.setData(epicenterGeoJson(scenario));
    refreshGridOutlines();
    queueDamageRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario?.id, payload]);

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

  return (
    <div
      className={`explorer-map-stage explorer-map-stage--region-fill ${className}`}
      data-region-map-status={statusAttr}
      data-testid="region-osm3d-map"
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
      <p className="explorer-region-map-caption" data-testid="region-map-caption">
        {REGION_MAP_CAPTION}
      </p>
      <LockedMapChrome onResetView={resetView} />
      <div ref={containerRef} className="explorer-maplibre-host" aria-label="Region 3D map" />
    </div>
  );
}