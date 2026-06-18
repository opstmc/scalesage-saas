# ScaleSage

The ScaleSage marketing site — the front door of the brand, built to the locked **Website Design Brief**: the business doctor for growing SMEs. *Your business is leaking. We find it. Fix it. Prove it.*

Next.js / React, deployed on Vercel.

## Visual signature (locked)

- **Dark navy field** (`#0A1628` → `#0E1B2D`) with flowing **teal/cyan data streams** — the river/current metaphor: we find the leak in the flow, redirect it, and prove it improved.
- **Teal accent** (`#3DD9D0` / glow `#5EEFE6`), silver/off-white text (`#F4F6F9`). No bright primaries, no rainbow gradients.
- **Frosted glass cards** with teal-edged glow on hover, consistent radius (16px cards / 12px buttons / 8px inputs / 24px hero blocks).
- Sans-serif throughout (**Inter**, 3 weights), big confident headlines with italic-teal accent words.
- Motion principle: alive but controlled. One signature element moves (the data stream); everything else is calm, with smooth scroll-reveals and subtle teal-glow hover.

Tokens live as CSS variables in `app/globals.css` — defined once, used everywhere.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + a hand-authored design-token stylesheet
- **Inter** via Google Fonts; fully static (every route prerenders) for sub-3s loads
- Deploys on **Vercel** — no config needed

## Homepage (10 sections)

1. **Hero** — leak tagline + the flowing data-stream canvas + frosted signature cards
2. **Diagnose. Build. Prove.** — the method
3. **What's leaking?** — six leak cards, stat-on-hover (confidence-tagged)
4. **The Catalyst diagnostic** — "This isn't a form. It's a scan." + animated Sage interface preview
5. **What ScaleSage fixes** — five outcome-framed service groups
6. **Industries** — 18 SME sectors, hover reveals the 3 biggest leaks
7. **Pricing** — Starter £597 / Pro £1,497 (anchored) / Max £4,997
8. **Proof** — honest founding-stage programme, placeholder case studies
9. **Why ScaleSage isn't a normal AI agency** — typography-only differentiation
10. **FAQ + final CTA** — "Find your leak."

**The Catalyst Journey** is the interactive centrepiece: a full-screen Sage scan (branching questions → live capture → leak map → Starter/Pro/Max tier match). It's scripted/deterministic here; the live backend (Sonnet → Opus → GPT-5.5 routing) is a drop-in replacement for `lib/journey.ts`. Plus a sentinel-driven sticky nav with a persistent "Start the Catalyst" CTA (sticky on mobile), GDPR cookie banner, and AEO baked in (JSON-LD, `llms.txt`, `robots`, `sitemap`).

## Proof discipline

No fabricated stats. Category statistics carry a `[D]` confidence tag; client results stay in founding-stage language until real 90-day cycles complete (Q3 2026).

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
```

## Project structure

```
app/        layout (metadata, JSON-LD, fonts), page (section composition), globals.css, sitemap
components/ one file per section + DataStreamField (canvas), Nav, CatalystJourney, CookieBanner, JourneyProvider, ScrollReveal
lib/        journey.ts — Sage logic: steps, leak map, tier routing, scripted replies
public/     llms.txt, robots.txt
```

## Deploy to Vercel

Import the repo (auto-detects Next.js). After setting the production domain, update `SITE_URL` in `app/layout.tsx`, `public/robots.txt`, and `app/sitemap.ts`.

## Not yet built (next per the brief)

Dedicated routes — `/catalyst`, `/pricing`, `/how-it-works`, `/industries` (+ trades pages), `/about`, `/partners`, `/privacy`, `/terms` — and the live Sage backend. v1 ships the strongest homepage + diagnostic first.
