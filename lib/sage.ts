import { getRef } from "@/lib/ref";

// Base URL of the ScaleSage backend (e.g. https://api.scalesage.ai). Set
// NEXT_PUBLIC_SAGE_API_BASE in the site's environment.
const API_BASE = process.env.NEXT_PUBLIC_SAGE_API_BASE ?? "";

export type StartSessionInput = {
  name: string;
  company: string;
  sector: string; // map the journey's "industry" answer to this
  location: string;
  email?: string | null;
};

export type StartSessionResult = {
  session_id: string;
  first_question: string;
  context: string;
};

/**
 * Start a Catalyst diagnostic session on the backend, attributing it to the
 * referring partner captured from ?ref (via the ss_ref cookie). Call this at the
 * conversion point in the Catalyst journey once it collects name/company/etc.
 *
 * NOTE: the backend `StartRequest` is `extra="forbid"`, so the referral MUST be
 * sent under the exact key `ref` (omitted when absent). All of
 * name/company/sector/location are required and non-empty; the session_id it
 * returns is the capability token for the subsequent /message + /complete calls.
 */
export async function startSession(input: StartSessionInput): Promise<StartSessionResult> {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_SAGE_API_BASE is not configured");
  const ref = getRef();
  const res = await fetch(`${API_BASE.replace(/\/+$/, "")}/sage/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, ...(ref ? { ref } : {}) }),
  });
  if (!res.ok) throw new Error(`session/start failed: ${res.status}`);
  return res.json() as Promise<StartSessionResult>;
}
