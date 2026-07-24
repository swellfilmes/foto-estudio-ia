import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { ProductInfo, SceneInfo } from "@/lib/types";
import { buildSystemPrompt, buildUserMessage } from "@/lib/prompt-engine";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product, scene, clientRequest, basePrompt }: { product: ProductInfo; scene: SceneInfo; clientRequest?: string; basePrompt?: string } = body;

    // Modo refit: prompt-base montado por blocos verbatim + pedido do cliente.
    // O Claude só ajusta os trechos afetados — blocos fixos permanecem intactos.
    if (basePrompt && clientRequest) {
      const refit = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: `Você recebe um PROMPT BASE de geração de imagem montado por blocos fixos, e um PEDIDO ESPECÍFICO DO CLIENTE. Sua tarefa: incorporar o pedido DE VERDADE no prompt (sujeito, enquadramento, cenário, cores, props), com prioridade máxima — se o pedido conflitar com o padrão da cena, o pedido VENCE.

REGRAS:
1. Estes trechos devem permanecer VERBATIM, sem qualquer alteração: a trava de produto ("Follow the reference image closely..."), a linha de exclusões ("No third-party logos...") e o fecho ("A single full-frame photograph...").
2. NÃO parafraseie o que o pedido não afeta — altere só os trechos necessários.
3. Especifique com medida física, nunca adjetivo. Palavras proibidas: beautiful, stunning, perfect, vibrant, amazing, high quality, professional, 4k, 8k, aesthetic.
4. O pedido não pode quebrar a fidelidade do produto.

Retorne APENAS um JSON válido:
{"promptEN": "o prompt completo ajustado em inglês", "resumoPT": "1-2 frases em português, direto ao cliente leigo, descrevendo a foto que será gerada e como o pedido dele foi atendido"}`,
        messages: [{
          role: "user",
          content: `PROMPT BASE:\n${basePrompt}\n\nPEDIDO ESPECÍFICO DO CLIENTE:\n"${clientRequest}"`,
        }],
      });
      const rtext = refit.content[0].type === "text" ? refit.content[0].text : "";
      const rmatch = rtext.match(/```json\n?([\s\S]*?)\n?```/) || rtext.match(/(\{[\s\S]*\})/);
      const rresult = JSON.parse(rmatch ? rmatch[1] : rtext);
      return NextResponse.json(rresult);
    }

    if (!product || !scene) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: buildUserMessage(product, scene, clientRequest) }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response (may be wrapped in ```json blocks)
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao gerar prompt:", error);
    return NextResponse.json({ error: "Erro ao gerar prompt" }, { status: 500 });
  }
}
