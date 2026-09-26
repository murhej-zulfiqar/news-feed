import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "a", "p", "br", "strong", "em", "b", "i", "u", "s", "blockquote", "pre", "code",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "td", "th", "hr", "span", "div", "sup", "sub",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "width", "height"];

let hooksInstalled = false;

function installHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  // Feed content links/images should never take over the tab or leak
  // referrer data, and images should never block first paint.
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer nofollow");
    }
    if (node.tagName === "IMG") {
      node.setAttribute("loading", "lazy");
      if (!node.hasAttribute("alt")) node.setAttribute("alt", "");
    }
  });
}

/** Sanitizes feed-sourced HTML for safe rendering. Browser-only (DOMPurify
 * needs a DOM); call only from client components. */
export function sanitizeFeedHtml(html: string | null | undefined): string {
  if (!html || typeof window === "undefined") return "";
  installHooks();
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false });
}
