import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LEAD_COOKIE = "swell-lead";
const SUBSCRIBER_COOKIE = "swell-subscriber";

export function proxy(request: NextRequest) {
  // /studio libera pra quem tem qualquer um dos dois:
  //   - lead (teste grátis por e-mail)
  //   - subscriber (assinatura ativa)
  const hasLead = request.cookies.has(LEAD_COOKIE);
  const hasSubscriber = request.cookies.has(SUBSCRIBER_COOKIE);
  if (!hasLead && !hasSubscriber) {
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
