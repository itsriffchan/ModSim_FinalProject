/** Shared 0–10% heavy-damage palette (viewer.js colorStops). */

const COLOR_STOPS = [0xf7fbff, 0xc6dbef, 0x6baed6, 0x2171b5, 0x08306b] as const;

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: number): Rgb {
  return {
    r: ((hex >> 16) & 0xff) / 255,
    g: ((hex >> 8) & 0xff) / 255,
    b: (hex & 0xff) / 255,
  };
}

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/** Map displayed probability `p` (0–1) using 10% saturation like viewer.js. */
export function probabilityColor(p: number): Rgb {
  const normalized = Math.min(1, Math.max(0, p / 0.1));
  const segment = Math.min(3, Math.floor(normalized * 4));
  const localT = normalized * 4 - segment;
  const stops = COLOR_STOPS.map(hexToRgb);
  return lerpRgb(stops[segment], stops[segment + 1], localT);
}

export function probabilityColorHex(p: number): string {
  const { r, g, b } = probabilityColor(p);
  const toByte = (v: number) => Math.round(Math.min(255, Math.max(0, v * 255)));
  const hex = (v: number) => toByte(v).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export const AWAITING_CELL_RGB: Rgb = { r: 227 / 255, g: 229 / 255, b: 223 / 255 };
export const INACTIVE_CELL_HEX = 0xabb7c0;
export const ARRIVAL_EDGE_HEX = 0xd17a00;