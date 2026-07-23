import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Imagem não enviada" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 },
            },
            {
              type: "text",
              text: `Analise esta peça de roupa/produto vestível e retorne APENAS um JSON com estas informações extraídas da imagem:

{
  "garmentType": "tipo específico — ex: 'camiseta cropped babylook', 'moletom oversized com capuz', 'vestido midi de linho'",
  "fit": "corte + comprimento com MEDIDA quando aplicável — ex: 'cropped, barra ~10cm abaixo da axila' ou 'regular, comprimento no quadril'",
  "color": "cor principal com tom exato + hex aproximado — ex: 'off-white creme #F2ECE0' ou 'preto profundo #0A0A0A'",
  "fabric": "tecido/material aparente — ex: 'malha 100% algodão penteado', 'moletom felpa francesa', 'linho leve com trama visível'",
  "print": "descrição da estampa/print SE existir, incluindo posição e tamanho relativo — ex: 'estampa no peito ~12cm de largura, letras SWELL em preto' ou '' se não houver",
  "details": "elementos construtivos: ribana, gola, punho, botões, zíper, bolso, pespontos — ex: 'gola careca com ribana fina, punho reto sem elástico'",
  "blocks": "logos de TERCEIROS visíveis na foto (marcas alheias que a IA não pode reproduzir) — ex: 'logo Nike no lado esquerdo' ou '' se limpo",
  "notes": "qualquer detalhe crítico que a IA costuma errar — ex: 'estampa muito pequena pode não sair fiel'"
}

Seja EXTREMAMENTE específico em cor (hex aproximado sempre) e em comprimento (medida em cm quando visível). Se algo não for identificável, retorne string vazia — não invente. Retorne APENAS o JSON, sem texto adicional.`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const result = JSON.parse(jsonStr);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao analisar peça:", error);
    return NextResponse.json({ error: "Erro ao analisar a imagem" }, { status: 500 });
  }
}
