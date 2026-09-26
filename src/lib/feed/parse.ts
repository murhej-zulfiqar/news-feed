import { XMLParser } from "fast-xml-parser";
import { decodeHtmlEntities } from "./entities";
import { normalizeFeedDate } from "./dates";
import { extractFirstImage, looksLikeHtml, stripHtml, truncate } from "./html";
import type { FeedFormat, ParsedFeed, ParsedFeedItem } from "@/lib/types";

export class FeedParseError extends Error {}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  cdataPropName: false,
  trimValues: true,
  processEntities: true,
  htmlEntities: true,
  isArray: (name) => name === "item" || name === "entry",
});

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function nodeText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const text = (value as Record<string, unknown>)["#text"];
    if (typeof text === "string") return text;
    if (typeof text === "number") return String(text);
  }
  return "";
}

function authorOf(node: unknown): string | null {
  if (!node) return null;
  if (typeof node === "string") return node.trim() || null;
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (obj.name != null) return nodeText(obj.name).trim() || null;
    const text = nodeText(node).trim();
    return text || null;
  }
  return null;
}

function pickAtomLink(link: unknown): string {
  const links = asArray(link as Record<string, unknown> | Record<string, unknown>[]);
  if (links.length === 0) return "";
  const alternate = links.find((l) => {
    const rel = l?.["@_rel"];
    return rel == null || rel === "alternate";
  });
  const href = (alternate ?? links[0])?.["@_href"];
  return typeof href === "string" ? href : "";
}

function extractEnclosureImage(node: Record<string, unknown>): string | null {
  for (const enclosure of asArray(node.enclosure as never)) {
    const e = enclosure as Record<string, unknown>;
    const type = e["@_type"] as string | undefined;
    const url = e["@_url"] as string | undefined;
    if (url && (!type || type.startsWith("image/"))) return url;
  }
  for (const thumb of asArray(node["media:thumbnail"] as never)) {
    const url = (thumb as Record<string, unknown>)["@_url"] as string | undefined;
    if (url) return url;
  }
  for (const media of asArray(node["media:content"] as never)) {
    const m = media as Record<string, unknown>;
    const type = m["@_type"] as string | undefined;
    const url = m["@_url"] as string | undefined;
    if (url && (!type || type.startsWith("image/"))) return url;
  }
  return null;
}

function mapRssLikeItem(item: Record<string, unknown>): ParsedFeedItem {
  const link = nodeText(item.link).trim();
  const rawGuid = nodeText(item.guid) || nodeText(item["dc:identifier"]);
  const guid = rawGuid || link || nodeText(item.title) || JSON.stringify(item).slice(0, 64);
  const title = decodeHtmlEntities(stripHtml(nodeText(item.title))) || "(untitled)";
  const author = authorOf(item["dc:creator"]) ?? authorOf(item.author);
  const dateRaw =
    nodeText(item.pubDate) || nodeText(item["dc:date"]) || nodeText(item.date) || nodeText(item.published);
  const publishedAt = normalizeFeedDate(dateRaw);

  const contentEncoded = nodeText(item["content:encoded"]);
  const description = nodeText(item.description);
  const fullHtml =
    contentEncoded && contentEncoded.trim() !== description.trim()
      ? contentEncoded
      : looksLikeHtml(description) && description.length > 600
        ? description
        : null;

  const summarySource = description || contentEncoded;
  const summary = truncate(stripHtml(summarySource), 400);
  const imageUrl = extractEnclosureImage(item) ?? extractFirstImage(fullHtml ?? description);

  return {
    guid,
    title,
    link,
    author,
    publishedAt,
    summary,
    contentHtml: fullHtml,
    imageUrl,
  };
}

function mapAtomEntry(entry: Record<string, unknown>): ParsedFeedItem {
  const link = pickAtomLink(entry.link);
  const id = nodeText(entry.id) || link;
  const title = decodeHtmlEntities(stripHtml(nodeText(entry.title))) || "(untitled)";
  const author = authorOf(entry.author);
  const dateRaw = nodeText(entry.published) || nodeText(entry.updated);
  const publishedAt = normalizeFeedDate(dateRaw);

  const contentNode = entry.content as Record<string, unknown> | string | undefined;
  const summaryNode = entry.summary as Record<string, unknown> | string | undefined;
  const contentText = nodeText(contentNode);
  const summaryText = nodeText(summaryNode);
  const contentType =
    typeof contentNode === "object" ? (contentNode?.["@_type"] as string | undefined) : undefined;
  const isHtmlContent = contentType === "html" || contentType === "xhtml" || looksLikeHtml(contentText);
  const fullHtml = contentText && isHtmlContent && contentText.length > 200 ? contentText : null;

  const summarySource = summaryText || contentText;
  const summary = truncate(stripHtml(summarySource), 400);
  const imageUrl = extractEnclosureImage(entry) ?? extractFirstImage(fullHtml ?? summaryText);

  return {
    guid: id || `${title}-${publishedAt ?? ""}`,
    title,
    link,
    author,
    publishedAt,
    summary,
    contentHtml: fullHtml,
    imageUrl,
  };
}

