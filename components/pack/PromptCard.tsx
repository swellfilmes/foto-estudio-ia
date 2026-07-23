"use client";

import type { PromptDoc } from "@/lib/pack-prompts";
import { CopyPromptBlock, Toggle, SlotTable, CalloutBox, P, SubHeading } from "./PackUI";

export function PromptCard({ prompt, tool }: { prompt: PromptDoc; tool: "chatgpt" | "nb" }) {
  const model = tool === "chatgpt" ? prompt.recommendedModel.chatgpt : prompt.recommendedModel.nb;

  return (
    <div>
      <Toggle label={`${prompt.number} · ${prompt.title}`}>
        <div style={{ padding: "8px 0" }}>
          <SubHeading>Quando usar</SubHeading>
          <P>{prompt.when}</P>

          <SubHeading>Preencha estes slots</SubHeading>
          <SlotTable slots={prompt.slots} />

          <SubHeading>Prompt base (copie, substitua os slots)</SubHeading>
          <CopyPromptBlock prompt={prompt.promptEN} title="Prompt em inglês" />

          {prompt.filledExampleTitle && (
            <Toggle label="Ver exemplo já preenchido">
              <div style={{ padding: "8px 0" }}>
                <P><strong>Produto:</strong> {prompt.filledExampleTitle}</P>
                <CopyPromptBlock prompt={prompt.filledExample} title="Exemplo preenchido" />
              </div>
            </Toggle>
          )}

          <SubHeading>Erros comuns</SubHeading>
          {prompt.commonErrors.map((err, i) => (
            <CalloutBox key={i} variant="red" title={err.problem}>
              {err.fix}
            </CalloutBox>
          ))}

          <SubHeading>Ferramenta / modelo recomendado</SubHeading>
          <P>{model}</P>
        </div>
      </Toggle>
    </div>
  );
}
