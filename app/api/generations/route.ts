import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import { listGenerations, saveGeneration } from "@/lib/db";
import { persistImage } from "@/lib/blob-store";

// GET — histórico da pessoa logada (por e-mail da sessão)
export async function GET(req: NextRequest) {
  const email = getSessionEmail(req);
  if (!email) return NextResponse.json({ email: null, generations: [] });
  try {
    const generations = await listGenerations(email);
    return NextResponse.json({ email, generations });
  } catch (e) {
    console.error("[generations] falha ao listar:", e);
    return NextResponse.json({ email, generations: [] });
  }
}

// POST — salva um lote gerado: baixa as imagens do Magnific → Blob permanente → banco
export async function POST(req: NextRequest) {
  const email = getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "sem sessão" }, { status: 401 });
  try {
    const { style, label, images, note } = await req.json();
    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "sem imagens" }, { status: 400 });
    }

    const permanent: string[] = [];
    let blobError: string | null = null;
    for (const url of images.slice(0, 6)) {
      try {
        permanent.push(await persistImage(String(url), style || "foto"));
      } catch (e) {
        // Se o Blob falhar, guarda a URL temporária (melhor que perder o registro)
        blobError = e instanceof Error ? e.message : String(e);
        console.error("[generations] Blob falhou, mantém URL temporária:", e);
        permanent.push(String(url));
      }
    }
    // Diagnóstico temporário: se veio ?debug=1, devolve o erro do Blob
    if (new URL(req.url).searchParams.get("debug") === "1") {
      return NextResponse.json({ blobError, saved: permanent[0], token: !!process.env.BLOB_READ_WRITE_TOKEN });
    }

    const generation = await saveGeneration({
      email,
      style: String(style || "foto"),
      label: label ? String(label) : null,
      images: permanent,
      note: note ? String(note) : null,
    });
    return NextResponse.json({ generation });
  } catch (e) {
    console.error("[generations] falha ao salvar:", e);
    return NextResponse.json({ error: "erro ao salvar" }, { status: 500 });
  }
}
