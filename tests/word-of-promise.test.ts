import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BIBLE_CHAPTER_COUNT,
  WORD_OF_PROMISE_ASIN,
  chapterStarts,
  wordOfPromiseChapters,
  wordOfPromiseStart,
  wordOfPromiseStarts,
} from '../src/index.js';

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/B003UC45I8.chapter_info.json', import.meta.url), 'utf8'),
) as Parameters<typeof chapterStarts>[0];

describe('The Word of Promise chapter start times', () => {
  it('is for the ASIN of the whole Bible', () => {
    expect(WORD_OF_PROMISE_ASIN).toBe('B003UC45I8');
  });

  it('has Luke 14, Luke 15 and John 3 at the times in Audible\'s catalogue', () => {
    expect(wordOfPromiseStarts['Luke 14']).toBe(300118626);
    expect(wordOfPromiseStarts['Luke 15']).toBe(300423039);
    expect(wordOfPromiseStarts['John 3']).toBe(305111142);
    expect(wordOfPromiseStart('Luke', 15)).toBe(300423039);
    expect(wordOfPromiseStart('Luke', 99)).toBeUndefined();
  });

  it('keys by the Bible\'s book name, not by Audible\'s own title', () => {
    for (const key of ['Psalms 23', 'Revelation 22', 'Obadiah 1', 'Philemon 1', '2 John 1', '3 John 1', 'Jude 1']) {
      expect(wordOfPromiseStarts, key).toHaveProperty([key]);
    }
    for (const key of ['Psalm 23', 'Revelations 22', 'The Book of Obadiah', 'The Epistle of Jude']) {
      expect(wordOfPromiseStarts, key).not.toHaveProperty([key]);
    }
    expect(wordOfPromiseStart('Psalms', 23)).toBe(wordOfPromiseStarts['Psalms 23']);
  });

  it('has a start for all 1,189 chapters of the Bible', () => {
    expect(BIBLE_CHAPTER_COUNT).toBe(1189);
    expect(Object.keys(wordOfPromiseStarts)).toHaveLength(1189);
  });

  it('holds every chapter the catalogue lists, at its start time', () => {
    const rebuilt = wordOfPromiseChapters(chapterStarts(fixture));
    expect(wordOfPromiseStarts).toEqual(rebuilt);
  });

  it('puts the chapters in canonical order with rising start times', () => {
    const times = Object.values(wordOfPromiseStarts);
    for (let i = 1; i < times.length; i++) expect(times[i]).toBeGreaterThan(times[i - 1]);
    expect(Object.keys(wordOfPromiseStarts)[0]).toBe('Genesis 1');
    expect(Object.keys(wordOfPromiseStarts).at(-1)).toBe('Revelation 22');
  });
});

describe('wordOfPromiseChapters', () => {
  const ok = [
    { title: 'Opening Credits', startOffsetMs: 0 },
    { title: 'The Book of Obadiah', startOffsetMs: 10 },
    { title: 'Psalm 23', startOffsetMs: 20 },
    { title: 'Deuteronomy  26', startOffsetMs: 30 },
    { title: 'Revelations 22', startOffsetMs: 40 },
    { title: 'End Credits', startOffsetMs: 50 },
  ];

  it('maps every Audible title to its book and chapter', () => {
    expect(wordOfPromiseChapters(ok, { complete: false })).toEqual({
      'Obadiah 1': 10,
      'Psalms 23': 20,
      'Deuteronomy 26': 30,
      'Revelation 22': 40,
    });
  });

  it('fails on a title it cannot map', () => {
    expect(() => wordOfPromiseChapters([...ok, { title: 'Bonus Interview', startOffsetMs: 60 }], { complete: false }))
      .toThrow(/Bonus Interview/);
    expect(() => wordOfPromiseChapters([{ title: 'Luke 99', startOffsetMs: 1 }], { complete: false })).toThrow(/Luke 99/);
  });

  it('names the chapters the catalogue lacks when asked for the whole Bible', () => {
    expect(() => wordOfPromiseChapters(ok)).toThrow(/Genesis 1/);
  });

  it('refuses a chapter listed twice', () => {
    expect(() =>
      wordOfPromiseChapters(
        [
          { title: 'Luke 1', startOffsetMs: 1 },
          { title: 'Luke 1', startOffsetMs: 2 },
        ],
        { complete: false },
      ),
    ).toThrow(/Luke 1/);
  });
});
