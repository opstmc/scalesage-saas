# Catalyst scan as a conversation with Sage

Design agreed 17.11.2026. It answers items 1 and 2 of the owner's feedback list, and item 3 for the scan's screen states:

1. "The Continue button is so easy to miss, user may get confused how to proceed."
2. "After each stage it does not even go up, they need to manually scroll. It feels lacking where the user knows the Catalyst agent is actively searching or doing its job; it's more like a QA instead."

## What testing found (local Docker stack, real backend)

- After the business is confirmed, Sage's reply ends in a small teal text link ("Continue →"), not a button.
- On question pages, Continue sits under the last option. Page 2 (18 trades plus team size) is about 2,200 px tall, so Continue starts about 1,400 px below the fold.
- A disabled Continue looks the same as an enabled one: the site has no disabled button style. It looks pressable, does nothing, and nothing says why.
- Continue moves between screens: under the options on questions, inside the result card on results.
- Each Continue fires two competing smooth scrolls, aimed at the card rather than the page top, so the Sage header ends up under the fixed nav. Smooth scrolling needs every animation frame until it lands; an instant jump worked every time.
- On phones nothing on a question screen shows Sage working: the only status line sits in the right column, collapsed behind "Live leak map · Show". On desktop it is a 12 px grey line.
- The "System scan · Reading your growth system" radar spins from the first question, driven by answers, not by the research.
- The research reports real steps, but only result screens show one, as a small grey line.
- Research is quick: both test businesses had finished (7 and 6 findings) by about question 2. A "working" signal alone covers the first screen or two.
- Sage asks for the trade although the lookup found it, because the lookup and the scan use different trade lists.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Model | One conversation with Sage. Questions are Sage's messages; tapping an answer sends it. | Jakob's Law (chat is how people talk to an agent); Hick's Law (one action, no Continue); Jordan's brief "a real conversation" |
| Findings | Each section opens with what Sage found on that topic, then asks. | The finding is the reason for the question. Sections never wait: a late finding goes in the section's result or the final result. |
| Changing an answer | Tap your earlier reply to reopen that question. | Familiar edit pattern; forgiving; no Back button competing with answers |
| Trade | Confirm the lookup's trade (Yes / Not quite). The list, grouped in four, appears only on "Not quite" or a manual add. | Tesler's Law; Miller's Law (18 options) |
| Live status | A sticky header with Sage's orb and a live line; tap to open the steps and findings. | Nielsen: visibility of system status; progressive disclosure |
| Leak map | Right column on desktop; inside the header panel on phones. The "System scan" card and the phone "Show map" bar go. | Gestalt common region; one control fewer |
| Pacing | About 0.5 s of typing dots, then the whole message. | Doherty Threshold; nothing blocks tapping |
| Ending | Sage asks where to send the report, and the existing details form opens inside the conversation. | No cut back into "form" mode; capture logic untouched |

## Layout

**Desktop (wider than 900 px):** two columns at today's width. Left is the conversation, with a sticky header: Sage's orb (its ring shows progress), "Sage", and a live line underneath ("Reading your website…", then "Research done · 7 findings"; with nothing running, "Question 4 of 9"). Tapping the header opens the steps the research reported and the findings count. Right is the Live Leak Map, sticky, filling in as answers and findings land.

**Phone (900 px and narrower):** one column. The same header sits under the site nav, and its panel also holds the map.

The orb pulses only while research is running, and the line names only steps the research reported.

Unchanged: the entry screen, Start over, saving progress across a refresh, and the report page after capture.

## How the conversation runs

**Opening.** Sage asks the business name. A text box appears at the bottom only when a question needs typing; there is no permanent chat box, because Sage cannot answer free questions. The lookup answers as Sage: "Is this you? …" with **Yes, that's us** and **Not this one** (retype, or use the name as typed). Confirming starts the research.

**Trade.** Confirmed when the lookup found it; otherwise the grouped list with one **Done** button, the only send button in the scan.

**Each section:**

1. Lead: a finding on this topic, if one has landed (claim plus exact quote).
2. Question: the existing wording, answers as chips. A tap sends. "Something else" opens the text box with Send.
3. Your reply, as a bubble with an edit mark.
4. Result: the leak chip (Likely, Detected, Clear, Needs full scan) and the backend's monthly estimate, plus any finding that landed after the question was asked. A finding Sage led with is not repeated.

"Online" has no question; Sage reports what it measured. The priority question comes last, then the optional free-text line, with Skip.

