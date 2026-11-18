"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { ScanAnswers } from "@/lib/catalyst";
import type { LookupMatch, PublicFinding } from "@/lib/catalyst-api";
import { LINES, OTHER, type Message, type Open, type Option, type Thread, type TradeGroup } from "./thread";
import styles from "./catalyst.module.css";

/* Renders the thread buildThread calculated. Your replies appear on the tap;
 * Sage's next messages follow about half a second of typing dots, then fade in
 * together. A new message is brought into view only when the reader is at the
 * bottom of the conversation; someone who scrolled up gets a "New message" pill
 * instead. Every scroll is checked once it settles, and if the newest message
 * is not in view it jumps there, so an interrupted scroll never strands anyone. */

const BEAT_MS = 500;
const FADE_OUT_MS = 180;
const NEAR_BOTTOM_PX = 160;
const SETTLE_MS = 700;
const CHIP: Record<string, string> = {
  Clear: styles.chipClear,
  "Needs full scan": styles.chipScan,
  Likely: styles.chipLikely,
  Detected: styles.chipDetected,
};

export interface ConversationActions {
  onName: (name: string) => void;
  onMatch: (yes: boolean) => void;
  onUseTyped: (name: string) => void;
  onTrade: (value: string | null) => void;
  onAnswer: (stepId: string, value: string | string[], other?: string) => void;
  onEdit: (stepId: string) => void;
}

function headerBottom(): number {
  const header = document.querySelector<HTMLElement>("[data-sage-header]");
  return header ? header.getBoundingClientRect().bottom : 0;
}

