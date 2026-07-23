import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  EnsaioStyleId,
  getStyle,
  buildEnsaioSystemPrompt,
  IDENTITY_LOCK,
  UNIVERSAL_ANTI,
  UNIVERSAL_NEGATIVE,
} from "@/lib/ensaio-styles";

const client = new Anthropic();

export interface PersonInfo {
  genderPresentation: string;
  ageRange: string;
  skinTone: string;
  hairColor: string;
  hairTexture: string;
  build: string;
  distinguishingContext: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const person: PersonInfo = body?.person || {};
    const styleId: EnsaioStyleId = body?.styleId;
    const customAdjustment: string = (body?.customAdjustment || "").trim();

    if (!styleId) {
      return NextResponse.json({ error: "Estilo obrigatório" }, { status: 400 });
    }

    let style;
    try {
      style = getStyle(styleId);
    } catch {
      return NextResponse.json({ error: "Estilo inválido" }, { status: 400 });
    }

    const userMessage = `Monte o prompt de UMA foto do ensaio com estes inputs.

PESSOA (traços gerais para contexto — NÃO descreva rosto em detalhes):
- Gênero aparente: ${person.genderPresentation || "(não determinado — deixe genérico)"}
- Faixa etária: ${person.ageRange || "(não determinada)"}
- Tom de pele: ${person.skinTone || "(preservar da referência)"}
- Cor do cabelo: ${person.hairColor || "(preservar da referência)"}
- Textura do cabelo: ${person.hairTexture || "(preservar da referência)"}
- Porte: ${person.build || "(preservar da referência)"}
- Contexto (óculos, tatuagens etc): ${person.distinguishingContext || "-"}

ESTILO DO CATÁLOGO: ${style.name}

BLOCO DE ESTILO (verbatim — copie exatamente, adaptando apenas placeholders entre colchetes):
${style.promptBlock}

AJUSTE PERSONALIZADO DO CLIENTE: ${customAdjustment || "(nenhum — use o estilo puro do catálogo)"}

TRAVA DE IDENTIDADE (item 1 — sempre primeiro, verbatim):
${IDENTITY_LOCK}

ANTI (item 5 — verbatim):
${UNIVERSAL_ANTI}

NEGATIVE base (para o campo negativeEN):
${UNIVERSAL_NEGATIVE}

Monte o JSON final agora. Não invente traços faciais. Integre o ajuste personalizado com naturalidade dentro do bloco de estilo (se o cliente disse "com óculos escuros", integre "wearing dark sunglasses" no ponto certo do bloco, não crie uma nova sentença solta).`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: buildEnsaioSystemPrompt(),
      messages: [{ role: "user", content: userMessage }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const result = JSON.parse(jsonStr);
    return NextResponse.json({ ...result, aspectRatio: style.aspectRatio });
  } catch (error) {
    console.error("Erro ao gerar prompt do ensaio:", error);
    return NextResponse.json({ error: "Erro ao gerar prompt" }, { status: 500 });
  }
}
