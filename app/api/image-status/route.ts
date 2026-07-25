import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const key = process.env.MAGNIFIC_API_KEY;
  if (!key) return NextResponse.json({ error: "API key não configurada" }, { status: 500 });

  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) return NextResponse.json({ error: "taskId obrigatório" }, { status: 400 });

  try {
    // Precisa casar com o modelo usado na geração (generate-images).
    const res = await fetch(
      `https://api.magnific.com/v1/ai/text-to-image/nano-banana-pro/${taskId}`,
      { headers: { "x-magnific-api-key": key } }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Magnific status error:", res.status, text);
      return NextResponse.json({ error: "Erro ao verificar status" }, { status: res.status });
    }

    const data = await res.json();
    // Normaliza: status e imagens podem estar em data.data ou no root
    const status = data?.data?.status || data?.status;
    const generated = data?.data?.generated || data?.generated || [];
    return NextResponse.json({ status, generated });
  } catch (error) {
    console.error("Erro image-status:", error);
    return NextResponse.json({ error: "Erro de rede" }, { status: 500 });
  }
}
