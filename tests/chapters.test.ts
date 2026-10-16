import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chapterStarts, fetchChapterStarts } from '../src/index.js';

const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/B003UC45I8.chapter_info.json', import.meta.url), 'utf8'),
) as unknown;

function startOf(starts: { title: string; startOffsetMs: number }[], title: string) {
  return starts.find((s) => s.title === title)?.startOffsetMs;
}

describe('chapterStarts', () => {
  it('finds Luke 14, Luke 15 and John 3 in a saved copy of The Word of Promise metadata', () => {
    const starts = chapterStarts(fixture as Parameters<typeof chapterStarts>[0]);
    expect(starts).toHaveLength(1252);
    expect(startOf(starts, 'Luke 14')).toBe(300118626);
    expect(startOf(starts, 'Luke 15')).toBe(300423039);
    expect(startOf(starts, 'John 3')).toBe(305111142);
  });

  it('returns the chapters in the order Audible lists them', () => {
    const starts = chapterStarts(fixture as Parameters<typeof chapterStarts>[0]);
    expect(starts[0]).toEqual({ title: 'Opening Credits', startOffsetMs: 0 });
    for (let i = 1; i < starts.length; i++) {
      expect(starts[i].startOffsetMs).toBeGreaterThanOrEqual(starts[i - 1].startOffsetMs);
    }
  });

  it('walks nested chapters, a parent before its children', () => {
    const nested = {
      content_metadata: {
        chapter_info: {
          chapters: [
            {
              title: 'Part One',
              start_offset_ms: 0,
              chapters: [
                { title: 'One', start_offset_ms: 0 },
                { title: 'Two', start_offset_ms: 1000, chapters: [{ title: 'Two A', start_offset_ms: 1500 }] },
              ],
            },
            { title: 'Part Two', start_offset_ms: 5000, chapters: [{ title: 'Three', start_offset_ms: 5000 }] },
          ],
        },
      },
    };
    expect(chapterStarts(nested)).toEqual([
      { title: 'Part One', startOffsetMs: 0 },
      { title: 'One', startOffsetMs: 0 },
      { title: 'Two', startOffsetMs: 1000 },
      { title: 'Two A', startOffsetMs: 1500 },
      { title: 'Part Two', startOffsetMs: 5000 },
      { title: 'Three', startOffsetMs: 5000 },
    ]);
  });

  it('refuses metadata that has no chapter list', () => {
    expect(() => chapterStarts({})).toThrow(/chapter/i);
    expect(() => chapterStarts({ content_metadata: {} })).toThrow(/chapter/i);
  });
});

describe('fetchChapterStarts', () => {
  it('reads the public metadata URL with a fake fetch and returns the chapter starts', async () => {
    const seen: string[] = [];
    const fakeFetch = async (url: string) => {
      seen.push(url);
      return { ok: true, status: 200, json: async () => fixture };
    };
    const starts = await fetchChapterStarts('B003UC45I8', fakeFetch);
    expect(seen).toEqual(['https://api.audible.com/1.0/content/B003UC45I8/metadata?response_groups=chapter_info']);
    expect(startOf(starts, 'Luke 15')).toBe(300423039);
  });

  it('throws with the status when Audible answers an error', async () => {
    const fakeFetch = async () => ({ ok: false, status: 404, json: async () => ({}) });
    await expect(fetchChapterStarts('B003UC45I8', fakeFetch)).rejects.toThrow(/404/);
  });

  it('refuses an ASIN that is not ten letters and digits before calling the network', async () => {
    let called = false;
    const fakeFetch = async () => {
      called = true;
      return { ok: true, status: 200, json: async () => fixture };
    };
    await expect(fetchChapterStarts('../x', fakeFetch)).rejects.toThrow(/asin/i);
    expect(called).toBe(false);
  });
});
