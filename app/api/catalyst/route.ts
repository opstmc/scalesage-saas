import { NextResponse } from "next/server";

/**
 * POST /api/catalyst — the handoff point for the Catalyst mini-scan.
 *
 * This is the forwarding point to the Python service (brief §3). For now it
 * validates the payload, mints an id, and echoes { ok, id } so the UI's calm
 * confirmation / failure states work end-to-end. No secrets, no fabricated
 * backend, no fake payment.
 *
 * TODO: forward to Python service (straight Python, no n8n).
 *   The Python service owns scoring persistence + report generation + the
 *   Stripe checkout link. When wired, forward `body` (already validated) to it
 *   and return the id the service assigns instead of the local one.
 *
 * NOTE on lib/sage.ts: it exposes startSession(), but that is a browser client
 * (reads the ss_ref cookie via document.cookie) with a rigid StartRequest shape
 * (extra="forbid", requires sector/location). The Catalyst payload does not
 * match that contract, so we do NOT call it from here — the visitor's `ref` is
 * forwarded on the body instead, ready for the Python service to attribute.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeId(): string {
  try {
    return `cat_${crypto.randomUUID()}`;
  } catch {
    return `cat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  // A deep-intake follow-up (brief §2.7) carries no lead fields — accept it as
  // an append keyed to the original submission.
  const isDeepIntake = typeof payload.deep_intake === "string";

  if (!isDeepIntake) {
    // Minimal validation: the lead must be reachable. buildPayload() may nest
    // the contact fields under `form`/`lead`/`contact`, or place them at the
    // top level — accept any of those shapes.
    const contact =
      (payload.form as Record<string, unknown>) ??
      (payload.lead as Record<string, unknown>) ??
      (payload.contact as Record<string, unknown>) ??
      payload;
    const email = typeof contact.email === "string" ? contact.email.trim() : "";
    const name = typeof contact.name === "string" ? contact.name.trim() : "";
    if (!email || !name) {
      return NextResponse.json({ ok: false, error: "missing_contact" }, { status: 422 });
    }
  }

  const id = makeId();

  // TODO: forward to Python service (straight Python, no n8n) and await its id.

  return NextResponse.json({ ok: true, id });
}
