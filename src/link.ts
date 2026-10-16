import { assertAsin } from './asin.js';

export type ContentDeliveryType = 'MultiPartBook' | 'SinglePartBook';

export interface AudibleLinkOptions {
  /** The book's Audible id, e.g. B003UC45I8. */
  asin: string;
  /** Where to open the book, in milliseconds from its start. Omit to open the book where Audible last left it. */
  positionMs?: number;
  /** The time of the tap, in epoch milliseconds. Audible needs it to be the tap's own time. Default: Date.now(). */
  now?: number;
  /** Default 'MultiPartBook'; a book that is one file is 'SinglePartBook'. */
  contentDeliveryType?: ContentDeliveryType;
  /**
   * The listening speed to set, e.g. 1.5. Leave it out to keep the listener's own speed:
   * a link that says 1.00 resets a listener who uses 2.00.
   */
  narrationSpeed?: number;
}

const BASE = 'https://audible.smart.link/aexglzp2n';

/**
 * Audible's own smart link: it opens the Audible app on the book, and at a position when one is given.
 * Parameters are in the order Audible's own web player writes them.
 */
export function audibleLink(options: AudibleLinkOptions): string {
  const { asin, positionMs, contentDeliveryType = 'MultiPartBook', narrationSpeed } = options;
  assertAsin(asin);
  const params: [string, string][] = [];
  const positioned = positionMs !== undefined;
  if (positioned) {
    if (!Number.isFinite(positionMs) || positionMs < 0) {
      throw new Error(`audible-kit: position must be a number of milliseconds, 0 or more: ${positionMs}`);
    }
    params.push(['annotation_time_utc', String(Math.round(options.now ?? Date.now()))]);
  }
  params.push(['asin', asin], ['autoplay', 'true'], ['content_delivery_type', contentDeliveryType]);
  params.push(['device_id', 'device_id'], ['marketplace_domain', '.com']);
  if (narrationSpeed !== undefined) {
    if (!Number.isFinite(narrationSpeed) || narrationSpeed <= 0) {
      throw new Error(`audible-kit: narration speed must be a positive number: ${narrationSpeed}`);
    }
    params.push(['narration_speed', narrationSpeed.toFixed(2)]);
  }
  if (positioned) params.push(['position_from_start', String(Math.round(positionMs))]);
  params.push(['site_id', '1'], ['source_code', 'Deep-link_Banner']);
  return `${BASE}?${params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
}