function tryStructuredParse(doc: Record<string, unknown>): ParsedFeed | null {
  if (doc.rss) {
    const rss = doc.rss as Record<string, unknown>;
    const channel = (rss.channel ?? {}) as Record<string, unknown>;
    const items = asArray(channel.item as never).map((i) => mapRssLikeItem(i as Record<string, unknown>));
    return {
      title: decodeHtmlEntities(stripHtml(nodeText(channel.title))) || "Untitled feed",
      siteUrl: nodeText(channel.link),
      description: decodeHtmlEntities(stripHtml(nodeText(channel.description))),
      format: "rss2",
      items,
    };
  }

  if (doc.feed) {
    const feed = doc.feed as Record<string, unknown>;
    const items = asArray(feed.entry as never).map((e) => mapAtomEntry(e as Record<string, unknown>));
    return {
      title: decodeHtmlEntities(stripHtml(nodeText(feed.title))) || "Untitled feed",
      siteUrl: pickAtomLink(feed.link),
      description: decodeHtmlEntities(stripHtml(nodeText(feed.subtitle))),
      format: "atom",
      items,
    };
  }

  const rdfKey = Object.keys(doc).find((key) => key.replace(/^.*:/, "").toLowerCase() === "rdf");
  if (rdfKey) {
    const rdf = doc[rdfKey] as Record<string, unknown>;
    const channel = (rdf.channel ?? {}) as Record<string, unknown>;
    const items = asArray(rdf.item as never).map((i) => mapRssLikeItem(i as Record<string, unknown>));
    return {
      title: decodeHtmlEntities(stripHtml(nodeText(channel.title))) || "Untitled feed",
      siteUrl: nodeText(channel.link),
      description: decodeHtmlEntities(stripHtml(nodeText(channel.description))),
      format: "rdf",
      items,
    };
  }

  return null;
}

/** Best-effort recovery for XML that fails to parse as a whole document: pull
 * out individual <item>/<entry> blocks with regex and parse each in
 * isolation, so one malformed section doesn't sink the entire feed. */
function tryPartialExtraction(xml: string): ParsedFeed | null {
  const isAtomLike = /<entry[\s>]/i.test(xml);
  const tag = isAtomLike ? "entry" : "item";
  const blockPattern = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
  const blocks = xml.match(blockPattern) ?? [];

  const items: ParsedFeedItem[] = [];
  for (const block of blocks) {
    try {
      const wrapped = parser.parse(`<root>${block}</root>`) as Record<string, unknown>;
      const root = wrapped.root as Record<string, unknown> | undefined;
      const node = root?.[tag];
      const single = Array.isArray(node) ? node[0] : node;
      if (!single) continue;
      items.push(
        isAtomLike
          ? mapAtomEntry(single as Record<string, unknown>)
          : mapRssLikeItem(single as Record<string, unknown>),
      );
    } catch {
      continue;
    }
  }

  if (items.length === 0) return null;

  const titleMatch = xml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return {
    title: titleMatch ? decodeHtmlEntities(stripHtml(titleMatch[1])) : "Recovered feed",
    siteUrl: "",
    description: "This feed's XML was malformed — recovered as many items as possible.",
    format: (isAtomLike ? "atom" : "unknown") as FeedFormat,
    items,
  };
}

export function parseFeed(xml: string): ParsedFeed {
  let doc: Record<string, unknown> | null = null;
  try {
    doc = parser.parse(xml) as Record<string, unknown>;
  } catch {
    doc = null;
  }

  const structured = doc ? tryStructuredParse(doc) : null;
  if (structured && structured.items.length > 0) return structured;

  const partial = tryPartialExtraction(xml);
  if (partial) return partial;

  // A structurally valid feed with genuinely zero items (e.g. an
  // infrequently-published blog) is not an error.
  if (structured) return structured;

  throw new FeedParseError("This feed's XML is malformed and could not be parsed.");
}
