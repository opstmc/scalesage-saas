# ScaleSage

The ScaleSage marketing site — a frontier-quality, specialist-grade SaaS site built as **"Customer Zero"**: the site is the demo, proving on ourselves what we sell to clients. AI & Automation Specialists who diagnose, build custom AI systems you own, and prove the results.

Recreated in **Next.js / React** from the confirmed Claude Design prototype (`ScaleSage.dc.html`), matching the visual design pixel-for-pixel while moving to a production stack.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + a hand-authored design-token stylesheet (`app/globals.css`)
- Typography: **General Sans** (display, via Fontshare) + **Inter** (body, via Google Fonts)
- No heavy animation libraries — one restrained hero canvas, native scroll, `IntersectionObserver` reveals
- Deploys on **Vercel** (fully static — every route prerenders)

## What's in it

All 10 sections from the brief, in one page:

1. **Hero** — dark band with a lightweight generated **Higgs-field canvas** (single 2D `requestAnimationFrame` loop, DPR-capped, pauses offscreen/hidden, static fallback for `prefers-reduced-motion`)
2. **Diagnose. Build. Prove.** — the framework
3. **What's leaking?** — revenue-leak inventory
4. **Catalyst Diagnostic** entry — into the interactive journey
5. **What ScaleSage fixes** — seven service cards
6. **Industries** — MEP-first showcase
7. **Pricing** — public tiers, scope gated by the diagnostic
8. **Proof** — founding-stage, Customer Zero
9. **Why ScaleSage isn't a normal agency** — the dark contrast band
10. **FAQ + Sage + final CTA**

Two interactive moments:

- **The Catalyst Journey** — a full-screen Sage takeover: 7 branching questions (tap / type / slide), a live "what we just learned about you" capture, a computed snapshot, and smart tier routing (Local £150 / Business £750 / Enterprise → human). Scripted and fully deterministic — no live model calls — built as drop-in scaffolding so a live LLM can replace `lib/journey.ts`'s `sageReply` later without a rebuild.
- **The Sage FAQ widget** — a compact scoped chat with the same scripted brain and suggestion chips.

Plus: a transparent→solid sticky nav (sentinel-driven), a GDPR cookie banner, and AEO baked in (JSON-LD `Organization` / `Service` / `FAQPage`, `llms.txt`, `robots.txt`, `sitemap.xml`, semantic HTML).

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

## Project structure

```
app/
  layout.tsx        root layout, metadata, JSON-LD, fonts, providers
  page.tsx          section composition
  globals.css       design tokens, fonts, base + component classes
  sitemap.ts
components/          one file per section + the interactive client pieces
  Hero.tsx, HeroField.tsx (canvas), Nav.tsx, CatalystJourney.tsx,
  SageWidget.tsx, CookieBanner.tsx, JourneyProvider.tsx, ScrollReveal.tsx, …
lib/
  journey.ts        Sage logic: steps, tier routing, snapshot, scripted replies
public/
  llms.txt, robots.txt
```

## Deploy to Vercel

1. Import this repository in Vercel (it auto-detects Next.js — no config needed).
2. Set the production domain, then update `SITE_URL` in `app/layout.tsx`, `public/robots.txt`, and `app/sitemap.ts` to match.

## Notes / next steps

- Service and legal links are stubs (`#`) — wire detail pages and the Privacy/Cookies/Terms content before collecting any data.
- Sage is deterministic by design; swap in a live model (Claude primary) behind a rate-limited server route when ready.
- Light mode only for v1; a polished dark mode can follow.
