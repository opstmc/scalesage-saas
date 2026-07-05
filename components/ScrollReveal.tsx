"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Mirrors the prototype's setupReveal(): hide [data-reveal] elements in JS
 * (so no-JS users still see content), then fade+rise them in on scroll.
 *
 * Lives in the root layout, so it must re-scan after every client-side route
 * change — hence the `pathname` dependency: each navigation re-hides the new
 * page's [data-reveal] elements and re-observes them.
 */
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    els.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(22px)";
      el.style.transition =
        "opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)";
    });

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
        el.classList.add("is-in");
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const t = e.target as HTMLElement;
            t.style.opacity = "1";
            t.style.transform = "none";
            t.classList.add("is-in");
            io.unobserve(t);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
