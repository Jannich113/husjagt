const BLOCKED_HOST = /^(localhost|127\.|10\.|0\.|169\.254\.|::1|\[::1\])|(\.internal|\.local)$/i;
const PRIVATE_IPV4 =
  /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/;

export function tokenUrlAllowed(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOST.test(host) || PRIVATE_IPV4.test(host)) return false;
  if (host === "metadata.google.internal") return false;
  return true;
}
