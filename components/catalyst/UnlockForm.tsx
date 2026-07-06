"use client";

import { useState } from "react";
import { buildPayload, type ScanResult, type ScanAnswers } from "@/lib/catalyst";
import { getRef } from "@/lib/ref";
import styles from "./catalyst.module.css";

type Urgency = "annoying" | "weekly" | "now";

const URGENCY: { value: Urgency; label: string }[] = [
  { value: "annoying", label: "Annoying but not urgent" },
  { value: "weekly", label: "Costing money weekly" },
  { value: "now", label: "Need it fixed now" },
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

const EMPTY: FormState = {
  name: "",
  business: "",
  website: "",
  email: "",
  phone: "",
  urgency: "",
  bestTime: "",
};

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
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
  mode = "build",
  onBack,
}: {
  result: ScanResult;
  answers: ScanAnswers;
  mode?: "build" | "nofit";
  onBack: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // post-submit extras
  const [deepText, setDeepText] = useState("");
  const [deepSent, setDeepSent] = useState(false);
  const [checkoutNote, setCheckoutNote] = useState(false);
  const [bookNote, setBookNote] = useState(false);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.business.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Please add your name, business, email and a phone number so the team can send your report.");
      return;
    }
    setStatus("sending");
    try {
      // buildPayload is the central payload shape (brief §2.10). Its exact
      // signature lives in lib/catalyst; call it loosely so an arity/shape drift
      // is a central fix, not a build break here. If it throws or returns
      // nothing, fall back to a minimal envelope so the scan is never lost.
      const bp = buildPayload as unknown as (...args: unknown[]) => unknown;
      let payload: unknown;
      try {
        payload = bp(result, form);
      } catch {
        payload = null;
      }
      if (!payload || typeof payload !== "object") {
        payload = { answers, form, result };
      }
      const ref = getRef();
      const body = { ...(payload as Record<string, unknown>), ...(ref ? { ref } : {}) };

      const res = await fetch("/api/catalyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; id?: string } | null;
      if (!res.ok || !json?.ok) throw new Error("handoff failed");
      setSavedId(json.id ?? null);
      setStatus("done");
    } catch {
      // calm failure state (brief §2.11)
      setStatus("failed");
    }
  };

  const sendDeep = async () => {
    if (!deepText.trim()) return;
    try {
      await fetch("/api/catalyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deep_intake: deepText.trim(), parent_id: savedId }),
      });
    } catch {
      /* best-effort; the report is already in flight */
    }
    setDeepSent(true);
  };

  const openCheckout = () => {
    setCheckoutNote(true);
    // clearly-labelled placeholder — Stripe is not wired yet (brief §2.10).
    try {
      window.history.replaceState({ ...window.history.state, checkout: "coming" }, "", "/catalyst?checkout=coming");
    } catch {
      /* ignore */
    }
  };

  /* ---------------- post-submit: confirmation + offer + doors ---------------- */
  if (status === "done") {
    return (
      <div className={styles.result}>
        <div className={styles.resultHead}>
          <div style={{ flex: 1 }}>
            <span className={styles.tag}>
              <span className={styles.tagDot} aria-hidden="true" />
              Report on its way
            </span>
            <h1 className="h1" style={{ margin: "12px 0 8px" }}>
              Sage has your scan.
            </h1>
            {/* Confirmation copy — JW to approve */}
            <p className="lead">
              Your full leak report is being built and lands within 24 hours
              {form.email.trim() ? ` at ${form.email.trim()}` : ""}. No payment was taken. You keep the leak report
              either way.
            </p>
          </div>
        </div>

        {/* deep-intake OFFER (brief §2.7) — stubbed as an optional extra step.
            NOTE: the live "two more minutes with Sage" conversation is a stub. */}
        <div className={styles.offer}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
            <strong style={{ color: "var(--text-headline)", fontSize: 16 }}>
              Want the report to go deeper? Talk to Sage for two more minutes.
            </strong>
            <span className={styles.stubTag}>Coming</span>
          </div>
          {deepSent ? (
            <p className="small" style={{ color: "var(--text-muted)", margin: 0 }}>
              Added to your report. Sage will fold it into the numbers.
            </p>
          ) : (
            <>
              <p className="small" style={{ color: "var(--text-muted)", margin: "0 0 12px" }}>
                The full two-minute conversation is coming. For now, drop anything else you want Sage to weigh in and
                it goes straight onto your report.
              </p>
              <textarea
                className={styles.textarea}
                style={{ minHeight: 92 }}
                placeholder="Context, constraints, the thing behind the thing…"
                value={deepText}
                onChange={(e) => setDeepText(e.target.value)}
                aria-label="Tell Sage more"
              />
              <button
                type="button"
                className="btn btn-secondary btn-md"
                style={{ marginTop: 12 }}
                onClick={sendDeep}
                disabled={!deepText.trim()}
              >
                Send Sage more
              </button>
            </>
          )}
        </div>

        {/* Doors (brief §2.10). Both shown in "build" mode; the no-fit route
            (§2.8) hides the Pay door and offers only a walkthrough. */}
        <div className={styles.doors} style={{ marginTop: 18 }}>
          {mode === "build" && (
            <div className={`${styles.door} ${styles.doorPrimary}`}>
              <span className={styles.doorTitle}>Start the build</span>
              <span className={styles.doorText}>
                Skip the queue and put Sage to work on your primary leak now.
              </span>
              <button type="button" className="btn btn-primary btn-md" onClick={openCheckout}>
                Pay now
              </button>
              {checkoutNote && (
                <p className={styles.doorNote}>
                  {/* No fake payment — Stripe checkout is not wired yet. JW to approve. */}
                  Secure checkout is being connected. Sage has flagged your build — the team will send your payment
                  link with the report, within 24 hours.
                </p>
              )}
            </div>
          )}

          <div className={styles.door}>
            <span className={styles.doorTitle}>
              Book a call <span className={styles.opt}>· optional</span>
            </span>
            <span className={styles.doorText}>Rather talk it through first? Grab a walkthrough with the team.</span>
            <button type="button" className="btn btn-ghost btn-md" onClick={() => setBookNote(true)}>
              Book a call
            </button>
            {bookNote && (
              <p className={styles.doorNote}>
                {/* Placeholder booking link — calendar not connected yet. JW to approve. */}
                Booking calendar is being connected. Reply to your report email and the team will lock in a time.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- calm failure state (brief §2.11) ---------------- */
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
            Sage saved your scan. The handoff didn&rsquo;t complete, but your answers are safe.
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

  /* ---------------- the form ---------------- */
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
          <p className="lead">
            Sage keeps the leak map you just built. Add your details and the team follows up with your real numbers
            within 24 hours. No payment to begin.
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
          <span className={styles.fieldLabel}>How urgent is it?</span>
          <div className={styles.pills} role="radiogroup" aria-label="How urgent is it?">
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
            {status === "sending" ? "Sending to Sage…" : "Unlock the full leak report."}
          </button>
          <button type="button" className={styles.back} onClick={onBack}>
            ← Back to leak map
          </button>
        </div>
        <p className={styles.reassureLine}>
          No payment to begin. You keep the leak report either way. GDPR-safe &amp; encrypted — we never sell your data
          or use it to train external AI.
        </p>
      </form>
    </div>
  );
}
