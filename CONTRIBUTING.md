# Contributing

## Build and test

Node 20 or newer.

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

All four must pass; CI runs them on every pull request, followed by `npm run smoke` (installs the tree into a scratch app; needs the network). `npm test` includes `check:personal`, which refuses a home-directory path, a host name or a full public key in any tracked file. Tests never use the network: use a fake `fetch` and the saved copy of Audible's answer in `tests/fixtures/`.

## Rebuilding the Word of Promise data

`npm run audible:build` reads Audible's public catalogue and rewrites `src/word-of-promise.json`. It needs the network and fails on a chapter title it cannot map to a book and chapter; add the case to `src/word-of-promise.ts` with a test. If the catalogue changed, refresh `tests/fixtures/B003UC45I8.chapter_info.json` from the same URL in the same commit.

## Proposing a change

Open an issue or a pull request. Keep a change to one thing, write the test first, add a line to `CHANGELOG.md`, and describe what you ran. The library stays about Audible only: no UI, no DOM.
