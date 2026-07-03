// Read the partner referral code captured by middleware.ts from ?ref=CODE.
// Client-only (reads the ss_ref cookie); returns null on the server or when no
// referral is present. This is the single read-point every conversion call uses.
export function getRef(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)ss_ref=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
