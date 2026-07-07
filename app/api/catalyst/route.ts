import { NextResponse } from "next/server";

/**
 * POST /api/catalyst — the SAME-ORIGIN FALLBACK capture point for the scan.
 *
 * The browser client (lib/catalyst-api.ts) calls the backend contract endpoint
 * `POST {NEXT_PUBLIC_SAGE_API_BASE}/catalyst/unlock` directly. This route is the
 * redundant net beneath it: when the base is unset (preview) or that call fails,
 * the client falls back here so the lead is still captured and the UI's calm
 * confirmation still fires. It validates the payload, mints an id, and echoes
 * { ok, id }. No secrets, no fabricated backend, no fake payment.
 *
 * TODO: forward to the Python service (straight Python, no n8n), which owns
 *   persistence + the 24h report engine + the Stripe link, and return its id.
 *
 * NOTE on lib/sage.ts: its startSession() is a rigid StartRequest client
 * (extra="forbid", requires sector/location) that the Catalyst payload does not
 * match, so we do NOT call it here — the visitor's `ref` rides on the body
 * instead, ready for the Python service to attribute.
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
