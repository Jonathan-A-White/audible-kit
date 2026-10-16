import type { ChapterStart } from './chapters.js';
import { BIBLE_BOOKS, BIBLE_CHAPTER_COUNT } from './bible.js';
import data from './word-of-promise.json' with { type: 'json' };

/** The Word of Promise audio Bible on Audible: the whole Bible is this one title. */
export const WORD_OF_PROMISE_ASIN = 'B003UC45I8';

/** Audible's chapter titles that are not the Bible's own name for the book. */
const AUDIBLE_BOOK_NAMES: Record<string, string> = {
  Psalm: 'Psalms',
  Revelations: 'Revelation',
};

const CREDITS = new Set(['Opening Credits', 'End Credits']);

const BOOK_BY_NAME = new Map(BIBLE_BOOKS.map((book) => [book.name, book]));
const BOOK_BY_HEADING = new Map(BIBLE_BOOKS.map((book) => [book.audibleHeading, book]));

/**
 * Maps Audible's chapter list for The Word of Promise to start times keyed by the Bible's book name and
 * chapter ('Psalms 23', 'Revelation 22', 'Obadiah 1'), never by Audible's own title.
 *
 * It throws on a title it cannot map, a chapter listed twice, or a chapter number the book does not have.
 * Unless `complete: false`, it also throws, naming them, if any of the Bible's 1,189 chapters has no start.
 */
export function wordOfPromiseChapters(
  starts: readonly ChapterStart[],
  options: { complete?: boolean } = {},
): Record<string, number> {
  const found = new Map<string, number>();
  const add = (key: string, startOffsetMs: number, title: string): void => {
    if (found.has(key)) throw new Error(`audible-kit: ${key} is listed twice (at "${title}")`);
    found.set(key, startOffsetMs);
  };
  for (const { title, startOffsetMs } of starts) {
    const clean = title.replace(/\s+/g, ' ').trim();
    if (CREDITS.has(clean)) continue;
    const heading = BOOK_BY_HEADING.get(clean);
    if (heading) {
      // A book heading is only a chapter when the book has one chapter (Obadiah, Philemon, 2 John, 3 John, Jude).
      if (heading.chapters === 1) add(`${heading.name} 1`, startOffsetMs, title);
      continue;
    }
    const match = /^(.+) (\d+)$/.exec(clean);
    const book = match && BOOK_BY_NAME.get(AUDIBLE_BOOK_NAMES[match[1]] ?? match[1]);
    const chapter = match ? Number(match[2]) : 0;
    if (!book || chapter < 1 || chapter > book.chapters) {
      throw new Error(`audible-kit: cannot map Audible's chapter title ${JSON.stringify(title)} to a book and chapter`);
    }
    add(`${book.name} ${chapter}`, startOffsetMs, title);
  }
  const out: Record<string, number> = {};
  const missing: string[] = [];
  for (const book of BIBLE_BOOKS) {
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      const key = `${book.name} ${chapter}`;
      const start = found.get(key);
      if (start === undefined) missing.push(key);
      else out[key] = start;
    }
  }
  if (options.complete !== false && missing.length > 0) {
    throw new Error(`audible-kit: the catalogue lacks ${missing.length} of ${BIBLE_CHAPTER_COUNT} chapters: ${missing.join(', ')}`);
  }
  return out;
}

/** Where each chapter of The Word of Promise starts, in milliseconds, keyed 'Luke 15'. Built by `npm run audible:build`. */
export const wordOfPromiseStarts: Readonly<Record<string, number>> = data.chapters;

/** The start of a chapter in The Word of Promise, in milliseconds, or undefined when there is no such chapter. */
export function wordOfPromiseStart(book: string, chapter: number): number | undefined {
  return wordOfPromiseStarts[`${book} ${chapter}`];
}
