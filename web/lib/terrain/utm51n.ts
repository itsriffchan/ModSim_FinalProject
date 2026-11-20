/** WGS84 UTM zone 51N (EPSG:32651), Snyder (1987) USGS PP 1395 — see src/geo_utm51n_forward.m */

const A = 6378137.0;
const F = 1 / 298.257223563;
const K0 = 0.9996;
const FE = 500000.0;
const FN = 0.0;
const LAM0 = (123.0 * Math.PI) / 180;

const E2 = F * (2 - F);
const EP2 = E2 / (1 - E2);
const E4 = E2 * E2;
const E6 = E2 * E2 * E2;

function mercatorM(phi: number): number {
  return (
    A *
    ((1 - E2 / 4 - (3 * E4) / 64 - (5 * E6) / 256) * phi -
      ((3 * E2) / 8 + (3 * E4) / 32 + (45 * E6) / 1024) * Math.sin(2 * phi) +
      ((15 * E4) / 256 + (45 * E6) / 1024) * Math.sin(4 * phi) -
      ((35 * E6) / 3072) * Math.sin(6 * phi))
  );
}

export function utm51nForward(lonDeg: number, latDeg: number): [number, number] {
  const phi = (latDeg * Math.PI) / 180;
  const lam = (lonDeg * Math.PI) / 180;
  const sinP = Math.sin(phi);
  const cosP = Math.cos(phi);
  const N = A / Math.sqrt(1 - E2 * sinP * sinP);
  const T = Math.tan(phi) ** 2;
  const C = EP2 * cosP * cosP;
  const Acoef = (lam - LAM0) * cosP;
  const M = mercatorM(phi);
  const x =
    FE +
    K0 *
      N *
      (Acoef +
        ((1 - T + C) * Acoef ** 3) / 6 +
        ((5 - 18 * T + T ** 2 + 72 * C - 58 * EP2) * Acoef ** 5) / 120);
  const y =
    FN +
    K0 *
      (M +
        N *
          Math.tan(phi) *
          (Acoef ** 2 / 2 +
            ((5 - T + 9 * C + 4 * C ** 2) * Acoef ** 4) / 24 +
            ((61 - 58 * T + T ** 2 + 600 * C - 330 * EP2) * Acoef ** 6) / 720));
  return [x, y];
}

export function utm51nInverse(east: number, north: number): [number, number] {
  let latDeg = 14.55;
  let lonDeg = 121.0;
  for (let step = 0; step < 8; step++) {
    const [fx, fy] = utm51nForward(lonDeg, latDeg);
    const err = Math.hypot(fx - east, fy - north);
    if (err < 0.01) break;

    const dLon = 1e-7;
    const dLat = 1e-7;
    const [fxLon] = utm51nForward(lonDeg + dLon, latDeg);
    const [, fyLat] = utm51nForward(lonDeg, latDeg + dLat);
    const dfxDlon = (fxLon - fx) / dLon;
    const dfyDlon =
      (utm51nForward(lonDeg + dLon, latDeg)[1] - fy) / dLon;
    const dfxDlat =
      (utm51nForward(lonDeg, latDeg + dLat)[0] - fx) / dLat;
    const dfyDlat = (fyLat - fy) / dLat;
    const det = dfxDlon * dfyDlat - dfxDlat * dfyDlon;
    if (Math.abs(det) < 1e-20) break;
    const dx = east - fx;
    const dy = north - fy;
    lonDeg += (dx * dfyDlat - dy * dfxDlat) / det;
    latDeg += (dy * dfxDlon - dx * dfyDlon) / det;
  }
  return [lonDeg, latDeg];
}