"use client";

import { useState } from "react";
import { buildPayload, type ScanResult, type ScanAnswers } from "@/lib/catalyst";
import api, { type ChecksResult } from "@/lib/catalyst-api";
import { resolveTier } from "./meta";
import type { LookupState } from "./session";
import styles from "./catalyst.module.css";

type Urgency = "annoying" | "weekly_cost" | "urgent";

const URGENCY: { value: Urgency; label: string }[] = [
  { value: "annoying", label: "Annoying but not urgent" },
  { value: "weekly_cost", label: "Costing money weekly" },
  { value: "urgent", label: "Need it fixed now" },
];

interface FormState {
  name: string;
  business: string;
  website: string;
  email: string;
  phone: string;
  urgency: Urgency | "";
  bestTime: string;
}

const EMPTY: FormState = { name: "", business: "", website: "", email: "", phone: "", urgency: "", bestTime: "" };

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {optional && <span className={styles.opt}> · optional</span>}
      </span>
      {children}
    </label>
  );
}

export default function UnlockForm({
  result,
  answers,
  checks,
  lookup,
  mode = "build",
  onBack,
}: {
  result: ScanResult;
  answers: ScanAnswers;
  checks?: ChecksResult | null;
  lookup?: LookupState | null;
  mode?: "build" | "nofit";
  onBack: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY,
    business: lookup?.match?.name ?? "",
  }));
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [deferred, setDeferred] = useState(false);

  // doors
  const [payState, setPayState] = useState<"idle" | "opening" | "deferred">("idle");
  const [bookState, setBookState] = useState<"idle" | "opening" | "deferred">("idle");

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const tier = resolveTier(result.tier).label === "Pro" ? "Pro" : "Starter";

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.business.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Please add your name, business, email and a phone number so Sage can send your report.");
      return;
    }
    setStatus("sending");

    // buildPayload is the central payload shape (built in parallel). Call it
    // loosely so an arity/shape drift is a central fix, not a break here; if it
    // throws, fall back to a minimal envelope so the lead is never lost.
    const contact = {
      name: form.name.trim(),
      business: form.business.trim(),
      company: form.business.trim(),
      website: form.website.trim() || null,
      email: form.email.trim(),
      phone: form.phone.trim(),
      urgency: form.urgency || "annoying",
      best_time: form.bestTime.trim() || null,
    };
    const meta = {
      problemsRaw: typeof (answers as Record<string, unknown>).problems_raw === "string" ? ((answers as Record<string, unknown>).problems_raw as string) : "",
      completedAt: new Date().toISOString(),
    };

    const bp = buildPayload as unknown as (...args: unknown[]) => unknown;
    let payload: unknown;
    try {
      payload = bp(answers, contact, meta);
    } catch {
      payload = null;
    }
    if (!payload || typeof payload !== "object") {
      payload = { answers, contact, result };
    }
    const body = { ...(payload as Record<string, unknown>), checks: checks ?? null };

    const res = await api.unlock(body); // never throws; local-persists on failure
    if (res.ok) {
      setSessionId(res.session_id);
      setDeferred(res.deferred);
      setStatus("done");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // lead is persisted locally — calm failure + retry, never lost
      setStatus("failed");
    }
  };

  const startNow = async () => {
    setPayState("opening");
    const res = await api.pay(sessionId, tier);
    if (res.ok && res.checkout_url) {
      window.location.href = res.checkout_url;
      return;
    }
    setPayState("deferred");
  };

  const talkFirst = async () => {
    setBookState("opening");
    const res = await api.bookCall(sessionId);
    if (res.ok && res.booking_url) {
      window.location.href = res.booking_url;
      return;
    }
    setBookState("deferred");
  };

  /* ---------------- post-submit: confirmation + doors ---------------- */
  if (status === "done") {
    return (
      <div className={styles.result}>
        <div className={styles.resultHead}>
          <div style={{ flex: 1 }}>
            <span className={styles.tag}>
              <span className={styles.tagDot} aria-hidden="true" />
              Request received
            </span>
            <h1 className="h1" style={{ margin: "12px 0 8px" }}>
              Full Catalyst request received.
            </h1>
            {/* Post-submit copy — verbatim from brief */}
            <p className="lead">
              Sage has saved your leak map and everything you told it. The full report checks your website, search
              visibility, AI visibility, reviews, enquiry flow, follow-up, and operations before recommending the build.
            </p>
            {deferred && (
              <p className={styles.reassureLine}>
                Saved and queued. Sage will pick it up the moment the line is live, and nothing you entered is lost.
              </p>
            )}
          </div>
        </div>

        {/* Two doors — equal weight, both end in a call (brief). The no-fit route
            drops the pay door: we said we won't sell a build that isn't needed. */}
        <div className={styles.doors} style={{ marginTop: 6 }}>
          {mode === "build" && (
            <div className={`${styles.door} ${styles.doorPrimary}`}>
              <span className={styles.doorTitle}>Start now</span>
              {/* Copy JW-approval-pending */}
              <span className={styles.doorText}>
                Put Sage to work on your primary leak today. We schedule your kickoff call as soon as you&rsquo;re in.
              </span>
              <button type="button" className="btn btn-primary btn-md" onClick={startNow} disabled={payState === "opening"}>
                {payState === "opening" ? "Opening checkout…" : "Start now"}
              </button>
              {payState === "deferred" && (
                /* No fake payment — clearly-marked when Stripe is not wired yet. JW-approval-pending. */
                <p className={styles.doorNote}>
                  Secure checkout is being connected. Sage has flagged your build, and the team will send your payment
                  link with the report inside 24 hours.
                </p>
              )}
            </div>
          )}

          <div className={styles.door}>
            <span className={styles.doorTitle}>Talk it through first</span>
            {/* Copy JW-approval-pending */}
            <span className={styles.doorText}>Rather walk the leak map through with a human first? Book a call and we&rsquo;ll take it from there.</span>
            <button type="button" className="btn btn-secondary btn-md" onClick={talkFirst} disabled={bookState === "opening"}>
              {bookState === "opening" ? "Finding a time…" : "Talk it through first"}
            </button>
            {bookState === "deferred" && (
              /* Placeholder booking link — calendar not connected yet. JW-approval-pending. */
              <p className={styles.doorNote}>
                Booking calendar is being connected. Reply to your report email and the team will lock in a time.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- calm failure state (never lose the lead) ---------------- */
  if (status === "failed") {
    return (
      <div className={styles.result}>
        <div className={`glass ${styles.block}`}>
          <span className={styles.tag}>
            <span className={styles.tagDot} aria-hidden="true" />
            Saved locally
          </span>
          <h2 className="h2" style={{ margin: "12px 0 8px" }}>
            Your answers are safe.
          </h2>
          <p className="lead" style={{ marginBottom: 20 }}>
            Sage saved your scan and your details on this device. The handoff didn&rsquo;t complete, so let&rsquo;s try
            once more. Nothing is lost.
          </p>
          <div className={styles.ctaRow}>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => submit()}>
              Retry the handoff
            </button>
            <button type="button" className="btn btn-ghost btn-lg" onClick={() => setStatus("idle")}>
              Back to my details
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- the form (the single capture point) ---------------- */
  return (
    <div className={styles.result}>
      <div className={styles.resultHead}>
        <div style={{ flex: 1 }}>
          <span className={styles.tag}>
            <span className={styles.tagDot} aria-hidden="true" />
            Last step
          </span>
          <h1 className="h1" style={{ margin: "12px 0 8px" }}>
            Where do we send the full report?
          </h1>
          {/* Copy JW-approval-pending */}
          <p className="lead">
            Sage keeps the leak map you just built. Add your details and the full Catalyst lands within 24 hours. No
            payment to begin.
          </p>
        </div>
      </div>

      <form className={`glass ${styles.block} ${styles.form}`} onSubmit={submit}>
        <div className={styles.formGrid}>
          <Field label="Your name">
            <input className={styles.input} value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" placeholder="Alex Rivera" />
          </Field>
          <Field label="Business name">
            <input className={styles.input} value={form.business} onChange={(e) => set("business", e.target.value)} autoComplete="organization" placeholder="Rivera Plumbing Ltd" />
          </Field>
        </div>

        <div className={styles.formGrid}>
          <Field label="Email">
            <input className={styles.input} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" placeholder="alex@riveraplumbing.co.uk" />
          </Field>
          <Field label="WhatsApp / phone">
            <input className={styles.input} type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="07700 900000" />
          </Field>
        </div>

        <div className={styles.formGrid}>
          <Field label="Website" optional>
            <input className={styles.input} value={form.website} onChange={(e) => set("website", e.target.value)} autoComplete="url" placeholder="riveraplumbing.co.uk" />
          </Field>
          <Field label="Best time to talk" optional>
            <input className={styles.input} value={form.bestTime} onChange={(e) => set("bestTime", e.target.value)} placeholder="Weekday mornings" />
          </Field>
        </div>

        <div>
          <span className={styles.fieldLabel}>How urgent is this?</span>
          <div className={styles.pills} role="radiogroup" aria-label="How urgent is this?">
            {URGENCY.map((u) => (
              <button
                key={u.value}
                type="button"
                role="radio"
                aria-checked={form.urgency === u.value}
                className={`${styles.pill} ${form.urgency === u.value ? styles.pillSel : ""}`}
                onClick={() => set("urgency", u.value)}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className={styles.alert} role="alert">
            {error}
          </div>
        )}

        <div className={styles.ctaRow}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={status === "sending"}>
            {status === "sending" ? "Saving your request…" : "Unlock the full leak report."}
          </button>
          <button type="button" className={styles.back} onClick={onBack}>
            &larr; Back to leak map
          </button>
        </div>
        {/* Reassurance — JW-approval-pending */}
        <p className={styles.reassureLine}>
          No payment to begin. You keep the leak report either way. GDPR-safe and encrypted. We never sell your data or
          use it to train external AI.
        </p>
      </form>
    </div>
  );
}
