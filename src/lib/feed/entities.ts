// fast-xml-parser decodes standard XML entities (amp, lt, gt, quot, apos) and
// numeric entities automatically. Feeds sometimes still leak named HTML
// entities (e.g. a double-encoded "&amp;mdash;" or a hand-rolled export) that
// survive parsing untouched. This table catches the common offenders so
// titles/descriptions don't show literal "&mdash;" to the reader.
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  copy: "©",
  reg: "®",
  trade: "™",
  deg: "°",
  eacute: "é",
  agrave: "à",
};

const ENTITY_PATTERN = /&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g;

export function decodeHtmlEntities(input: string): string {
  if (!input || !input.includes("&")) return input;
  return input.replace(ENTITY_PATTERN, (match, entity: string) => {
    if (entity[0] === "#") {
      const isHex = entity[1] === "x" || entity[1] === "X";
      const code = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (Number.isNaN(code)) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    const replacement = NAMED_ENTITIES[entity];
    return replacement ?? match;
  });
}
