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
      max_tokens: 700,
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
              text: `Analise a pessoa nesta foto e retorne APENAS um JSON com traços GERAIS (nunca detalhes específicos do rosto — a IA vai preservar o rosto pela referência visual, este JSON é só pra descrição de contexto):

{
  "genderPresentation": "masculino / feminino / neutro / não é possível determinar",
  "ageRange": "faixa etária aparente, ex: 'jovem adulto (20-30)' ou 'adulto (35-50)'",
  "skinTone": "tom de pele — descrição neutra, ex: 'pele clara', 'pele parda', 'pele preta retinta', 'pele oliva'",
  "hairColor": "cor do cabelo",
  "hairTexture": "textura/tipo do cabelo, ex: 'liso longo', 'cacheado ombro', 'crespo curto', 'ondulado médio'",
  "build": "porte físico geral, ex: 'esbelta', 'atlético', 'médio', 'estatura alta'",
  "distinguishingContext": "elementos de contexto que aparecem — óculos, tatuagens visíveis, piercings, barba, etc — SEM descrever traços faciais únicos"
}

IMPORTANTE:
- NUNCA descrever formato de olho, formato de nariz, formato de boca, mandíbula, testa — deixe a IA preservar isso pela referência visual.
- Traços gerais (gênero aparente, faixa etária, cor de pele/cabelo) são úteis pra passagem de contexto.
- Se não conseguir determinar algo, retorne string vazia.

Retorne APENAS o JSON, sem texto adicional.`,
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
    console.error("Erro ao analisar pessoa:", error);
    return NextResponse.json({ error: "Erro ao analisar a imagem" }, { status: 500 });
  }
}
