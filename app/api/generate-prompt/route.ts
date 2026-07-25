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
    // Formato por delimitadores (não JSON) porque o prompt tem aspas — JSON quebraria.
    if (basePrompt && clientRequest) {
      const refit = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: `Você recebe um PROMPT BASE de geração de imagem montado por blocos fixos, e um PEDIDO ESPECÍFICO DO CLIENTE. Sua tarefa: incorporar o pedido DE VERDADE no prompt (sujeito, enquadramento, cenário, cores, props), com prioridade máxima — se o pedido conflitar com o padrão da cena, o pedido VENCE.

REGRAS:
1. Estes trechos permanecem VERBATIM, sem alteração: a trava de produto ("Follow the reference images..."), a linha de cena nova ("IMPORTANT: build a COMPLETELY NEW environment..."), a linha de exclusões ("No third-party logos...") e o fecho ("A single full-frame photograph...").
2. NÃO parafraseie o que o pedido não afeta — altere só os trechos necessários.
3. Especifique com medida física, nunca adjetivo. Palavras proibidas: beautiful, stunning, perfect, vibrant, amazing, high quality, professional, 4k, 8k, aesthetic.
4. O pedido não pode quebrar a fidelidade do produto.
5. O prompt final deve ser CONCISO — no máximo ~180 palavras (limite rígido de 2000 caracteres). Corte redundância, não adicione floreio.

Responda EXATAMENTE neste formato, sem mais nada:
===PROMPT===
(o prompt completo ajustado, em inglês, em uma ou mais linhas)
===RESUMO===
(1-2 frases em português, direto ao cliente leigo, descrevendo a foto que será gerada e como o pedido dele foi atendido)`,
        messages: [{
          role: "user",
          content: `PROMPT BASE:\n${basePrompt}\n\nPEDIDO ESPECÍFICO DO CLIENTE:\n"${clientRequest}"`,
        }],
      });
      const rtext = refit.content[0].type === "text" ? refit.content[0].text : "";
      const pMatch = rtext.match(/===PROMPT===\s*([\s\S]*?)\s*===RESUMO===/);
      const sMatch = rtext.match(/===RESUMO===\s*([\s\S]*)$/);
      const promptEN = (pMatch ? pMatch[1] : "").trim().slice(0, 2900);
      const resumoPT = (sMatch ? sMatch[1] : "").trim();
      // Fallback: se o formato veio torto, usa o base + pedido colado (nunca quebra)
      if (!promptEN) {
        return NextResponse.json({
          promptEN: `${basePrompt} CLIENT REQUEST (top priority): ${clientRequest}.`.slice(0, 2900),
          resumoPT: `Vamos gerar com o seu pedido: ${clientRequest}.`,
        });
      }
      return NextResponse.json({ promptEN, resumoPT });
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
