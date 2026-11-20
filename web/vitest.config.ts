import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    testTimeout: 120_000,
  },
  resolve: {
    alias: {
      '@': rootDir,
    },
  },
});