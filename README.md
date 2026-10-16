# audible-kit

A small TypeScript library for Audible:

- **`audibleLink`**: Audible's own app link for any book (by ASIN), optionally opening at a position.
- **`chapterStarts` / `fetchChapterStarts`**: a book's chapter start times, read from Audible's public catalogue (no login).
- **The Word of Promise audio Bible's chapters**, keyed by the Bible's book and chapter (`Luke 15`), built once from that catalogue and shipped as data.

No UI and no DOM; it runs in a browser, in Node 20+ and in a test. Tests never touch the network.

## Install

From GitHub, at a pinned commit (the build runs on install):

```sh
npm install github:Jonathan-A-White/audible-kit#ac2224ca7dedccae47df7a33f7a71136e688cb2e
```

Pin a full commit SHA, never a branch; the one above is the commit the first apps use.

npm 11 warns that `audible-kit` has an install script (`prepare`, the build) not yet covered by
`allowScripts`. Allow it with `npm install-scripts approve audible-kit`, which adds an entry to your
`package.json` keyed by the install line, for example:

```json
"allowScripts": { "github:Jonathan-A-White/audible-kit#ac2224ca7dedccae47df7a33f7a71136e688cb2e": true }
```

Pinning the full SHA in the install line and in `allowScripts` installs the same code.

```ts
import { audibleLink, fetchChapterStarts, wordOfPromiseStart } from 'audible-kit';
```

## The app link

```ts
import { audibleLink } from 'audible-kit';

// Open the book where Audible last left it
audibleLink({ asin: 'B0CC36V9KG', contentDeliveryType: 'SinglePartBook' });

// Open at a position, in milliseconds from the start (Luke 15 in The Word of Promise)
audibleLink({ asin: 'B003UC45I8', positionMs: 300423039 });
// https://audible.smart.link/aexglzp2n?annotation_time_utc=<now>&asin=B003UC45I8&autoplay=true
//   &content_delivery_type=MultiPartBook&device_id=device_id&marketplace_domain=.com
//   &position_from_start=300423039&site_id=1&source_code=Deep-link_Banner
```

Options: `asin`, `positionMs`, `now`, `contentDeliveryType` and `narrationSpeed`.

- With `positionMs` the link carries `position_from_start` and `annotation_time_utc`. Audible wants the latter to be the time of the tap, so build the link when it is tapped (or pass `now`). Without `positionMs` both are left out.
- `contentDeliveryType` is `'MultiPartBook'` unless you say `'SinglePartBook'`.
- `narrationSpeed` is left out of the link unless you give one: Audible treats `narration_speed=1.00` as a command, and it resets a listener who uses 2x.
- The link needs the Audible app on the phone; without it, Audible's link sends the phone to the app's store page. It is Audible's own link shape, not a documented API, so Audible could change it.

## Chapter start times

```ts
import { chapterStarts, fetchChapterStarts } from 'audible-kit';

const starts = await fetchChapterStarts('B003UC45I8');
// [{ title: 'Opening Credits', startOffsetMs: 0 }, ..., { title: 'Luke 15', startOffsetMs: 300423039 }, ...]
```

`fetchChapterStarts(asin, fetchImpl?)` reads `https://api.audible.com/1.0/content/<asin>/metadata?response_groups=chapter_info`. Pass your own `fetchImpl` (a function taking the URL and returning `{ ok, status, json() }`) in a test. `chapterStarts(metadata)` does the reading of an answer you already have, walking nested chapters in order.

## The Word of Promise

The audio Bible is one Audible title, `B003UC45I8`. Audible titles its chapters its own way (`Psalm 23`, `Revelations 22`, `The Book of Obadiah`), so the data here is keyed by the Bible's book name and chapter instead, for all 1,189 chapters:

```ts
import { WORD_OF_PROMISE_ASIN, audibleLink, wordOfPromiseStart, wordOfPromiseStarts } from 'audible-kit';

const ms = wordOfPromiseStart('Luke', 15); // 300423039
wordOfPromiseStarts['Psalms 23']; // Audible's "Psalm 23"
wordOfPromiseStarts['Obadiah 1']; // Audible's "The Book of Obadiah"
audibleLink({ asin: WORD_OF_PROMISE_ASIN, positionMs: ms });
```

To rebuild the data from Audible's catalogue (needs the network): `npm run audible:build`. It fails on any chapter title it cannot map. `wordOfPromiseChapters(starts)` is the mapping on its own.

## Develop

```sh
npm ci
npm run lint && npm run typecheck && npm test && npm run build
```

`npm test` also runs `npm run check:personal`, which fails when a tracked file holds a home-directory path, a host name or a full public key (the repo is public).

`npm run smoke` is the consumer smoke test: it installs the working tree the way an app does (`npm install git+file://<a fresh clone>`) into a scratch folder and checks that the build ran and that `audibleLink`, `chapterStarts` and the Word of Promise data import and work. It needs the network or a warm npm cache, so CI runs it as its own step and `npm test` does not.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).

## Licence

MIT. The chapter start times are facts from Audible's public catalogue; "Audible" and "The Word of Promise" belong to their owners, and this library is not affiliated with either.
