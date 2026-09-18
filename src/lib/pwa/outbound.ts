/** Safe defaults for agency / portal / social links opened from the PWA. */
export const EXTERNAL_REL = "noopener noreferrer";

export function externalLinkProps(href: string): {
  href: string;
  target: "_blank";
  rel: typeof EXTERNAL_REL;
} {
  return { href, target: "_blank", rel: EXTERNAL_REL };
}
