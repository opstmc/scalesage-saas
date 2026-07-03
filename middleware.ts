import { NextResponse, type NextRequest } from "next/server";

// Partner referral capture.
// When a visitor arrives via a partner link (…/?ref=CODE), persist the code as a
// first-party cookie so any later conversion (the Catalyst diagnostic → POST
// /sage/session/start with { ref }) is attributed to the referring partner.
// First-touch: the ORIGINAL referrer is kept across later visits (only set when
// no ss_ref cookie exists yet). Flip the guard to always-set for last-touch.
export function middleware(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref || request.cookies.get("ss_ref")) return NextResponse.next();

  const res = NextResponse.next();
  res.cookies.set("ss_ref", ref.slice(0, 64), {
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
    sameSite: "lax",
    httpOnly: false, // the client fetch must read it to forward on conversion
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

// Run on page routes only, never static assets.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|backgrounds).*)"],
};
