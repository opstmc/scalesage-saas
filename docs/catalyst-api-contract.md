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
    "website": "https://..." | null,      // Places
    "place_id": "ChIJ..." | null,         // Places, passed to research
    "company_number": "13472582" | null,  // Companies House, passed to research
    "source": "companies_house" | "places" | "both",
    "confidence": 0.0                     // 0..1, for ranking candidates
  }]
}
```
No key / no match → `{ "status": "no_match", "matches": [] }`. Frontend falls back to manual sector select. Never a dead end.

## 2a. `POST /catalyst/research` — start the research run (replaces `/checks`)
Fired the moment Q1 locks, with the confirmed match. The backend measures the business (the same fixed checks and evidence sections as before) and then runs the research agent, which reads the site, reviews, directories and AI answers and records findings that each quote a source it opened. Capped at 10 starts per address per hour.
```jsonc
// req: only `name` is required; send what the match carried
{ "name": "...", "town": "Leeds", "website": "https://...", "sector": "plumber",
  "place_id": "ChIJ...", "company_number": "...", "rating": 4.6, "review_count": 37, "incorporated_year": 2014 }
// res
{ "run_id": "uuid" }
```
A website that is not a public web address is refused with 422. 429 when the per-address cap is hit; the site then falls back to `/checks`.

## 2b. `GET /catalyst/research/{run_id}?job_value=<pounds>&sector=<scan sector id>` — progress, polled every few seconds
Returns the `/checks` result shape below plus what each scan section shows. The fixed checks land within seconds; the deeper measurements follow, then the findings. An unknown id answers `deferred` with everything else empty. Only unlinked scan runs are served: once a run belongs to a client it is no longer readable here. `job_value` is optional, a whole number of pounds from 1 to 1,000,000; without it the estimates use the sector's benchmarks. `sector` is optional, the scan's own sector id (`plumbers`, `gas-engineers`, ...), so the estimates use the same benchmarks as the report; without it the run's lookup sector is used.
```jsonc
{
  // ...the /checks fields...
  "finished": false,                                   // the run has stopped (done, stopped or failed)
  "activity": "read_page" | null,                      // the agent's latest tool, for the live line
  "findings": [ { "leak": "missed_calls", "side": "for" | "against", "claim": "...", "quote": "..." } ],
  "rivals": [ { "name": "...", "rating": 4.8, "review_count": 120 } ],   // up to 3
  "ai_named_by": [ "chatgpt" ],
  "estimates": {
    "one_job_a_week_pence": 108333 | null,             // only with job_value
    "missed_calls":     { "monthly_pence": 0, "basis": "their_number" | "benchmark", "workings": "..." } | null,
    "cold_quotes":      { ... } | null,
    "lapsed_customers": { ... } | null
  } | null
}
```
Findings carry the claim and the quote, never the source text. Every estimate that used a benchmark says `benchmark`.

## 2. `POST /catalyst/checks` — live background checks (non-blocking, kept as the fallback for `research`)
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
  "completed_at": "2026-07-08T12:34:56Z",
  "interview": false,                    // the scan in sections sends false: the report starts at once
  "research_id": "uuid" | null,          // the run from /research; attached to this lead
  "job_value": 320 | null                // whole pounds from the job value section; stored as their own figure
}
// res
{ "ok": true, "session_id": "uuid", "portal_url": "https://..."|null, "interview": false,
  "report_token": "..." | null }         // opens /catalyst/report/{token} in the same visit
```
Behaviour: insert lead + answers + directional result into Postgres (they are now a lead we own) → attach the research run when `research_id` is sent (no second scrape), otherwise enqueue the read-only evidence engine job for the full report → send the internal WhatsApp/Slack alert to Jordan + Cy (name, sector, primary leak, urgency, link). Two Python follow-up sequences hang off this row for drop-offs. On failure the frontend keeps the payload locally and retries; a lead is never silently lost.

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
