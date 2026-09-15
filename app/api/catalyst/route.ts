import { NextResponse } from "next/server";

/**
 * POST /api/catalyst — the SAME-ORIGIN FALLBACK capture point for the scan.
 *
 * The browser client (lib/catalyst-api.ts) calls the backend contract endpoint
 * `POST {NEXT_PUBLIC_SAGE_API_BASE}/catalyst/unlock` directly. This route is the
 * redundant net beneath it: when the browser call fails (a blocked request, a
 * dropped connection, a timeout), the client falls back here and this route
 * sends the same payload to `/catalyst/unlock` server-side, returning the
 * backend's session id as { ok, id }.
 *
 * When the backend is configured but does not accept the lead, this answers 503
 * so the client keeps the payload locally and retries. It never reports a lead
 * as captured that the backend does not hold. Only with no base configured (a
 * preview build) does it mint a local id, so the flow can be clicked through.
 *
 * NOTE on lib/sage.ts: its startSession() is a rigid StartRequest client
 * (extra="forbid", requires sector/location) that the Catalyst payload does not
 * match, so we do NOT call it here — the visitor's `ref` rides on the body
 * instead, ready for the Python service to attribute.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE = (process.env.SAGE_API_BASE ?? process.env.NEXT_PUBLIC_SAGE_API_BASE ?? "").replace(/\/+$/, "");
const FORWARD_ATTEMPTS = 2;
const FORWARD_TIMEOUT_MS = 8000;

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

  if (!API_BASE || isDeepIntake) {
    return NextResponse.json({ ok: true, id: makeId() });
  }

  const forwarded = await forwardUnlock(payload, req);
  if (!forwarded) {
    return NextResponse.json({ ok: false, error: "backend_unavailable" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, id: forwarded });
}

/** POST the payload to the backend's unlock endpoint. Returns its session id, or
 *  null when the backend did not accept the lead. */
async function forwardUnlock(payload: Record<string, unknown>, req: Request): Promise<string | null> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const visitor = req.headers.get("x-forwarded-for");
  if (visitor) headers["X-Forwarded-For"] = visitor;

  for (let attempt = 0; attempt < FORWARD_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/catalyst/unlock`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS),
      });
      if (res.ok) {
        const json = (await res.json().catch(() => null)) as { ok?: boolean; session_id?: string } | null;
        if (json?.ok && typeof json.session_id === "string" && json.session_id) return json.session_id;
        return null;
      }
      // 4xx is a payload the backend rejects; repeating it cannot succeed.
      if (res.status < 500) return null;
    } catch {
      // Timeout or network failure: try again below.
    }
  }
  return null;
}
