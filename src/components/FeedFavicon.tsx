"use client";

import { useState } from "react";
import { Rss } from "lucide-react";

/** Feed favicons come from arbitrary external hosts, so this renders a plain
 * <img> (next/image requires allowlisting hosts up front) and falls back to
 * a generic icon when the origin has none. */
export function FeedFavicon({ siteUrl, size = 16 }: { siteUrl: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  let origin: string | null = null;
  try {
    origin = siteUrl ? new URL(siteUrl).origin : null;
  } catch {
    origin = null;
  }

  if (!origin || failed) {
    return (
      <Rss
        size={size}
        aria-hidden="true"
        className="shrink-0 text-(--color-text-tertiary)"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${origin}/favicon.ico`}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-sm"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
