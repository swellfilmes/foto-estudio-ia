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
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Analise este produto na foto e retorne APENAS um JSON com estas informações exatas:

{
  "category": "uma de: bebida | alimento | cosmetico | roupa | artesanal | acessorio | outro",
  "name": "descrição do produto em português, ex: 'garrafa de azeite 250ml, vidro verde escuro'",
  "color": "cor específica com tom exato, ex: 'verde oliva escuro quase preto' ou 'âmbar dourado translúcido'",
  "material": "material principal, ex: 'vidro fosco', 'algodão', 'cerâmica esmaltada'",
  "size": "tamanho estimado, ex: '250ml, cabe numa mão' ou '35cm de altura'",
  "hasLabel": true ou false,
  "labelText": "se tiver rótulo: o que está escrito ou desenhado nele, senão ''",
  "labelPosition": "se tiver rótulo: onde fica na embalagem, senão ''"
}

Seja extremamente específico nas cores — use tons reais, não genéricos. Se não conseguir ver algum detalhe com clareza, faça a melhor estimativa com base no que é visível. Retorne APENAS o JSON, sem texto adicional.`,
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
    console.error("Erro ao analisar imagem:", error);
    return NextResponse.json({ error: "Erro ao analisar a imagem" }, { status: 500 });
  }
}
