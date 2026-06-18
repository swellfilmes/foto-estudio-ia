import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { ProductInfo, SceneInfo } from "@/lib/types";
import { buildSystemPrompt, buildUserMessage } from "@/lib/prompt-engine";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product, scene }: { product: ProductInfo; scene: SceneInfo } = body;

    if (!product || !scene) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: buildUserMessage(product, scene) }],
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
