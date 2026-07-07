# Catalyst API contract (frontend ⇄ scalesage-agents)

**Architecture (locked 8 Jul 2026):** the **frontend owns the 13-question mini scan** — the question set, the tap-first flow, and the deterministic directional scoring all live in the site (`catalyst.config.json` + `lib/catalyst.ts`). The **backend (`scalesage-agents`) is the data layer**: live lookups, background checks, lead capture/persistence, the internal alert, the 24-hour evidence engine, and payment. Tiers are **Starter / Pro / Max** everywhere (the scan only ever recommends Starter or Pro; never Max).

Base URL: `NEXT_PUBLIC_SAGE_API_BASE` (prod `https://api.scalesage.ai`). Prefix `/catalyst`. All endpoints are browser-called (public, rate-limited per-IP + per-session), CORS-enabled for the site origin. Straight Python, no n8n. Every endpoint degrades gracefully and **never fabricates** — on missing keys, no match, or timeout it returns an honest empty/deferred shape, never a fake value.

---

## 1. `POST /catalyst/lookup` — Q1 live business lookup
Fired (debounced) as the visitor types their business name. Companies House + Google Places.
```jsonc
// req
{ "query": "Smith & Sons Plumbing" }
// res
{
  "status": "ok" | "no_match",
  "matches": [{
    "name": "SMITH & SONS PLUMBING LTD",
    "sector": "plumber" | null,          // best-effort mapped to our 18 sectors
    "incorporated_year": 2014 | null,     // Companies House
    "location": "Leeds" | null,           // Places
    "review_count": 37 | null,            // Places
    "rating": 4.6 | null,                 // Places
    "source": "companies_house" | "places" | "both",
    "confidence": 0.0                     // 0..1, for ranking candidates
  }]
}
```
No key / no match → `{ "status": "no_match", "matches": [] }`. Frontend falls back to manual sector select. Never a dead end.

## 2. `POST /catalyst/checks` — live background checks (non-blocking)
Fired the moment Q1 locks; runs while they tap through Q2–Q13. Tight budget (single-digit seconds).
```jsonc
// req
{ "business_name": "...", "website": "https://..." | null, "sector": "plumber", "location": "Leeds" }
// res
{
  "status": "complete" | "partial" | "deferred",
  "google_business": { "exists": true, "rating": 4.6, "review_count": 37, "ranks_page_one": false } | null,
  "website":         { "loads": true, "load_ms": 6200, "click_to_call": false } | null,
  "ai_presence":     { "appears": false, "note": "snapshot on the day, varies by prompt/model" } | null
}
```
Any check that is slow/unavailable → its key is `null` and `status` is `partial`/`deferred`. Frontend shows "we'll confirm this in the full scan". Never fake a finding. `ai_presence` is always framed as a same-day snapshot, never a hard ranking.

## 3. `POST /catalyst/unlock` — the SINGLE capture point
Called once, at unlock, after the visitor has seen their directional leak map. Writes the lead immediately, fires the 24h evidence engine, sends the internal alert.
```jsonc
// req
{
  "contact": { "name": "...", "business": "...", "website": "..."|null, "email": "...", "phone": "...",
               "urgency": "annoying" | "weekly_cost" | "urgent", "best_time": "..." },
  "answers": { "business":"...", "sectors":["plumber","gas"], "years":"3-10", "team":"2-5", /* all 13 */ },
  "result":  { "sector":"plumber", "sector_group":"A", "primary_leak":"Cold quotes", "secondary_leak":"Missed calls",
               "needs_full_scan":["Invisible online"], "fix_first":"Convert every quote", "tier":"Pro",
               "revenue_band": {"low":6000,"high":12000}|null, "time_band": {"low":8,"high":14}|null },
  "checks":  { /* the /catalyst/checks result, if it returned */ } | null,
  "problems_raw": "..." | null,           // the open valve text
  "ref": "PARTNERCODE" | null,            // from ?ref cookie, attribution
  "utm": { "source": "...", "medium": "..." } | null,
  "config_version": "2026-07-08",
  "completed_at": "2026-07-08T12:34:56Z"
}
// res
{ "ok": true, "session_id": "uuid", "portal_url": "https://..."|null }
```
Behaviour: insert lead + answers + directional result into Postgres (they are now a lead we own) → enqueue the read-only evidence engine job for the full report → send the internal WhatsApp/Slack alert to Jordan + Cy (name, sector, primary leak, urgency, link). Two Python follow-up sequences hang off this row for drop-offs. On failure the frontend keeps the payload locally and retries; a lead is never silently lost.

## 4. `POST /catalyst/{session_id}/pay` — Stripe checkout
```jsonc
// req
{ "tier": "Starter" | "Pro" }            // Max never comes from the scan
// res
{ "checkout_url": "https://checkout.stripe.com/..." }
```
Reuse the existing Sage Stripe pattern (`/webhooks/stripe` confirms). No `STRIPE_SECRET_KEY` → returns a clearly-marked stub URL (existing behaviour). Paying schedules the kickoff call (both doors end in a call).

## 5. `POST /catalyst/{session_id}/book-call` — "talk it through first" (optional door)
Brief Jordan + Cy over WhatsApp and return a booking link. **No GoHighLevel** in this path.

---

**Frontend client:** `lib/catalyst-api.ts` wraps all of the above with graceful fallbacks (lookup/checks failure → manual/deferred UX; unlock failure → local persist + retry). When `NEXT_PUBLIC_SAGE_API_BASE` is unset (e.g. the preview before the backend ships), the client short-circuits to the graceful-fallback path so the scan still runs and the result still renders — it just can't show live-checked facts or persist the lead yet.
