"use client";

import { useEffect, useMemo, useRef } from "react";
import { buildResult, jobValueOf, pipe, sectorOf, type Chip, type ScanAnswers } from "@/lib/catalyst";
import type { ChecksResult, PublicFinding, ResearchState } from "@/lib/catalyst-api";
import type { LookupState } from "./session";
import { activityLine, evidenceFrom, pounds, type Section } from "./sections";
import styles from "./catalyst.module.css";

/* One section's result, shown as soon as its questions are answered. Every line
 * comes from the visitor's answers, the lookup, what the research measured, or a
 * finding it quoted. Nothing is invented: what is not known yet says so. Copy is
 * JW-approval-pending. */

const CHIP_CLASS: Record<Chip, string> = {
  Clear: styles.chipClear,
  "Needs full scan": styles.chipScan,
  Likely: styles.chipLikely,
  Detected: styles.chipDetected,
};

function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString("en-GB")} ${n === 1 ? one : many}`;
}

function sectorPhrase(answers: ScanAnswers): string {
  const sector = sectorOf(answers);
  if (sector !== "other") return pipe("{sectors}", { sectors: [sector] } as ScanAnswers).toLowerCase();
  const typed = typeof answers.sectors_other === "string" ? answers.sectors_other.trim() : "";
  return typed || "your trade";
}

function teamPhrase(team: unknown): string {
  if (team === "just-me") return "just you";
  return pipe("a team of {team}", { team } as ScanAnswers);
}

function businessLines(
  answers: ScanAnswers,
  checks: ChecksResult | null,
  lookup: LookupState | null,
  running: boolean,
): string[] {
  const name = pipe("{business}", answers);
  const lines = [`Sage has ${name} down as ${sectorPhrase(answers)}, with ${teamPhrase(answers.team)}.`];
  const rating = checks?.google_business?.rating ?? lookup?.match?.rating ?? null;
  const count = checks?.google_business?.review_count ?? lookup?.match?.review_count ?? null;
  if (rating != null && count != null) lines.push(`Google shows ${rating} stars from ${plural(count, "review", "reviews")}.`);
  else if (running) lines.push("Sage is looking up your Google listing and Companies House record now.");
  else lines.push("Sage couldn't find your Google listing yet. Your report checks again.");
  const year = lookup?.match?.incorporated_year;
  if (typeof year === "number") {
    const age = new Date().getFullYear() - year;
    if (age > 0) lines.push(`Registered with Companies House in ${year}: ${plural(age, "year", "years")} of customers behind you.`);
  }
  return lines;
}

function jobValueLines(answers: ScanAnswers, research: ResearchState | null): string[] {
  if (jobValueOf(answers) == null) {
    return ["No problem. Sage will use typical figures for your trade and mark them as estimates."];
  }
  const pence = research?.estimates?.one_job_a_week_pence;
  if (typeof pence === "number") return [`One lost job a week is about ${pounds(pence)} a month.`];
  return ["Sage will use this to put pounds on each leak."];
}

function reviewLines(checks: ChecksResult | null, research: ResearchState | null, running: boolean): string[] {
  const lines: string[] = [];
  const own = checks?.google_business;
  if (own?.rating != null && own.review_count != null) {
    lines.push(`You: ${own.rating} stars from ${plural(own.review_count, "review", "reviews")}.`);
  }
  for (const rival of research?.rivals ?? []) {
    if (rival.name && rival.rating != null && rival.review_count != null) {
      lines.push(`Nearby, ${rival.name}: ${rival.rating} stars from ${plural(rival.review_count, "review", "reviews")}.`);
    }
  }
  if (!lines.length && !running) lines.push("Sage couldn't compare your reviews with local rivals yet. Your report checks again.");
  return lines;
}

function onlineLines(checks: ChecksResult | null, research: ResearchState | null, running: boolean): string[] {
  const lines: string[] = [];
  const google = checks?.google_business;
  if (google?.exists === false) lines.push("No Google Business Profile found.");
  else if (google?.ranks_page_one === true) lines.push("You show on Google's first page for your trade.");
  else if (google?.ranks_page_one === false) lines.push("You don't show on Google's first page for your trade yet.");
  const named = research?.ai_named_by ?? [];
  if (named.length) lines.push(`Named by ${named.join(", ")} when Sage asked.`);
  else if (checks?.ai_presence?.appears === false) lines.push("Not named by the AI engines Sage asked.");
  if (!lines.length) {
    lines.push(running ? "Sage is still measuring this." : "Sage couldn't measure this yet. Your report checks again.");
  }
  return lines;
}

function estimateNote(basis: string, hasJobValue: boolean): string {
  if (basis === "their_number") return "From your own figures.";
  return hasJobValue
    ? "An estimate from your job value and typical figures for your trade."
    : "An estimate from typical figures for your trade.";
}

export default function SectionResult({
  section,
  answers,
  checks,
  research,
  lookup,
  running,
  onContinue,
}: {
  section: Section;
  answers: ScanAnswers;
  checks: ChecksResult | null;
  research: ResearchState | null;
  lookup: LookupState | null;
  running: boolean;
  onContinue: () => void;
}) {
  const continueRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    continueRef.current?.focus({ preventScroll: true });
  }, [section.id]);

  const chip = useMemo<Chip | null>(() => {
    if (!section.leak) return null;
    try {
      return buildResult(answers, evidenceFrom(checks)).nodes.find((n) => n.leak === section.leak)?.chip ?? null;
    } catch {
      return null;
    }
  }, [answers, checks, section.leak]);

  const lines =
    section.id === "business"
      ? businessLines(answers, checks, lookup, running)
      : section.id === "job_value"
        ? jobValueLines(answers, research)
        : section.id === "reviews"
          ? reviewLines(checks, research, running)
          : section.id === "online"
            ? onlineLines(checks, research, running)
            : [];

  const estimate = section.estimate ? research?.estimates?.[section.estimate] ?? null : null;
  const findings: PublicFinding[] = section.findingLeak
    ? (research?.findings ?? []).filter((f) => f.leak === section.findingLeak).slice(0, 2)
    : [];
  const stillChecking = Boolean(section.findingLeak) && findings.length === 0 && running;

  return (
    <div className={styles.reactionBubble}>
      <span className={styles.sageNoteLabel}>{section.title}</span>
      <div role="status" aria-live="polite" className={styles.resultBody}>
        {section.leak && chip && (
          <div className={styles.resultChipRow}>
            <span className={styles.resultLeak}>{section.leak}</span>
            <span className={`${styles.chip} ${CHIP_CLASS[chip]}`}>{chip}</span>
          </div>
        )}
        {lines.map((line) => (
          <p key={line} className={styles.resultLine}>
            {line}
          </p>
        ))}
        {estimate && (
          <p className={styles.resultLine}>
            Estimated leak: about {pounds(estimate.monthly_pence)} a month.{" "}
            <span className={styles.resultNote}>{estimateNote(estimate.basis, jobValueOf(answers) != null)}</span>
          </p>
        )}
        {findings.map((f) => (
          <figure key={`${f.claim}-${f.quote}`} className={styles.resultFinding}>
            <figcaption className={styles.resultNote}>{f.side === "against" ? "In your favour" : "What Sage found"}</figcaption>
            <p className={styles.resultLine}>{f.claim}</p>
            <blockquote className={styles.resultQuote}>&ldquo;{f.quote}&rdquo;</blockquote>
          </figure>
        ))}
        {stillChecking && (
          <p className={styles.resultNote}>Sage is still checking this. Anything it finds goes into your final result.</p>
        )}
      </div>
      {running && (
        <p className={styles.liveLine}>
          <span className={styles.liveDot} aria-hidden="true" />
          {activityLine(research?.activity)}
        </p>
      )}
      <button ref={continueRef} type="button" className="btn btn-primary btn-md" style={{ alignSelf: "flex-start" }} onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
