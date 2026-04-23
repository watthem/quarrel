#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const args = new Set(process.argv.slice(2));
const includeAnalysis = args.has('--analysis');
const fix = args.has('--fix');
const packageManager = existsSync('pnpm-lock.yaml') ? 'pnpm' : 'npm';
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

function run(label, command, commandArgs, options = {}) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, commandArgs, { stdio: 'inherit', shell: false });
  if (result.status !== 0 && options.required !== false) {
    process.exit(result.status ?? 1);
  }
  if (result.status !== 0) {
    console.warn(`Skipped non-blocking check: ${label}`);
  }
}

function hasScript(name) {
  return Object.prototype.hasOwnProperty.call(packageJson.scripts ?? {}, name);
}

function runScript(name, required = true) {
  if (hasScript(name)) {
    run(`package script: ${name}`, packageManager, ['run', name], { required });
  }
}

const biomeArgs = fix
  ? ['--yes', '@biomejs/biome@2.2.5', 'check', '--write', '.']
  : ['--yes', '@biomejs/biome@2.2.5', 'check', '.'];

run('biome lint+format', 'npx', biomeArgs);
runScript('test', false);
runScript('fieldtest:validate', false);

if (includeAnalysis) {
  run('fallow codebase analysis', 'npx', ['--yes', 'fallow', '--format', 'json']);
  run('knip production dependency graph', 'npx', ['--yes', 'knip', '--production']);
}
