import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "swell-lead";

export function proxy(request: NextRequest) {
  const hasLead = request.cookies.has(COOKIE_NAME);
  if (!hasLead) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/studio/:path*"],
};