**Editing.** Tapping an earlier reply reopens that question; the later messages fade out. Once it is answered, the thread recalculates: later answers stay, results recompute, and the research is not run again.

**Ending.** Sage says it has what it needs and asks where to send the report. The details form (fields, consent and capture unchanged) opens inside the conversation. The closing line names the leaks found and adds no new money figure: estimates come from the backend, and the site does no money maths.

**Honesty.** Every Sage line is a fixed template filled from the answers, the lookup or the research. Findings show the exact quote. Nothing is generated on the page. Question wording stays; the new connecting lines (lead-ins, trade confirmation, closing) need Jordan's sign-off.

## Scrolling, motion, accessibility

**Scrolling.** The page scrolls as a page; the header is sticky under the site nav. A new Sage message is brought into view only when the reader is at or near the bottom; someone who scrolled up stays put and gets a "New message ↓" pill. Each scroll is checked once it settles, and if the newest message is not fully in view it snaps there, so an interrupted scroll can no longer strand anyone.

**Motion.** Your reply appears on the tap. Sage's message follows about 0.5 s of typing dots, then fades and rises in. Editing fades the later messages out first. The header panel opens downwards from the header and closes back into it. With reduced motion: no dots, fades or smooth scrolls, and a still mark in place of the pulse.

**Accessibility (WCAG 2.2 AA).** The thread is a live log, so screen readers announce Sage's messages. When a question appears, focus moves to its first answer. Chips are buttons at least 44 px tall with a visible focus ring; text meets 4.5:1 contrast and chip borders 3:1.

**States.**

| State | What shows |
|---|---|
| Looking up | Sage's typing dots |
| No match | The existing line: Sage uses the name as typed |
| Research cannot start | Header: "We'll confirm your online presence in the full scan." Sections run on answers alone. |
| Research still running at the end | Late findings go in the final result |
| Details form fails | Existing retry and save-for-later |
| Refresh mid-scan | Thread rebuilt from saved answers; research read again by its saved run id, so findings return (today they are lost) |

## Code (site only; no backend or API change)

The conversation is calculated, not stored: `buildThread` takes the answers, the open question, the lookup and the research, and returns the messages. Editing, refresh and the honesty rule all follow from that.

| File | Role |
|---|---|
| `components/catalyst/thread.ts` (new) | `buildThread`, the line builders now in `SectionResult`, the section order from `sections.ts` |
| `components/catalyst/Conversation.tsx` (new) | Renders the thread: bubbles, chips, name and "Something else" boxes, editing, typing beat, scroll-into-view with its check, "New message ↓" pill |
| `components/catalyst/SageHeader.tsx` (new) | Sticky header: orb with progress, live line, panel (steps, findings, map on phones), Start over |
| `components/catalyst/ScanFlow.tsx` | Keeps state, lookup and research polling; resumes research from the saved run id; lays out conversation and map. Question-card sub-components go. |
| `components/catalyst/CatalystExperience.tsx` | The details form renders as Sage's last message; the separate unlock screen and its Back route go |
| `components/catalyst/UnlockForm.tsx` | Unchanged inside; only its placement and frame change |
| `catalyst.config.json` | Each trade option lists the lookup categories it matches (Plumbers matches `hvac_plumbing_heating`, …) |

Removed: `SectionResult.tsx`, `SageReaction.tsx` (letter-by-letter typing and the 10-second auto-advance), the "System scan" card, the phone "Show map" bar, and their styles.

API calls unchanged: lookup, start research, read research, unlock.

## Testing

- `tsc`, `eslint` and `npm run build` in the site container.
- Vitest for `thread.ts` only: every number in a Sage line comes from answers, lookup or research; findings carry their exact quote; no section waits for research; editing keeps later answers; a lead finding is not repeated in the result.
- Browser checks on the Docker stack (site on :3061, real backend), headed, at 1366×800 and 390×844: lookup match and manual add; trade confirmed and "Not quite"; sections with and without a finding; "Something else"; editing an early answer late in the scan; refresh mid-scan; research unavailable; newest message in view after every answer, pill when scrolled up; keyboard only; reduced motion; screen-reader log. Fresh scans use live research keys, so keep them to a handful. Scroll and motion checks need the test window uncovered.

## Rollout

Branch `catalyst-scan-conversation`. Commits and the PR wait for the owner's go. The PR's Vercel preview lets Jordan read the new lines in place; they sit together in `thread.ts`, marked JW-approval-pending, and are listed in the PR description. Merging to `main` ships to production; whether that waits for Jordan's sign-off is the owner's call.
