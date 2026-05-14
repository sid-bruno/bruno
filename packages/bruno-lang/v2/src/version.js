const CURRENT_BRU_VERSION = 2;

class BruVersionMismatchError extends Error {
  constructor(fileVersion, maxVersion) {
    super(
      `This file requires bru lang version ${fileVersion}, but this parser only supports up to version ${maxVersion}. Please upgrade Bruno.`
    );
    this.name = 'BruVersionMismatchError';
    this.code = 'BRU_VERSION_MISMATCH';
    this.fileVersion = fileVersion;
    this.maxVersion = maxVersion;
  }
}

const checkBruVersion = (ast) => {
  const rawVersion = ast && ast.meta && ast.meta.version;
  if (rawVersion === undefined || rawVersion === null) return;
  const fileVersion = parseInt(rawVersion, 10);
  if (isNaN(fileVersion)) return;
  if (fileVersion > CURRENT_BRU_VERSION) {
    throw new BruVersionMismatchError(fileVersion, CURRENT_BRU_VERSION);
  }
};

module.exports = { CURRENT_BRU_VERSION, BruVersionMismatchError, checkBruVersion };
