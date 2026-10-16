// npm run audible:build: reads The Word of Promise's chapter list from Audible's public catalogue (no login)
// and writes src/word-of-promise.json, keyed by the Bible's book name and chapter.
import { writeFileSync } from 'node:fs';
import { fetchChapterStarts, WORD_OF_PROMISE_ASIN, wordOfPromiseChapters } from '../src/index.js';

const starts = await fetchChapterStarts(WORD_OF_PROMISE_ASIN);
const chapters = wordOfPromiseChapters(starts);
const out = {
  asin: WORD_OF_PROMISE_ASIN,
  source: `https://api.audible.com/1.0/content/${WORD_OF_PROMISE_ASIN}/metadata?response_groups=chapter_info`,
  chapters,
};
writeFileSync(new URL('../src/word-of-promise.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
console.log(`wrote ${Object.keys(chapters).length} chapters`);