export default function Conversation({
  thread,
  answers,
  reduced,
  details,
  actions,
}: {
  thread: Thread;
  answers: ScanAnswers;
  reduced: boolean;
  details: ReactNode;
  actions: ConversationActions;
}) {
  const ids = thread.messages.map((m) => m.id).join("\n");
  const [seen, setSeen] = useState(ids);
  const [beatFrom, setBeatFrom] = useState<number | null>(null);
  const [freshFrom, setFreshFrom] = useState<number | null>(null);
  const [fadingAfter, setFadingAfter] = useState<number | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [pill, setPill] = useState(false);

  /* A new batch of Sage messages waits behind the typing beat. Decided while
   * rendering (the "adjust state when a prop changes" pattern), so the batch is
   * never painted first and then hidden. */
  if (seen !== ids) {
    const before = new Set(seen.split("\n"));
    const lastSeen = thread.messages.reduce((at, m, i) => (before.has(m.id) ? i : at), -1);
    const first = thread.messages.findIndex((m, i) => i > lastSeen && !before.has(m.id) && m.kind !== "reply");
    setSeen(ids);
    setFadingAfter(null);
    setBeatFrom(reduced || first < 0 ? null : first);
    setFreshFrom(reduced || first < 0 ? null : first);
    if (first >= 0 && !atBottom) setPill(true);
  }

  useEffect(() => {
    if (beatFrom === null) return;
    const timer = window.setTimeout(() => setBeatFrom(null), BEAT_MS);
    return () => window.clearTimeout(timer);
  }, [beatFrom, seen]);

  const visible = beatFrom === null ? thread.messages : thread.messages.slice(0, beatFrom);
  const typing = beatFrom !== null || thread.open.kind === "pending";
  const showControls = beatFrom === null && fadingAfter === null;

  /* ---- scrolling ---- */
  const endRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  useEffect(() => {
    const onScroll = () => {
      const end = endRef.current;
      if (!end) return;
      const near = end.getBoundingClientRect().bottom - window.innerHeight < NEAR_BOTTOM_PX;
      atBottomRef.current = near;
      setAtBottom(near);
      if (near) setPill(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const bringIntoView = useCallback(
    (smooth: boolean) => {
      const end = endRef.current;
      const last = lastRef.current;
      if (!end) return;
      const top = headerBottom() + 12;
      const place = () => {
        const endBox = end.getBoundingClientRect();
        const lastBox = last?.getBoundingClientRect();
        const room = window.innerHeight - top;
        const fromTop = lastBox ? lastBox.top : endBox.top;
        const target =
          endBox.bottom - fromTop > room
            ? window.scrollY + fromTop - top
            : window.scrollY + endBox.bottom - window.innerHeight + 16;
        return Math.max(0, target);
      };
      const check = () => {
        const end2 = endRef.current?.getBoundingClientRect();
        const last2 = lastRef.current?.getBoundingClientRect();
        if (!end2) return;
        const lastTop = last2 ? last2.top : end2.top;
        const inView = lastTop >= top - 2 && (end2.bottom <= window.innerHeight + 2 || lastTop <= top + 2);
        if (!inView) window.scrollTo({ top: place(), behavior: "auto" });
      };
      const goal = place();
      if (Math.abs(goal - window.scrollY) < 2) return;
      if (!smooth) {
        window.scrollTo({ top: goal, behavior: "auto" });
        return;
      }
      window.scrollTo({ top: goal, behavior: "smooth" });
      let done = false;
      const settle = () => {
        if (done) return;
        done = true;
        window.removeEventListener("scrollend", settle);
        check();
      };
      window.addEventListener("scrollend", settle, { once: true });
      window.setTimeout(settle, SETTLE_MS);
    },
    [],
  );

  /* After an edit the changed reply comes back into view, under the header,
   * rather than the end of the conversation: that is where the change shows. */
  const returnTo = useRef<string | null>(null);
  const openStep = "stepId" in thread.open ? thread.open.stepId : null;

  const shownKey = `${visible.length}|${showControls ? thread.open.kind : "beat"}|${typing}`;
  useEffect(() => {
    const back = returnTo.current;
    if (back && openStep !== back) {
      const replies = document.querySelectorAll<HTMLElement>(`[data-reply-step="${back}"]`);
      const reply = replies[replies.length - 1];
      if (reply) {
        returnTo.current = null;
        const top = headerBottom() + 12;
        window.scrollTo({ top: Math.max(0, window.scrollY + reply.getBoundingClientRect().top - top), behavior: "auto" });
        reply.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
        return;
      }
    }
    if (!atBottomRef.current) return;
    bringIntoView(!reduced);
  }, [shownKey, openStep, reduced, bringIntoView]);

  /* ---- focus: a new question's first answer, without scrolling; the details
   * form's first field when the scan reaches it ---- */
  const openKey = `${thread.open.kind}:${openStep ?? ""}`;
  const previousOpen = useRef(openKey);
  useEffect(() => {
    if (!showControls) return;
    const came = previousOpen.current;
    previousOpen.current = openKey;
    if (thread.open.kind === "details") {
      if (came.startsWith("valve")) {
        document.querySelector<HTMLElement>("[data-details] input")?.focus({ preventScroll: true });
      }
      return;
    }
    const first = controlsRef.current?.querySelector<HTMLElement>("button:not([disabled]), input, textarea");
    first?.focus({ preventScroll: true });
  }, [openKey, showControls, thread.open.kind]);

  /* ---- editing: the later messages fade out, then the question reopens ---- */
  const edit = (index: number, stepId: string) => {
    returnTo.current = stepId;
    if (reduced) {
      actions.onEdit(stepId);
      return;
    }
    setFadingAfter(index);
    window.setTimeout(() => actions.onEdit(stepId), FADE_OUT_MS);
  };

  const lastSage = (() => {
    for (let i = visible.length - 1; i >= 0; i -= 1) if (visible[i].kind !== "reply") return i;
    return -1;
  })();

  return (
    <div className={styles.conversation}>
      <div className={styles.thread} role="log" aria-live="polite" aria-relevant="additions" aria-label="Your conversation with Sage">
        {visible.map((m, i) => {
          const fresh = freshFrom !== null && i >= freshFrom && m.kind !== "reply";
          const classes = [
            m.kind === "reply" ? styles.rowYou : styles.rowSage,
            fresh ? styles.rowFresh : "",
            fadingAfter !== null && i > fadingAfter ? styles.rowFading : "",
          ].join(" ");
          return (
            <div
              key={m.id}
              ref={i === lastSage ? lastRef : undefined}
              className={classes}
              data-reply-step={m.kind === "reply" ? m.stepId : undefined}
              data-details={m.kind === "details" ? "" : undefined}
              style={fresh && freshFrom !== null ? { animationDelay: `${Math.min(i - freshFrom, 5) * 70}ms` } : undefined}
            >
              <MessageView message={m} details={details} onEdit={m.kind === "reply" && m.editable ? () => edit(i, m.stepId) : undefined} />
            </div>
          );
        })}
        {typing && (
          <div className={styles.rowSage} aria-hidden="true">
            <span className={`${styles.bubbleSage} ${styles.typingBubble}`}>
              <span className={styles.typingDots}>
                <span />
                <span />
                <span />
              </span>
            </span>
          </div>
        )}
      </div>

      {showControls && (
        <div
          ref={controlsRef}
          className={`${styles.controlsArea} ${freshFrom !== null ? styles.rowFresh : ""}`}
          style={freshFrom !== null ? { animationDelay: `${Math.min(thread.messages.length - freshFrom, 6) * 70}ms` } : undefined}
        >
          <Controls key={openKey} open={thread.open} answers={answers} actions={actions} />
        </div>
      )}
      <div ref={endRef} className={styles.threadEnd} />

      {pill && !atBottom && (
        <button
          type="button"
          className={styles.newPill}
          onClick={() => {
            setPill(false);
            atBottomRef.current = true;
            bringIntoView(!reduced);
          }}
        >
          New message <span aria-hidden="true">↓</span>
        </button>
      )}
    </div>
  );
}

/* ============================== messages ============================== */

function matchLine(m: LookupMatch): string {
  const bits: string[] = [];
  if (typeof m.incorporated_year === "number") bits.push(`trading since ${m.incorporated_year}`);
  if (m.location) bits.push(m.location);
  if (typeof m.review_count === "number" && m.review_count > 0) bits.push(`${m.review_count} Google reviews`);
  return bits.join(" · ");
}

function FindingView({ finding, caption }: { finding: PublicFinding; caption: string }) {
  return (
    <figure className={styles.resultFinding}>
      <figcaption className={styles.resultNote}>{caption}</figcaption>
      <p className={styles.resultLine}>{finding.claim}</p>
      <blockquote className={styles.resultQuote}>&ldquo;{finding.quote}&rdquo;</blockquote>
    </figure>
  );
}

function MessageView({ message: m, details, onEdit }: { message: Message; details: ReactNode; onEdit?: () => void }) {
  switch (m.kind) {
    case "reply":
      return onEdit ? (
        <button type="button" className={`${styles.bubbleYou} ${styles.bubbleEditable}`} onClick={onEdit} aria-label={`${m.text}. Change this answer`}>
          <span>{m.text}</span>
          <span className={styles.editMark} aria-hidden="true">✎</span>
        </button>
      ) : (
        <span className={styles.bubbleYou}>{m.text}</span>
      );
    case "question":
      return (
        <div className={styles.bubbleSage}>
          <p className={styles.chatQuestion}>{m.text}</p>
          {m.hint && <p className={styles.chatHint}>{m.hint}</p>}
        </div>
      );
    case "sage":
      return (
        <div className={styles.bubbleSage}>
          <p className={styles.chatText}>{m.text}</p>
        </div>
      );
    case "match":
      return (
        <div className={styles.bubbleSage}>
          <p className={styles.chatText}>{LINES.matchAsk}</p>
          <div className={styles.matchCard}>
            <div className={styles.matchName}>{m.match.name}</div>
            {matchLine(m.match) && <div className={styles.matchMeta}>{matchLine(m.match)}</div>}
          </div>
        </div>
      );
    case "lead":
      return (
        <div className={styles.bubbleSage}>
          <FindingView finding={m.finding} caption={m.finding.side === "against" ? LINES.leadAgainst : LINES.leadFor} />
        </div>
      );
    case "result":
      return (
        <div className={`${styles.bubbleSage} ${styles.bubbleResult}`}>
          <span className={styles.sageNoteLabel}>{m.title}</span>
          {m.leak && m.chip && (
            <div className={styles.resultChipRow}>
              <span className={styles.resultLeak}>{m.leak}</span>
              <span className={`${styles.chip} ${CHIP[m.chip] ?? ""}`}>{m.chip}</span>
            </div>
          )}
          {m.lines.map((line) => (
            <p key={line} className={styles.resultLine}>
              {line}
            </p>
          ))}
          {m.estimate && (
            <p className={styles.resultLine}>
              {m.estimate.text} <span className={styles.resultNote}>{m.estimate.note}</span>
            </p>
          )}
          {m.findings.map((f) => (
            <FindingView key={`${f.claim}-${f.quote}`} finding={f} caption={f.side === "against" ? LINES.resultAgainst : LINES.resultFor} />
          ))}
          {m.stillChecking && <p className={styles.resultNote}>{LINES.stillChecking}</p>}
        </div>
      );
    case "details":
      return (
        <div className={`${styles.bubbleSage} ${styles.bubbleDetails}`}>
          <p className={styles.chatQuestion}>{m.text}</p>
          {details}
        </div>
      );
  }
}

/* ============================== controls ============================== */

function Controls({ open, answers, actions }: { open: Open; answers: ScanAnswers; actions: ConversationActions }) {
  switch (open.kind) {
    case "name":
      return <TextSend placeholder="Your business name" label="Your business name" onSend={actions.onName} />;
    case "manual":
      return (
        <div className={styles.controlsStack}>
          <div className={styles.chips}>
            <button type="button" className={styles.chatChip} onClick={() => actions.onUseTyped(open.name)}>
              {LINES.asTyped(open.name)}
            </button>
          </div>
          <TextSend placeholder="Type the name again" label="Your business name" initial={open.name} onSend={actions.onName} />
        </div>
      );
    case "match":
      return (
        <div className={styles.chips}>
          <button type="button" className={`${styles.chatChip} ${styles.chatChipPrimary}`} onClick={() => actions.onMatch(true)}>
            {LINES.matchYes}
          </button>
          <button type="button" className={styles.chatChip} onClick={() => actions.onMatch(false)}>
            {LINES.matchNo}
          </button>
        </div>
      );
    case "trade-confirm":
      return (
        <div className={styles.chips}>
          {open.trades.length === 1 ? (
            <button type="button" className={`${styles.chatChip} ${styles.chatChipPrimary}`} onClick={() => actions.onTrade(open.trades[0].value)}>
              {LINES.tradeYes}
            </button>
          ) : (
            open.trades.map((t) => (
              <button key={t.value} type="button" className={styles.chatChip} onClick={() => actions.onTrade(t.value)}>
                {t.label}
              </button>
            ))
          )}
          <button type="button" className={styles.chatChip} onClick={() => actions.onTrade(null)}>
            {LINES.tradeNo}
          </button>
        </div>
      );
    case "trades":
      return <TradePicker groups={open.groups} other={open.other} answers={answers} onDone={(v, other) => actions.onAnswer("sectors", v, other)} />;
    case "single":
      return <SingleChips stepId={open.stepId} options={open.options} other={open.other} answers={answers} onAnswer={actions.onAnswer} />;
    case "valve":
      return (
        <div className={styles.controlsStack}>
          <TextSend
            multiline
            placeholder="One line is plenty"
            label="Anything else, optional"
            initial={typeof answers[open.stepId] === "string" ? String(answers[open.stepId]) : ""}
            allowEmpty
            onSend={(text) => actions.onAnswer(open.stepId, text.trim())}
          />
          <div className={styles.chips}>
            <button type="button" className={styles.chatChip} onClick={() => actions.onAnswer(open.stepId, "")}>
              {LINES.valveSkip}
            </button>
          </div>
        </div>
      );
    default:
      return null;
  }
}

function TextSend({
  placeholder,
  label,
  initial = "",
  multiline = false,
  allowEmpty = false,
  onSend,
}: {
  placeholder: string;
  label: string;
  initial?: string;
  multiline?: boolean;
  allowEmpty?: boolean;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState(initial);
  const ready = allowEmpty || text.trim().length >= 2;
  const send = () => {
    if (ready) onSend(text.trim());
  };
  return (
    <form
      className={styles.sendRow}
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      {multiline ? (
        <textarea
          className={styles.sendInput}
          value={text}
          rows={2}
          placeholder={placeholder}
          aria-label={label}
          onChange={(e) => setText(e.target.value)}
        />
      ) : (
        <input
          className={styles.sendInput}
          value={text}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="organization"
          onChange={(e) => setText(e.target.value)}
        />
      )}
      <button type="submit" className={styles.sendButton} disabled={!ready}>
        Send
      </button>
    </form>
  );
}

function SingleChips({
  stepId,
  options,
  other,
  answers,
  onAnswer,
}: {
  stepId: string;
  options: Option[];
  other: boolean;
  answers: ScanAnswers;
  onAnswer: ConversationActions["onAnswer"];
}) {
  const current = answers[stepId];
  const [typing, setTyping] = useState(false);
  const previous = typeof answers[`${stepId}_other`] === "string" ? String(answers[`${stepId}_other`]) : "";
  return (
    <div className={styles.controlsStack}>
      <div className={styles.chips}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`${styles.chatChip} ${current === o.value ? styles.chatChipCurrent : ""}`}
            onClick={() => onAnswer(stepId, o.value)}
          >
            {o.label}
          </button>
        ))}
        {other && (
          <button
            type="button"
            className={`${styles.chatChip} ${typing || current === OTHER ? styles.chatChipCurrent : ""}`}
            aria-expanded={typing}
            onClick={() => setTyping(true)}
          >
            Something else
          </button>
        )}
      </div>
      {typing && (
        <TextSend
          placeholder="Tell Sage in your own words"
          label="Your answer in your own words"
          initial={previous}
          onSend={(text) => onAnswer(stepId, OTHER, text)}
        />
      )}
    </div>
  );
}

function TradePicker({
  groups,
  other,
  answers,
  onDone,
}: {
  groups: TradeGroup[];
  other: boolean;
  answers: ScanAnswers;
  onDone: (values: string[], other?: string) => void;
}) {
  const initial = Array.isArray(answers.sectors) ? answers.sectors.filter((v) => v !== OTHER) : [];
  const [chosen, setChosen] = useState<string[]>(initial);
  const [typing, setTyping] = useState(Array.isArray(answers.sectors) && answers.sectors.includes(OTHER));
  const [text, setText] = useState(typeof answers.sectors_other === "string" ? answers.sectors_other : "");
  const toggle = (v: string) => setChosen((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]));
  const typed = typing && text.trim().length >= 2;
  const ready = chosen.length > 0 || typed;
  return (
    <div className={styles.controlsStack}>
      {groups.map((g) => (
        <fieldset key={g.label} className={styles.tradeGroup}>
          <legend className={styles.tradeGroupLabel}>{g.label}</legend>
          <div className={styles.chips}>
            {g.options.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`${styles.chatChip} ${chosen.includes(o.value) ? styles.chatChipCurrent : ""}`}
                aria-pressed={chosen.includes(o.value)}
                onClick={() => toggle(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {other && (
        <div className={styles.chips}>
          <button
            type="button"
            className={`${styles.chatChip} ${typing ? styles.chatChipCurrent : ""}`}
            aria-pressed={typing}
            onClick={() => setTyping((t) => !t)}
          >
            Something else
          </button>
        </div>
      )}
      {typing && (
        <input
          className={styles.sendInput}
          value={text}
          placeholder="What you do, in your own words"
          aria-label="What you do, in your own words"
          onChange={(e) => setText(e.target.value)}
        />
      )}
      <div>
        <button
          type="button"
          className={styles.sendButton}
          disabled={!ready}
          onClick={() => onDone(typed ? [...chosen, OTHER] : chosen, typed ? text.trim() : undefined)}
        >
          Done
        </button>
      </div>
    </div>
  );
}
