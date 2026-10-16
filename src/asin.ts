/** An Audible ASIN: ten capital letters and digits (e.g. B003UC45I8). */
export function assertAsin(asin: string): void {
  if (!/^[A-Z0-9]{10}$/.test(asin)) {
    throw new Error(`audible-kit: not an ASIN (ten capital letters and digits): ${JSON.stringify(asin)}`);
  }
}
