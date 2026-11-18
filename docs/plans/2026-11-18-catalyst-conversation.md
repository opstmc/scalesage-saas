# Catalyst conversation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Executed in the main session (the user does not want subagents).

**Goal:** Rebuild the Catalyst scan as one conversation with Sage, so there is no Continue button to miss and the visitor always sees the newest message and what Sage is doing (feedback items 1 and 2). Design: `docs/plans/2026-11-17-catalyst-conversation-design.md`.

**Architecture:** The conversation is calculated, not stored. A pure `buildThread` in `components/catalyst/thread.ts` takes the answers, the lookup, the research and two small pieces of UI state (the leads pinned per section, the question being edited) and returns the messages plus the open question. `Conversation.tsx` renders them; `SageHeader.tsx` is the sticky status header; `ScanFlow.tsx` keeps state, runs the lookup and the research polling, and lays out the conversation and the map. No backend or API change.

**Tech Stack:** Next.js 16.2 / React 19.2 client components, CSS modules, Vitest (new, for `thread.ts` only).

---

## Facts the build relies on (read 18.11.2026)

- Questions come from `catalyst.config.json` → `STEPS` in `lib/catalyst.ts`: `business` (lookup), `sectors` (multi, other), `team`, `job_value`, `capture` (other), `followup` (other), `reviews` (other), `retention` (other), `relief` (other), then `VALVE` (`problems_raw`, optional text).
- Sections and their leaks/estimates: `components/catalyst/sections.ts` (`SECTIONS`, `activityLine`, `evidenceFrom`, `pounds`).
- The lookup returns `LookupMatch.sector` in the backend's 18-sector vocabulary (`hvac_plumbing_heating`, ...). The backend maps it to scan trades in `scalesage-agents/src/agents/catalyst_scan/mapping.py` `LOOKUP_SECTORS`. The site never mapped it, which is why the trade question was always asked.
- Research: `api.researchWithChecks` starts a run and polls `api.research(runId, jobValue, sector)` every 2.5 s for up to 210 s. `ResearchState` carries `activity` (current step only), `findings`, `rivals`, `ai_named_by`, `estimates`, `finished`. Estimates need the job value, so the research must be read again after the job value is answered even when the run has finished.
- `get_session`-style persistence: `components/catalyst/session.ts` (sessionStorage, no personal data).
- The details form `UnlockForm` takes `result, answers, checks, lookup, mode, initialSessionId, onReport, onBack`.
- The site nav is `position: fixed` (globals `.nav`); the current sticky offset is 96 px.

## Task 1: Vitest for thread.ts

**Files:** `package.json`, `vitest.config.ts` (new)

1. `npm install -D vitest` (in the site container or locally).
2. `vitest.config.ts`: `environment: "node"`, `resolve.alias["@"]` = repo root, `include: ["components/**/*.test.ts"]`.
3. Script `"test": "vitest run"`.
4. Commit: `Catalyst: Vitest for the conversation logic`.

## Task 2: Trade matches in the config

**Files:** `catalyst.config.json` (sectors options), `lib/catalyst.ts` (`StepOption.matches?: string[]`)

Each trade lists the lookup sectors it matches, the inverse of the backend's `LOOKUP_SECTORS`:
plumbers and gas-engineers ← `hvac_plumbing_heating`; electricians ← `electrical`; builders ← `construction_trades`; auto-repair ← `automotive`; salons ← `beauty_hair`; clinics ← `dental`, `healthcare`; hospitality ← `hospitality_food`; solicitors ← `legal`; accountants ← `accounting_finance`; estate-agents and property-mgmt ← `real_estate_property`; fitness ← `fitness_wellness`; ecommerce ← `ecommerce`.

Commit: `Catalyst: each trade names the lookup sectors it matches`.

## Task 3: thread.ts, test first

**Files:** `components/catalyst/thread.ts` (new), `components/catalyst/thread.test.ts` (new)

Exports:
- `type Message` (each with a stable `id`): `sage-text`, `sage-lead` (finding), `sage-question` (step id, text, hint), `sage-result` (section, leak, chip, lines, estimate, findings, stillChecking), `you-reply` (step id, text, editable), `sage-match` (lookup match card), `sage-details` (the form).
- `type OpenQuestion`: `name`, `match` (Yes / Not this one), `name-retry` (retype or use as typed), `trade-confirm` (matched trades + Not quite), `trades` (grouped list + Something else + Done), `single` (chips + Something else), `valve` (text + Skip), `details`, plus the step id and options.
- `buildThread(input): { messages, open }` with input `{ answers, lookup, naming, checks, research, running, leads, editing }`.
- `openStep(answers, lookup, editing)`: the step to ask next.
- `leadFor(sectionId, research)` and `pinLeads(leads, answers, lookup, research)`: a section's lead is pinned the moment its question opens, so a finding landing later never inserts itself above a question already on screen; it goes in the result instead.
- `tradesForLookup(match)`: the trades whose `matches` include `match.sector`.
- `TRADE_GROUPS`: the 18 trades in four groups (copy JW-approval-pending).
- Line builders moved from `SectionResult.tsx` (business, job value, reviews, online, estimate note), unchanged in wording.
- New connecting lines (lead-ins, trade confirmation, closing) collected in one `LINES` object marked JW-approval-pending.

