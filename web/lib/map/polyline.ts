import type { GridPayload } from '@/lib/payload/types';
import { projectXY } from '@/lib/display/projection';

type Point2D = [number, number];
type PointOrBreak = Point2D | null;
type XYFn = (x: number, y: number, z?: number) => { x: number; y: number; z: number };

export function addBrokenPolyline(
  scene: { add: (o: unknown) => void },
  THREE: typeof globalThis.THREE,
  grid: GridPayload,
  points: PointOrBreak[] | (number | null)[][],
  hex: number,
  overlay = true,
  zKm = 0.12,
): void {
  const xy: XYFn = (x, y, z = 0) => projectXY(grid, x, y, z * 1000);
  const flat: PointOrBreak[] = Array.isArray(points[0])
    ? (points as (number | null)[][]).map((pair) =>
        pair[0] === null || pair[1] === null
          ? null
          : ([pair[0], pair[1]] as Point2D),
      )
  : (points as PointOrBreak[]);

  let part: ReturnType<XYFn>[] = [];

  const flush = () => {
    if (part.length > 1) {
      const material = new THREE.LineBasicMaterial({
        color: hex,
        depthTest: !overlay,
        transparent: overlay,
        opacity: 1,
      });
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          part.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
        ),
        material,
      );
      line.renderOrder = overlay ? 5 : 0;
      scene.add(line);
    }
    part = [];
  };

  for (const pair of flat) {
    if (pair === null) flush();
    else {
      const v = xy(pair[0], pair[1], zKm);
      part.push({ x: v.x, y: v.y, z: v.z });
    }
  }
  flush();
}