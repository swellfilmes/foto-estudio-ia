import { NextRequest, NextResponse } from "next/server";

// Baixa a imagem no servidor e devolve com Content-Disposition: attachment, forçando
// o download instantâneo com nome limpo (o atributo `download` do <a> é ignorado
// em URLs de outro domínio — por isso o proxy). Restringe os hosts (anti-SSRF).
const ALLOWED = [
  /\.blob\.vercel-storage\.com$/i,
  /(^|\.)freepik\.com$/i,
  /(^|\.)magnific\.com$/i,
  /(^|\.)picsum\.photos$/i,
];

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  const rawName = req.nextUrl.searchParams.get("name") || "foto.jpg";
  const name = rawName.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 60) || "foto.jpg";

  if (!u) return NextResponse.json({ error: "sem url" }, { status: 400 });
  let host: string;
  try {
    host = new URL(u).hostname;
  } catch {
    return NextResponse.json({ error: "url inválida" }, { status: 400 });
  }
  if (!ALLOWED.some((re) => re.test(host))) {
    return NextResponse.json({ error: "host não permitido" }, { status: 403 });
  }

  try {
    const resp = await fetch(u);
    if (!resp.ok) return NextResponse.json({ error: "imagem indisponível" }, { status: 502 });
    const buf = await resp.arrayBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": resp.headers.get("content-type") || "image/jpeg",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "private, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ error: "falha ao baixar" }, { status: 502 });
  }
}