Tests (write first, see them fail, then implement):
1. Every number in a Sage line appears in the inputs (answers, lookup match, checks, research, config option labels).
2. A finding shows its exact quote, and the claim.
3. No section waits for research: with `research: null, running: true`, answering every question walks to `details`, and each leak section has a result with `stillChecking`.
4. Editing an early answer keeps the later answers, and the thread after the edit is complete again.
5. A finding used as a section's lead is not repeated in that section's result.
6. The trade is confirmed, not asked, when the lookup sector maps to a trade; "Not quite" opens the grouped list.
7. With a manual add the grouped list is asked.

Commit: `Catalyst: the conversation is calculated by buildThread`.

## Task 4: Research can be resumed by run id

**Files:** `lib/catalyst-api.ts`

Extract the polling loop of `researchWithChecks` into `followResearch(runId, opts)`; `researchWithChecks` calls it. ScanFlow calls `followResearch` on a refresh with the saved `researchId`, so findings return after a reload (today they are lost).

Commit: `Catalyst: a saved research run is followed again after a refresh`.

## Task 5: SageHeader

**Files:** `components/catalyst/SageHeader.tsx` (new), styles in `catalyst.module.css`

Sticky under the nav. Orb (`SageOrb`, ring = answered questions / 9; `thinking` only while research runs, `listening` otherwise, `handover` at the details form). "Sage" and the live line: the research's current step while running; "Research done · N findings" when finished; "We'll confirm your online presence in the full scan." when research could not start; otherwise "Question k of 9". A button opens a panel downwards: the steps the research reported (done ✓, current live), the findings count, and on phones the map. Start over sits on the right.

## Task 6: Conversation

**Files:** `components/catalyst/Conversation.tsx` (new), styles

- Renders the messages in a `role="log"` list. Sage messages left, your replies right as bubbles with an edit mark (button) when editable.
- The open question renders its control under the last message: chips (single tap sends), the grouped trade list with Done, the bottom text box only for typing questions (name, Something else, valve) with Send (and Skip for the valve).
- Typing beat: new Sage messages after your reply wait about 0.5 s behind typing dots, then appear together with a short staggered fade. No beat on first load, refresh or reduced motion.
- Editing: tapping a reply fades the later messages (180 ms), then reopens that question.
- Scrolling: tracks whether the reader is near the bottom. A new message is scrolled into view only then; otherwise a "New message ↓" pill appears. After each scroll settles (`scrollend`, or 700 ms), if the newest message is not fully in view below the sticky header, jump there instantly.
- Focus moves to the first answer of a new question (`preventScroll`).
- Chips at least 44 px tall, visible focus ring, 4.5:1 text and 3:1 borders.

## Task 7: ScanFlow and CatalystExperience

**Files:** `components/catalyst/ScanFlow.tsx` (rewrite), `components/catalyst/CatalystExperience.tsx`, `components/catalyst/UnlockForm.tsx` (`onBack` optional, Back hidden without it), `components/catalyst/session.ts` (`leads`; old `unlock` phase reads as `scan`)

ScanFlow keeps answers, lookup, naming state, checks, research, the seen research steps, pinned leads and the edit; runs the lookup on Send; starts or resumes research; re-reads finished research when the job value or trade changes (estimates); lays out the conversation (left) and the map (right on desktop, in the header panel on phones); renders the details form as the last message.

Removed: `SectionResult.tsx`, `SageReaction.tsx`, the System scan card, the phone Show map bar, the TopBar, and their styles.

## Task 8: Checks

1. `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`.
2. Docker stack (`docker compose up -d backend site`, site on :3061, real backend), headed browser at 1366×800 and 390×844: lookup match and manual add; trade confirmed and "Not quite"; sections with and without a finding; "Something else"; editing an early answer late; refresh mid-scan (findings come back); research unavailable; newest message in view after every answer, pill when scrolled up; keyboard only; reduced motion. Fresh scans use live research keys, so keep them to a handful.

## Rollout

Commits on `catalyst-scan-conversation`. Pushing, the PR (its Vercel preview lets Jordan read the new lines) and merging to `main` (production) each wait for the owner's go. The new lines sit together in `thread.ts` `LINES`, marked JW-approval-pending, and are listed in the PR description.
