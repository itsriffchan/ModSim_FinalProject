#!/usr/bin/env node
/**
 * Sync presentation_payload.json into web/public/data via symlink (Unix) or junction (Windows).
 * Writes manifest.json with payload and batch scientific MAT/CSV SHA-256 fingerprints.
 */
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const runId = process.env.MODSIM_VIEWER_RUN ?? 'viewer_acceptance_20261120';
const runRoot = path.join(repoRoot, 'results', 'runs', runId);
const dataRoot = path.join(repoRoot, 'web', 'public', 'data');

const DATASETS = [
  { key: 'comparison', rel: path.join('batch', 'comparison', 'presentation_payload.json') },
  { key: 'A', rel: path.join('independent_2_A', 'A', 'presentation_payload.json') },
  { key: 'B', rel: path.join('independent_3_B', 'B', 'presentation_payload.json') },
  { key: 'C', rel: path.join('independent_1_C', 'C', 'presentation_payload.json') },
];

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function removeLink(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink() || stat.isDirectory()) {
    fs.rmSync(target, { recursive: true, force: true });
    return;
  }
  fs.unlinkSync(target);
}

function copyDatasetDir(sourcePayload, targetKeyDir) {
  const sourceDir = path.dirname(path.resolve(sourcePayload));
  const targetDir = path.resolve(targetKeyDir);
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  removeLink(targetDir);
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Missing presentation source directory: ${sourceDir}`);
  }
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

function linkDatasetDir(sourcePayload, targetKeyDir) {
  const copyMode =
    process.env.VERCEL === '1' ||
    process.env.CI === 'true' ||
    process.env.MODSIM_COPY_PAYLOADS === '1';
  if (copyMode) {
    copyDatasetDir(sourcePayload, targetKeyDir);
    return;
  }
  const sourceDir = path.dirname(path.resolve(sourcePayload));
  const targetDir = path.resolve(targetKeyDir);
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  removeLink(targetDir);
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Missing presentation source directory: ${sourceDir}`);
  }
  if (process.platform === 'win32') {
    const result = spawnSync('cmd.exe', ['/c', 'mklink', '/J', targetDir, sourceDir], {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    if (result.status !== 0) {
      throw new Error(
        `mklink /J failed for ${targetDir}: ${result.stderr || result.stdout || result.status}`,
      );
    }
  } else {
    fs.symlinkSync(sourceDir, targetDir, 'dir');
  }
}

function collectScientificHashes(batchRoot) {
  const entries = [];
  if (!fs.existsSync(batchRoot)) return entries;
  const stack = [batchRoot];
  while (stack.length) {
    const dir = stack.pop();
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.lstatSync(full);
      if (stat.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (!/\.(?:mat|csv)$/i.test(name)) continue;
      entries.push({
        path: path.relative(repoRoot, full).split(path.sep).join('/'),
        sha256: sha256File(full),
      });
    }
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return entries;
}

function main() {
  if (!fs.existsSync(runRoot)) {
    const committedPayloads = DATASETS.every(({ key }) =>
      fs.existsSync(path.join(dataRoot, key, 'presentation_payload.json')),
    );
    if (!committedPayloads) {
      throw new Error(`Run root not found: ${runRoot}`);
    }

    const payloads = {};
    for (const { key } of DATASETS) {
      const sourcePayload = path.join(dataRoot, key, 'presentation_payload.json');
      payloads[key] = {
        source: path.relative(repoRoot, sourcePayload).split(path.sep).join('/'),
        target: path
          .relative(repoRoot, sourcePayload)
          .split(path.sep)
          .join('/'),
        sha256: sha256File(sourcePayload),
      };
    }
    const manifest = {
      schema: 'modsim_viewer_data_sync',
      version: 1,
      run_id: runId,
      run_root: 'public/data (committed payload fallback)',
      synced_utc: new Date().toISOString(),
      link_mode: 'committed-copy',
      payloads,
      scientific: [],
    };
    fs.mkdirSync(dataRoot, { recursive: true });
    fs.writeFileSync(
      path.join(dataRoot, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );
    console.log('Run root unavailable; using committed web/public/data payloads');
    return;
  }

  const payloads = {};
  for (const { key, rel } of DATASETS) {
    const sourcePayload = path.join(runRoot, rel);
    const targetDir = path.join(dataRoot, key);
    linkDatasetDir(sourcePayload, targetDir);
    payloads[key] = {
      source: path.relative(repoRoot, sourcePayload).split(path.sep).join('/'),
      target: path
        .relative(repoRoot, path.join(targetDir, 'presentation_payload.json'))
        .split(path.sep)
        .join('/'),
      sha256: sha256File(sourcePayload),
    };
  }

  const manifest = {
    schema: 'modsim_viewer_data_sync',
    version: 1,
    run_id: runId,
    run_root: path.relative(repoRoot, runRoot).split(path.sep).join('/'),
    synced_utc: new Date().toISOString(),
    link_mode:
      process.env.VERCEL === '1' || process.env.CI === 'true' || process.env.MODSIM_COPY_PAYLOADS === '1'
        ? 'copy'
        : process.platform === 'win32'
          ? 'junction'
          : 'symlink',
    payloads,
    scientific: collectScientificHashes(path.join(runRoot, 'batch')),
  };

  fs.mkdirSync(dataRoot, { recursive: true });
  fs.writeFileSync(
    path.join(dataRoot, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  console.log(`Synced ${DATASETS.length} payloads to ${path.relative(repoRoot, dataRoot)}`);
  console.log(`Scientific files hashed: ${manifest.scientific.length}`);
}

main();