/** Candidate photo URLs when the CDN object for the stored size/format is gone. */
export function listingImageFallbacks(url: string | null | undefined): string[] {
  if (!url) return [];
  const out: string[] = [];
  const add = (next: string) => {
    if (next && !out.includes(next)) out.push(next);
  };
  add(url);
  if (url.endsWith(".webp")) add(`${url.slice(0, -5)}.jpg`);
  if (url.includes("/600x400/")) {
    add(url.replace("/600x400/", "/300x200/"));
    add(url.replace("/600x400/", "/1200x800/"));
  }
  return out;
}
