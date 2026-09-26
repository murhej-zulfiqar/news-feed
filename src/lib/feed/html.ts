import { decodeHtmlEntities } from "./entities";

export function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

export function stripHtml(html: string): string {
  if (!html) return "";
  const withoutTags = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeHtmlEntities(withoutTags).replace(/\s+/g, " ").trim();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}

const IMG_SRC_PATTERN = /<img[^>]+src=["']([^"'>]+)["']/i;

export function extractFirstImage(html: string | null | undefined): string | null {
  if (!html) return null;
  const match = html.match(IMG_SRC_PATTERN);
  return match ? match[1] : null;
}
