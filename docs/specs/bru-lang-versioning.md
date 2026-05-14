# Bru Lang File Versioning

## Overview

Bru lang files (`.bru`, `collection.bru`, `folder.bru`, and environment files) have no version field today. As the format evolves, there is no way for the parser to detect that a file was written by a newer version of Bruno that introduced syntax or semantics the current parser does not understand. The result is either a cryptic parse error or, worse, silent data loss.

This spec defines a `version` field for all bru lang file types and a version-mismatch check in each parser so that users get a clear, actionable error message when they open a file that requires a newer Bruno version.

---

## File Format Changes

The `version` field is written as the **first entry** in the `meta` block so it is immediately visible when reading a file.

### Request files (`.bru`)

```bru
meta {
  version: 1
  name: Get Users
  type: http
  seq: 1
}
```

### Collection files (`collection.bru`) and folder files (`folder.bru`)

```bru
meta {
  version: 1
  name: My Collection
}
```

### Environment files

Environment files gain a `meta` block (previously they had none):

```bru
meta {
  version: 1
}

vars {
  host: https://api.example.com
}
```

---

## Versioning Rules

- The version is a **positive integer** (e.g. `1`, `2`, `3`).
- The current version is **`1`**.
- A file is forward-compatible: `version: 1` can be read by any parser that supports `>= 1`.
- A file is **not** backward-compatible: `version: 2` **cannot** be read by a parser that only supports up to `1`.
- Files with **no `version` field** are treated as version `1` — this ensures all existing files continue to work without modification.

### When to bump the version

Increment `CURRENT_BRU_VERSION` when a change to bru lang syntax or semantics means older parsers would either fail to parse a valid file or would silently misinterpret it. Additive-only changes (new optional blocks, new optional keys) do not require a bump.

---

## Parser Behavior

### Version constant and error class

A single shared module (`packages/bruno-lang/v2/src/version.js`) defines:

- **`CURRENT_BRU_VERSION`** — the maximum version this build of Bruno can parse.
- **`BruVersionMismatchError`** — a subclass of `Error` with:
  - `message`: human-readable explanation (e.g. _"This file requires bru lang version 2, but this parser only supports up to version 1. Please upgrade Bruno."_)
  - `code`: `'BRU_VERSION_MISMATCH'` — used by consumers to distinguish this from generic parse errors.
  - `fileVersion` — the version found in the file.
  - `maxVersion` — `CURRENT_BRU_VERSION`.
- **`checkBruVersion(ast)`** — reads `ast.meta.version`, does nothing if the field is absent or equal to/below `CURRENT_BRU_VERSION`, throws `BruVersionMismatchError` otherwise.

### Where the check runs

Each of the three parsers calls `checkBruVersion(ast)` immediately after a successful ohm parse, before returning the AST to the caller:

| Parser file | File type |
|---|---|
| `packages/bruno-lang/v2/src/bruToJson.js` | `.bru` request files |
| `packages/bruno-lang/v2/src/collectionBruToJson.js` | `collection.bru`, `folder.bru` |
| `packages/bruno-lang/v2/src/envToJson.js` | environment files |

