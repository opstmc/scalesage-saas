import { pageMetadata } from "@/lib/seo";
import Industries from "@/components/Industries";
import FinalCta from "@/components/FinalCta";

export const generateMetadata = pageMetadata({
  path: "/industries",
  title: "Industries",
  description:
    "18 SME sectors mapped, find yours and open its full leak map: the three biggest leaks, what's really happening, and the one we'd fix first.",
});

export default function IndustriesPage() {
  return (
    <main id="top" className="subpage">
      <Industries />
      <FinalCta />
    </main>
  );
}
