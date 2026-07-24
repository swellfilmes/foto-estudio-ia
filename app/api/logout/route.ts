import { NextRequest, NextResponse } from "next/server";

// Sai da conta: apaga os cookies de sessão e volta pra landing.
export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.url));
  // cookie do login por assinatura (atual) + cookie do gate antigo (por garantia)
  for (const name of ["swell-subscriber", "swell-lead"]) {
    res.cookies.set({ name, value: "", path: "/", maxAge: 0 });
  }
  return res;
}
