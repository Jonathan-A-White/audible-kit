import { describe, expect, it } from 'vitest';
import { audibleLink } from '../src/index.js';

describe('audibleLink', () => {
  it('pins the Luke 15 link that opened the app at the chapter on his phone', () => {
    expect(
      audibleLink({
        asin: 'B003UC45I8',
        positionMs: 300423039,
        now: 1792123456789,
        contentDeliveryType: 'MultiPartBook',
      }),
    ).toBe(
      'https://audible.smart.link/aexglzp2n?annotation_time_utc=1792123456789&asin=B003UC45I8&autoplay=true' +
        '&content_delivery_type=MultiPartBook&device_id=device_id&marketplace_domain=.com' +
        '&position_from_start=300423039&site_id=1&source_code=Deep-link_Banner',
    );
  });

  it('omits the position and the tap time when no position is given', () => {
    const link = audibleLink({ asin: 'B0CC36V9KG', contentDeliveryType: 'SinglePartBook', now: 1792123456789 });
    expect(link).toBe(
      'https://audible.smart.link/aexglzp2n?asin=B0CC36V9KG&autoplay=true' +
        '&content_delivery_type=SinglePartBook&device_id=device_id&marketplace_domain=.com' +
        '&site_id=1&source_code=Deep-link_Banner',
    );
    expect(link).not.toContain('position_from_start');
    expect(link).not.toContain('annotation_time_utc');
  });

  it('defaults the delivery type to MultiPartBook', () => {
    expect(audibleLink({ asin: 'B003UC45I8' })).toContain('content_delivery_type=MultiPartBook');
  });

  it('stamps annotation_time_utc with the current time when now is not given', () => {
    const before = Date.now();
    const link = audibleLink({ asin: 'B003UC45I8', positionMs: 5000 });
    const after = Date.now();
    const stamp = Number(new URL(link).searchParams.get('annotation_time_utc'));
    expect(stamp).toBeGreaterThanOrEqual(before);
    expect(stamp).toBeLessThanOrEqual(after);
  });

  it('keeps a position of 0 (the very start) rather than treating it as absent', () => {
    const params = new URL(audibleLink({ asin: 'B003UC45I8', positionMs: 0, now: 1 })).searchParams;
    expect(params.get('position_from_start')).toBe('0');
    expect(params.get('annotation_time_utc')).toBe('1');
  });

  it('leaves narration_speed out of a default link (1.00 reset his 2x listening speed)', () => {
    expect(audibleLink({ asin: 'B003UC45I8', positionMs: 300423039, now: 1 })).not.toContain('narration_speed');
    expect(audibleLink({ asin: 'B003UC45I8' })).not.toContain('narration_speed');
  });

  it('sets narration_speed only when a speed is given', () => {
    const params = new URL(audibleLink({ asin: 'B003UC45I8', narrationSpeed: 1.5 })).searchParams;
    expect(params.get('narration_speed')).toBe('1.50');
  });

  it('rounds a fractional position to whole milliseconds', () => {
    const params = new URL(audibleLink({ asin: 'B003UC45I8', positionMs: 1000.6, now: 1 })).searchParams;
    expect(params.get('position_from_start')).toBe('1001');
  });

  it('refuses an ASIN that is not ten letters and digits', () => {
    expect(() => audibleLink({ asin: '' })).toThrow(/asin/i);
    expect(() => audibleLink({ asin: 'B003&x=1' })).toThrow(/asin/i);
  });

  it('refuses a negative or non-finite position', () => {
    expect(() => audibleLink({ asin: 'B003UC45I8', positionMs: -1 })).toThrow(/position/i);
    expect(() => audibleLink({ asin: 'B003UC45I8', positionMs: Number.NaN })).toThrow(/position/i);
  });
});
