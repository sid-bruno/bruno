#!/usr/bin/env node
/**
 * Benchmark user script compile cache in runScriptInNodeVm.
 *
 *   node scripts/vm-script-compile-cache-bench.js
 *   node scripts/vm-script-compile-cache-bench.js --iterations 100
 *
 * Scenario A: identical merged script → compile cache hits after first run.
 * Scenario B: unique script body each run → no compile cache hits.
 *
 * Disable cache: BRUNO_DISABLE_SCRIPT_COMPILE_CACHE=1 node scripts/...
 */
const fs = require('fs');
const path = require('path');
const { performance } = require('node:perf_hooks');
const { runScriptInNodeVm } = require('../packages/bruno-js/src/sandbox/node-vm/index.js');
const {
  __resetScriptCompileCacheForTests,
  __getScriptCompileCacheSizeForTests
} = require('../packages/bruno-js/src/sandbox/node-vm/script-compile-cache.js');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tmp', 'vm-script-compile-cache-bench');

const argValue = (flag, fallback) => {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx === process.argv.length - 1) return fallback;
  return process.argv[idx + 1];
};

const ITERATIONS = Math.max(5, Number(argValue('--iterations', '50')) || 50);

const writeFile = (filePath, contents) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
};

const setupCollection = () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  writeFile(
    path.join(OUT, 'bruno.json'),
    JSON.stringify({
      version: '1',
      name: 'vm-script-compile-cache-bench',
      type: 'collection'
    })
  );
};

const baseScript = `
const sum = Array.from({ length: 200 }, (_, i) => i).reduce((a, b) => a + b, 0);
bru.setVar('sum', sum);
`;

const minimalContext = () => ({
  bru: { setVar() {}, getVar() {} },
  console
});

async function runScenario({ label, scriptForIteration, scriptPath }) {
  __resetScriptCompileCacheForTests();
  const times = [];

  for (let i = 1; i <= ITERATIONS; i++) {
    const t0 = performance.now();
    await runScriptInNodeVm({
      script: scriptForIteration(i),
      context: minimalContext(),
      collectionPath: OUT,
      scriptingConfig: {},
      scriptPath
    });
    times.push(performance.now() - t0);
  }

  const first = times[0];
  const rest = times.slice(1);
  const restMedian = rest.length
    ? [...rest].sort((a, b) => a - b)[Math.floor(rest.length / 2)]
    : first;
  const total = times.reduce((a, b) => a + b, 0);

  return {
    label,
    iterations: ITERATIONS,
    compileCacheEntries: __getScriptCompileCacheSizeForTests(),
    firstMs: Math.round(first * 10) / 10,
    restMedianMs: Math.round(restMedian * 10) / 10,
    avgMs: Math.round((total / ITERATIONS) * 10) / 10,
    cacheDisabled: process.env.BRUNO_DISABLE_SCRIPT_COMPILE_CACHE === '1'
  };
}

async function main() {
  setupCollection();
  const scriptPath = 'req.bru';

  const identical = await runScenario({
    label: 'A identical script',
    scriptForIteration: () => baseScript,
    scriptPath
  });

  const unique = await runScenario({
    label: 'B unique script suffix per run',
    scriptForIteration: (i) => `${baseScript}\nvoid ${i};`,
    scriptPath
  });

  const report = {
    generatedAt: new Date().toISOString(),
    iterations: ITERATIONS,
    note: 'User script compile cache only; npm modules still re-eval per run in default mode.',
    runs: [identical, unique]
  };

  const reportPath = path.join(ROOT, 'tmp', 'vm-script-compile-cache-bench-report.json');
  writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(JSON.stringify(report, null, 2));
  console.log(`\nReport: ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
