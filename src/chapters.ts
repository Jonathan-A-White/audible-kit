import { assertAsin } from './asin.js';

/** One chapter as Audible's catalogue writes it. */
export interface AudibleChapter {
  title: string;
  start_offset_ms: number;
  chapters?: AudibleChapter[];
}

/** The part of Audible's `metadata?response_groups=chapter_info` answer this library reads. */
export interface AudibleMetadata {
  content_metadata?: {
    chapter_info?: {
      chapters?: AudibleChapter[];
    };
  };
}

export interface ChapterStart {
  /** Audible's own title for the chapter, exactly as listed. */
  title: string;
  startOffsetMs: number;
}

/** The chapters of a metadata answer, nested ones included, in listed order (a parent before its children). */
export function chapterStarts(metadata: AudibleMetadata): ChapterStart[] {
  const chapters = metadata.content_metadata?.chapter_info?.chapters;
  if (!Array.isArray(chapters)) {
    throw new Error('audible-kit: the metadata has no content_metadata.chapter_info.chapters list');
  }
  const out: ChapterStart[] = [];
  const walk = (list: AudibleChapter[]): void => {
    for (const chapter of list) {
      out.push({ title: chapter.title, startOffsetMs: chapter.start_offset_ms });
      if (Array.isArray(chapter.chapters)) walk(chapter.chapters);
    }
  };
  walk(chapters);
  return out;
}

/** The little of `fetch` this library uses, so a test (or another runtime) can stand in for it. */
export type FetchLike = (url: string) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

/** Reads a book's chapter start times from Audible's public catalogue (no login). */
export async function fetchChapterStarts(asin: string, fetchImpl?: FetchLike): Promise<ChapterStart[]> {
  assertAsin(asin);
  const doFetch = fetchImpl ?? (globalThis as { fetch?: FetchLike }).fetch;
  if (!doFetch) throw new Error('audible-kit: no fetch available; pass one as the second argument');
  const url = `https://api.audible.com/1.0/content/${asin}/metadata?response_groups=chapter_info`;
  const response = await doFetch(url);
  if (!response.ok) throw new Error(`audible-kit: Audible answered ${response.status} for ${url}`);
  return chapterStarts((await response.json()) as AudibleMetadata);
}
