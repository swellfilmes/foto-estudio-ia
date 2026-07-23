import { NextRequest, NextResponse } from "next/server";
import { PACK_PASSWORDS, PackSlug } from "@/lib/pack-prompts";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") as PackSlug | null;
  if (!slug || !(slug in PACK_PASSWORDS)) {
    return NextResponse.json({ authed: false });
  }
  const has = req.cookies.has(`swell-pack-${slug}`);
  return NextResponse.json({ authed: has });
}
