const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Non-standard "YYYY-MM-DD HH:mm:ss" (space instead of T, no timezone) seen
// from a handful of RSS 1.0/RDF generators.
const SPACE_DATE = /^(\d{4})-(\d{2})-(\d{2})[ ](\d{2}):(\d{2})(:(\d{2}))?$/;

// "DD Mon YYYY HH:mm:ss" without a weekday prefix.
const NO_WEEKDAY_RFC822 = /^(\d{1,2})\s+([A-Za-z]{3})\w*\s+(\d{4})\s+(\d{1,2}):(\d{2})(:(\d{2}))?\s*([+-]\d{4}|[A-Za-z]+)?$/;

/**
 * Normalizes the wide variety of dates found in real-world feeds
 * (ISO 8601, RFC 822/2822, and a few common non-standard formats) into an
 * ISO string. Returns null when the field is missing or unparseable rather
 * than throwing, so a single bad date never breaks the rest of the item.
 */
export function normalizeFeedDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const native = Date.parse(trimmed);
  if (!Number.isNaN(native)) {
    return new Date(native).toISOString();
  }

  const spaceMatch = trimmed.match(SPACE_DATE);
  if (spaceMatch) {
    const [, y, mo, d, h, mi, , s] = spaceMatch;
    const date = new Date(
      Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0)),
    );
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  const rfcMatch = trimmed.match(NO_WEEKDAY_RFC822);
  if (rfcMatch) {
    const [, d, mon, y, h, mi, , s] = rfcMatch;
    const monthIndex = MONTHS[mon.toLowerCase()];
    if (monthIndex !== undefined) {
      const date = new Date(
        Date.UTC(Number(y), monthIndex, Number(d), Number(h), Number(mi), Number(s ?? 0)),
      );
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
  }

  return null;
}
