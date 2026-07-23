import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  ApparelInfo,
  ApparelSceneInfo,
  buildApparelSystemPrompt,
  buildApparelUserMessage,
  isCombinationRecommended,
} from "@/lib/apparel-engine";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { info, scene }: { info: ApparelInfo; scene: ApparelSceneInfo } = body;
    if (!info || !scene) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    if (!isCombinationRecommended(scene.category, scene.style)) {
      return NextResponse.json(
        {
          error: `Combinação não recomendada: "${scene.category}" com estilo "${scene.style}". Troque o estilo para "realista".`,
        },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1800,
      system: buildApparelSystemPrompt(),
      messages: [{ role: "user", content: buildApparelUserMessage(info, scene) }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const result = JSON.parse(jsonStr);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao gerar prompt apparel:", error);
    return NextResponse.json({ error: "Erro ao gerar prompt" }, { status: 500 });
  }
}
