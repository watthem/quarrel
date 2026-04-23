#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const intervalMs = Number.parseInt(process.env.QUALITY_WATCH_INTERVAL_MS ?? '3000', 10);
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'docs/.vitepress', 'artifacts', '.forage', 'coverage']);
const watchedExtensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.json', '.md', '.vue', '.css']);
let previousFingerprint = '';
let running = false;

function shouldIgnore(path) {
  return [...ignoredDirs].some((dir) => path === dir || path.startsWith(`${dir}/`));
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (shouldIgnore(path)) continue;
    if (entry.isDirectory()) {
      walk(path, files);
      continue;
    }
    if ([...watchedExtensions].some((ext) => path.endsWith(ext))) {
      const stat = statSync(path);
      files.push(`${path}:${stat.mtimeMs}:${stat.size}`);
    }
  }
  return files;
}

function fingerprint() {
  return walk('.').sort().join('\n');
}

function runQuality() {
  if (running) return;
  running = true;
  const result = spawnSync('node', ['scripts/quality-check.mjs'], { stdio: 'inherit' });
  running = false;
  if (result.status !== 0) {
    console.warn(`quality-check exited with ${result.status}`);
  }
}

previousFingerprint = fingerprint();
console.log(`Watching quality inputs every ${intervalMs}ms. Press Ctrl-C to stop.`);
runQuality();

setInterval(() => {
  const nextFingerprint = fingerprint();
  if (nextFingerprint !== previousFingerprint) {
    previousFingerprint = nextFingerprint;
    runQuality();
  }
}, intervalMs);
