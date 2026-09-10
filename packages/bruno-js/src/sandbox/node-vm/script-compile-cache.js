const crypto = require('node:crypto');
const vm = require('node:vm');

const cache = new Map();
const MAX_ENTRIES = 512;

function isCacheDisabled() {
  return process.env.BRUNO_DISABLE_SCRIPT_COMPILE_CACHE === '1';
}

function cacheKey(wrappedScript, vmFilename) {
  return crypto
    .createHash('sha256')
    .update(wrappedScript)
    .update('\0')
    .update(vmFilename)
    .digest('hex');
}

function getOrCompileUserScript(wrappedScript, vmFilename) {
  if (isCacheDisabled()) {
    return new vm.Script(wrappedScript, { filename: vmFilename });
  }

  const key = cacheKey(wrappedScript, vmFilename);
  if (cache.has(key)) {
    return cache.get(key);
  }

  const script = new vm.Script(wrappedScript, { filename: vmFilename });
  if (cache.size >= MAX_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, script);
  return script;
}

function __resetScriptCompileCacheForTests() {
  cache.clear();
}

function __getScriptCompileCacheSizeForTests() {
  return cache.size;
}

module.exports = {
  getOrCompileUserScript,
  __resetScriptCompileCacheForTests,
  __getScriptCompileCacheSizeForTests
};