The ohm grammar does not need to change for request and collection/folder files — the `dictionary` rule already accepts arbitrary key-value pairs. The env grammar gains a `meta` block (see [Env Grammar](#env-grammar)).

### Error propagation

`BruVersionMismatchError` propagates through the stack unchanged:

```
parser (bruno-lang) → parseBruRequest/parseBruCollection/parseBruEnvironment (bruno-filestore) → collection-watcher / CLI
```

No consumer needs to wrap or translate it — the `code` property allows each consumer to handle it specifically.

### Env grammar

The env parser's `BruEnvFile` rule gains a `meta` section:

```
BruEnvFile = (meta | vars | secretvars | color)*
meta        = "meta" dictionary
```

The `meta` semantic action produces `{ meta: { ... } }` which is merged into the root AST object, consistent with the pattern used by the other section types.

---

## Stringifier Behavior

When Bruno writes a bru lang file (on save, new request creation, etc.) it injects `version: CURRENT_BRU_VERSION` as the first entry in the `meta` block. This means:

- Newly created files always carry a version.
- An existing file gains a version the first time it is re-saved in a Bruno version that includes this change.

### Output example

```bru
meta {
  version: 1
  name: Get Users
  type: http
  seq: 1
}
```

Affected stringifiers:
- `packages/bruno-lang/v2/src/jsonToBru.js`
- `packages/bruno-lang/v2/src/jsonToCollectionBru.js`
- `packages/bruno-lang/v2/src/jsonToEnv.js`

The filestore transformation layer (`packages/bruno-filestore/src/formats/bru/index.ts`) is responsible for passing `CURRENT_BRU_VERSION` into the `meta` object before calling the stringifier.

---

## Migration

No migration script is required.

- **Existing files without a `version` field** parse as version `1` (current). They are treated as fully valid.
- **Silent upgrade on save**: the next time Bruno writes a file it will include `version: 1`. This is transparent to the user.

---

## Error Surfacing

### Electron app

In `packages/bruno-electron/src/app/collection-watcher.js`, the existing error object sent to the renderer is extended with the error code:

```js
file.error = {
  message: error?.message,
  code: error?.code || null   // 'BRU_VERSION_MISMATCH'
};
```

In the `RequestNotLoaded` UI component (`packages/bruno-app/src/components/RequestTabPanel/RequestNotLoaded/index.js`), a version-mismatch branch is added before the generic error display to show a targeted message such as:

> This file requires a newer version of Bruno. Please upgrade to open it.

### CLI

Version-mismatch errors are a **hard exit**, not a file skip, because a collection with unreadable files likely cannot run correctly.

A new exit code is added to `packages/bruno-cli/src/constants.js`:

```js
ERROR_UNSUPPORTED_BRU_VERSION: 14
```

In `packages/bruno-cli/src/utils/collection.js`, the existing `catch` block checks `err.code`:

```js
if (err.code === 'BRU_VERSION_MISMATCH') {
  console.error(chalk.red(`Error: ${filePath}\n${err.message}`));
  process.exit(constants.EXIT_STATUS.ERROR_UNSUPPORTED_BRU_VERSION);
}
// existing skip logic for other parse errors
```

---

## Implementation Checklist

### `packages/bruno-lang`

- [ ] **New** `v2/src/version.js` — `CURRENT_BRU_VERSION`, `BruVersionMismatchError`, `checkBruVersion`
- [ ] `v2/src/bruToJson.js` — call `checkBruVersion(ast)` after successful parse
- [ ] `v2/src/collectionBruToJson.js` — call `checkBruVersion(ast)` after successful parse
- [ ] `v2/src/envToJson.js` — add `meta` grammar rule + semantic action; call `checkBruVersion(ast)`
- [ ] `v2/src/jsonToBru.js` — write `version` first in `meta` block
- [ ] `v2/src/jsonToCollectionBru.js` — write `version` first in `meta` block
- [ ] `v2/src/jsonToEnv.js` — write `meta` block with `version` at top of output
- [ ] `src/index.js` — export `BruVersionMismatchError` and `CURRENT_BRU_VERSION`

### `packages/bruno-filestore`

- [ ] `src/formats/bru/index.ts` — import and inject `CURRENT_BRU_VERSION` into `meta` in all stringify functions; pass `bruVersion` through in all parse functions; errors propagate automatically

### `packages/bruno-electron`

- [ ] `src/app/collection-watcher.js` — add `code` to `file.error` object

### `packages/bruno-app`

- [ ] `src/components/RequestTabPanel/RequestNotLoaded/index.js` — add version-mismatch UI branch

### `packages/bruno-cli`

- [ ] `src/constants.js` — add `ERROR_UNSUPPORTED_BRU_VERSION: 14`
- [ ] `src/utils/collection.js` — hard-exit on `BRU_VERSION_MISMATCH`, skip for other errors

### Tests

- [ ] `packages/bruno-lang/v2/tests/bruToJson.spec.js` — no version field, `version: 1`, `version: 2` throws, version in AST
- [ ] `packages/bruno-lang/v2/tests/collection.spec.js` — same cases for `collectionBruToJson`
- [ ] `packages/bruno-lang/v2/tests/envToJson.spec.js` — same + meta block in env file
- [ ] `packages/bruno-lang/v2/tests/jsonToBru.spec.js` — version is first field; round-trip preserves version
- [ ] `packages/bruno-filestore` — `BruVersionMismatchError` propagates; stringify writes `version: 1`; round-trip preserves version
