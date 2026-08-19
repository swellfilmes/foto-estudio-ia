import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/session";
import {
  createProject,
  listProjects,
  getProject,
  listProjectGenerations,
  renameProject,
} from "@/lib/db";
import { persistBase64 } from "@/lib/blob-store";

// Converte uma URL de imagem (Blob permanente) em base64, no servidor — evita CORS
// no navegador na hora de reabrir o projeto pra gerar mais.
async function urlToBase64(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer()).toString("base64");
  } catch {
    return null;
  }
}

// GET — sem ?id: lista os projetos do usuário. Com ?id: detalhe (refs em base64 + gerações).
export async function GET(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ email: null, projects: [] });

  const idParam = req.nextUrl.searchParams.get("id");
  try {
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isFinite(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 });
      const project = await getProject(id, email);
      if (!project) return NextResponse.json({ error: "projeto não encontrado" }, { status: 404 });

      const refUrls: string[] = Array.isArray(project.ref_images) ? project.ref_images : [];
      const refsBase64 = (await Promise.all(refUrls.map(urlToBase64))).filter(
        (b): b is string => typeof b === "string"
      );
      const generations = await listProjectGenerations(id, email);
      return NextResponse.json({ project, refUrls, refsBase64, generations });
    }

    const projects = await listProjects(email);
    return NextResponse.json({ email, projects });
  } catch (e) {
    console.error("[projects] GET falhou:", e);
    return NextResponse.json({ email, projects: [] });
  }
}

// POST — cria um projeto: sobe as fotos-referência (base64) pro Blob e grava a análise.
export async function POST(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "sem sessão" }, { status: 401 });
  try {
    const { name, category, color, material, size, refImagesBase64 } = await req.json();
    const refs: string[] = Array.isArray(refImagesBase64) ? refImagesBase64.slice(0, 6) : [];

    const hint = String(name || category || "produto");
    const refUrls: string[] = [];
    for (const b64 of refs) {
      try {
        refUrls.push(await persistBase64(String(b64), hint));
      } catch (e) {
        console.error("[projects] falha ao salvar referência:", e);
      }
    }

    const project = await createProject({
      email,
      name: name ? String(name) : null,
      category: category ? String(category) : null,
      color: color ? String(color) : null,
      material: material ? String(material) : null,
      size: size ? String(size) : null,
      refImages: refUrls,
    });
    return NextResponse.json({ project });
  } catch (e) {
    console.error("[projects] POST falhou:", e);
    return NextResponse.json({ error: "erro ao criar projeto" }, { status: 500 });
  }
}

// PATCH — renomeia o projeto (?id=123, body { name }).
export async function PATCH(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return NextResponse.json({ error: "sem sessão" }, { status: 401 });
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!Number.isFinite(id)) return NextResponse.json({ error: "id inválido" }, { status: 400 });
    const { name } = await req.json();
    const clean = String(name || "").trim().slice(0, 80);
    if (!clean) return NextResponse.json({ error: "nome vazio" }, { status: 400 });
    await renameProject(id, email, clean);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[projects] PATCH falhou:", e);
    return NextResponse.json({ error: "erro ao renomear" }, { status: 500 });
  }
}
