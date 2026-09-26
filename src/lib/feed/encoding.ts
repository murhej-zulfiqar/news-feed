function normalizeCharsetName(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (normalized === "latin1") return "iso-8859-1";
  if (normalized === "cp1252") return "windows-1252";
  if (normalized === "utf8") return "utf-8";
  return normalized;
}

function detectCharset(contentTypeHeader: string | null, bytes: Uint8Array): string {
  if (contentTypeHeader) {
    const match = contentTypeHeader.match(/charset=([^;]+)/i);
    if (match) return normalizeCharsetName(match[1]);
  }
  // Read the XML declaration as latin1 (byte-safe for ASCII-range headers)
  // to find an explicit encoding before we commit to a decoder.
  const preview = new TextDecoder("latin1").decode(bytes.slice(0, 200));
  const declMatch = preview.match(/<\?xml[^>]*encoding=["']([^"']+)["']/i);
  if (declMatch) return normalizeCharsetName(declMatch[1]);
  return "utf-8";
}

export function decodeFeedBuffer(buffer: ArrayBuffer, contentTypeHeader: string | null): string {
  const bytes = new Uint8Array(buffer);
  const charset = detectCharset(contentTypeHeader, bytes);
  try {
    return new TextDecoder(charset, { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
}
