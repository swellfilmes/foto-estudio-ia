import { NextRequest, NextResponse } from "next/server";

// Baixa a imagem no servidor e devolve com Content-Disposition: attachment, forçando
// o download instantâneo com nome limpo (o atributo `download` do <a> é ignorado
// em URLs de outro domínio — por isso o proxy).
//
// Segurança (anti-SSRF): em vez de uma allowlist de hosts (frágil — quebra o "Baixar"
// se o CDN do Magnific mudar), bloqueamos alvos INTERNOS (localhost, IPs privados,
// metadata da cloud) e liberamos qualquer host público em http/https. Assim o download
// funciona pra qualquer CDN de imagem, sem abrir porta pra rede interna.

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, ""); // tira colchetes de IPv6

  // Nomes locais
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) {
    return true;
  }

  // IPv6 loopback / link-local / unique-local
  if (h === "::1" || h === "::" ) return true;
  if (h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  // IPv4 mapeado em IPv6 (::ffff:10.0.0.1) — reduz ao IPv4 embutido
  const mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  const ipv4 = mapped ? mapped[1] : h;

  // IPv4 literal em faixa privada/reservada
  const m = ipv4.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 0 || a === 127) return true;                    // this-host / loopback
    if (a === 10) return true;                                // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true;         // 172.16.0.0/12
    if (a === 192 && b === 168) return true;                  // 192.168.0.0/16
    if (a === 169 && b === 254) return true;                  // link-local + metadata (169.254.169.254)
    if (a === 100 && b >= 64 && b <= 127) return true;        // CGNAT 100.64.0.0/10
    if (a >= 224) return true;                                // multicast / reservado
  }
  return false;
}

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  const rawName = req.nextUrl.searchParams.get("name") || "foto.jpg";
  const name = rawName.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 60) || "foto.jpg";

  if (!u) return NextResponse.json({ error: "sem url" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(u);
  } catch {
    return NextResponse.json({ error: "url inválida" }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "protocolo não permitido" }, { status: 403 });
  }
  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: "host não permitido" }, { status: 403 });
  }

  try {
    const resp = await fetch(parsed.toString());
    if (!resp.ok) return NextResponse.json({ error: "imagem indisponível" }, { status: 502 });

    // Só devolve se for realmente imagem — evita o proxy virar downloader genérico.
    const type = resp.headers.get("content-type") || "";
    if (!type.startsWith("image/")) {
      return NextResponse.json({ error: "conteúdo não é imagem" }, { status: 415 });
    }

    const buf = await resp.arrayBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": type || "image/jpeg",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "private, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ error: "falha ao baixar" }, { status: 502 });
  }
}
