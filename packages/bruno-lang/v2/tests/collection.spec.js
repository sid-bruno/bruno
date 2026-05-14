const fs = require('fs');
const path = require('path');
const collectionBruToJson = require('../src/collectionBruToJson');
const jsonToCollectionBru = require('../src/jsonToCollectionBru');
const { BruVersionMismatchError, CURRENT_BRU_VERSION } = require('../src/version');

describe('collectionBruToJson', () => {
  it('should parse the collection bru file', () => {
    const input = fs.readFileSync(path.join(__dirname, 'fixtures', 'collection.bru'), 'utf8');
    const expected = require('./fixtures/collection.json');
    const output = collectionBruToJson(input);

    expect(output).toEqual(expected);
  });
});

describe('jsonToCollectionBru', () => {
  it('should convert the collection json to bru', () => {
    const input = require('./fixtures/collection.json');
    const expected = fs.readFileSync(path.join(__dirname, 'fixtures', 'collection.bru'), 'utf8');
    const output = jsonToCollectionBru(input);

    expect(output).toEqual(expected);
  });
});

const collectionInput = (version) =>
  version !== undefined
    ? `\nmeta {\n  version: ${version}\n  name: My Collection\n}\n`
    : `\nmeta {\n  name: My Collection\n}\n`;

describe('collectionBruToJson version field', () => {
  it('parses a collection file with no version field without error', () => {
    expect(() => collectionBruToJson(collectionInput(undefined))).not.toThrow();
  });

  it('includes version in the parsed meta when present', () => {
    const output = collectionBruToJson(collectionInput(1));
    expect(output.meta.version).toBe('1');
  });

  it('throws BruVersionMismatchError when version exceeds CURRENT_BRU_VERSION', () => {
    expect(() => collectionBruToJson(collectionInput(999))).toThrow(BruVersionMismatchError);
  });

  it('BruVersionMismatchError carries the correct code and version numbers', () => {
    try {
      collectionBruToJson(collectionInput(999));
    } catch (err) {
      expect(err.code).toBe('BRU_VERSION_MISMATCH');
      expect(err.fileVersion).toBe(999);
      expect(err.maxVersion).toBe(CURRENT_BRU_VERSION);
    }
  });
});
