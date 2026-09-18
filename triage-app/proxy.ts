import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_SESSION_COOKIE, getDemoPasscode, isSessionValid } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/gate") {
    return NextResponse.next();
  }

  // No passcode configured: the gate is disabled (documented in README).
  if (!getDemoPasscode()) {
    return NextResponse.next();
  }

  if (isSessionValid(request.cookies.get(DEMO_SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const gateUrl = new URL("/gate", request.url);
  gateUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(gateUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
