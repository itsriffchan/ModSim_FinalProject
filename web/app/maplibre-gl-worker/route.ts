import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workerPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs',
);

export async function GET() {
  const body = await readFile(workerPath);
  return new Response(body, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
