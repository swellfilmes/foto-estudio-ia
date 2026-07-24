import { NextRequest, NextResponse } from "next/server";

const MAGNIFIC_URL = "https://api.magnific.com/v1/ai/text-to-image/nano-banana-pro-flash";

// Aspect ratio por tipo de foto de PRODUTO (modo Produto).
// Ensaio passa aspectRatio direto no body.
const PRODUCT_ASPECT_RATIO_MAP: Record<string, string> = {
  "fundo-limpo": "1:1",
  lifestyle: "4:5",
  segurando: "2:3",
  "flat-lay": "1:1",
  macro: "1:1",
  "ghost-mannequin": "2:3",
};

export async function POST(req: NextRequest) {
  const key = process.env.MAGNIFIC_API_KEY;
  if (!key) return NextResponse.json({ error: "API key do Magnific não configurada" }, { status: 500 });

  try {
    const {
      prompt,
      referenceImageBase64,
      referenceImagesBase64,     // produto e ensaio podem ter mais de 1 referência
      photoType = "fundo-limpo", // modo produto (fallback)
      aspectRatio: aspectOverride, // ensaio passa direto
      negativePrompt,
      styleStrength,
      referenceText,             // customiza a mensagem da referência ("keep the person...")
    } = await req.json();

    if (!prompt) return NextResponse.json({ error: "Prompt obrigatório" }, { status: 400 });

    const aspectRatio = aspectOverride || PRODUCT_ASPECT_RATIO_MAP[photoType] || "1:1";

    const body: Record<string, unknown> = {
      prompt,
      aspect_ratio: aspectRatio,
      resolution: "1K",
    };

    if (negativePrompt && typeof negativePrompt === "string" && negativePrompt.trim()) {
      body.negative_prompt = negativePrompt.trim();
    }
    if (typeof styleStrength === "number" && styleStrength >= 0 && styleStrength <= 100) {
      body.style_strength = styleStrength;
    }

    // Suporta 1 ou N referências (produto e ensaio mandam array; 1 foto = retrocompatível)
    const refs: string[] = Array.isArray(referenceImagesBase64) && referenceImagesBase64.length
      ? referenceImagesBase64
      : referenceImageBase64
        ? [referenceImageBase64]
        : [];

    if (refs.length > 0) {
      body.reference_images = refs.map((b64: string, i: number) => ({
        image: `data:image/jpeg;base64,${b64}`,
        text: referenceText || (i === 0
          ? "Reference product image — keep this product exactly as shown"
          : "Additional angle of the same product — same shape, color, label and materials"),
        mime_type: "image/jpeg",
      }));
    }

    const res = await fetch(MAGNIFIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-magnific-api-key": key,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Magnific error:", data);
      return NextResponse.json({ error: data?.message || "Erro no Magnific" }, { status: res.status });
    }

    const taskId = data?.data?.task_id || data?.task_id;
    return NextResponse.json({ task_id: taskId, raw: data });
  } catch (error) {
    console.error("Erro generate-images:", error);
    return NextResponse.json({ error: "Erro ao gerar imagens" }, { status: 500 });
  }
}
