import { NextRequest, NextResponse } from "next/server";

const MAGNIFIC_URL = "https://api.magnific.com/v1/ai/text-to-image/nano-banana-pro-flash";

const ASPECT_RATIO_MAP: Record<string, string> = {
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
    const { prompt, referenceImageBase64, photoType = "fundo-limpo" } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt obrigatório" }, { status: 400 });

    const aspectRatio = ASPECT_RATIO_MAP[photoType] || "1:1";

    const body: Record<string, unknown> = {
      prompt,
      aspect_ratio: aspectRatio,
      resolution: "1K",
    };

    if (referenceImageBase64) {
      body.reference_images = [
        {
          image: `data:image/jpeg;base64,${referenceImageBase64}`,
          text: "Reference product image — keep this product exactly as shown",
          mime_type: "image/jpeg",
        },
      ];
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

    // Normaliza a resposta — suporta task_id no root ou dentro de data
    const taskId = data?.data?.task_id || data?.task_id;
    return NextResponse.json({ task_id: taskId, raw: data });
  } catch (error) {
    console.error("Erro generate-images:", error);
    return NextResponse.json({ error: "Erro ao gerar imagens" }, { status: 500 });
  }
}
