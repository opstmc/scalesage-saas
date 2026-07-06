import Link from "next/link";

/**
 * Every "start the Catalyst / run the scan" CTA on the site. The scan now lives
 * at its own route (/catalyst, brief §2.2 + §12.1: "every scan CTA routes here"),
 * so this renders a Link rather than opening the old in-page modal. Kept as a
 * single component so all scan CTAs stay consistent from one place.
 */
export default function JourneyButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href="/catalyst" className={className}>
      {children}
    </Link>
  );
}
