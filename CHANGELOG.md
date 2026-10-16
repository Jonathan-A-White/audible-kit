# Changelog

## Unreleased

- `npm test` runs `check:personal`, which refuses a home-directory path, a host name or a full public key in a tracked file.
- `npm run smoke`: a consumer smoke test that installs the tree into a scratch app and imports the entry point; CI runs it.
- README: the full-SHA install line and the npm 11 `allowScripts` note.

## 0.1.0

- `audibleLink`: Audible's app link for any book, optionally at a position; no `narration_speed` unless a speed is given.
- `chapterStarts` and `fetchChapterStarts`: chapter start times from Audible's public catalogue.
- The Word of Promise audio Bible's chapter start times, keyed by the Bible's book and chapter, built by `npm run audible:build`.
