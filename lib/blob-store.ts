import { put } from "@vercel/blob";

// Baixa a imagem temporária (URL do Magnific expira em 24h) e sobe pro Vercel Blob,
// que é permanente. Retorna a URL nova. O Blob adiciona um sufixo aleatório sozinho.
export async function persistImage(url: string, styleHint: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`fetch da imagem falhou: ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const safe = (styleHint || "foto").replace(/[^a-z0-9-]/gi, "").slice(0, 24) || "foto";
  const blob = await put(`geracoes/${safe}.jpg`, buf, {
    access: "public",
    contentType: "image/jpeg",
    addRandomSuffix: true,
  });
  return blob.url;
}

// Sobe uma imagem que já está em base64 (as fotos-referência do produto vêm assim do
// navegador). Usado ao criar um Projeto pra guardar as referências pra sempre.
export async function persistBase64(base64: string, hint: string): Promise<string> {
  const buf = Buffer.from(base64, "base64");
  const safe = (hint || "produto").replace(/[^a-z0-9-]/gi, "").slice(0, 24) || "produto";
  const blob = await put(`projetos/${safe}.jpg`, buf, {
    access: "public",
    contentType: "image/jpeg",
    addRandomSuffix: true,
  });
  return blob.url;
}
