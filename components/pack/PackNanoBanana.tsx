"use client";

import { PROMPTS } from "@/lib/pack-prompts";
import { CalloutBox, PackHeader, SectionHeading, SubHeading, P, Checklist, Toggle } from "./PackUI";
import { PromptCard } from "./PromptCard";

export function PackNanoBanana() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 20px 120px" }}>
      <PackHeader
        label="Swell Filmes · Pack Nano Banana"
        title="Foto Estúdio IA — Nano Banana"
        subtitle="Fidelidade cirúrgica de rótulo, cor e detalhes. Foto de estúdio com o produto exato — via Magnific / Nano Banana."
      />

      {/* Comece aqui */}
      <CalloutBox variant="orange" title="Comece aqui — leia antes de usar">
        <strong>Antes de qualquer geração, faça 3 coisas:</strong>
        <ol style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Cheque seu saldo no Magnific (nada pior que quebrar no meio de uma sessão)</li>
          <li>Passe a foto do seu produto pelo checklist de pré-checagem</li>
          <li>Se seu produto tem rótulo crítico, use o <strong>Pipeline de Fidelidade</strong> (mais abaixo)</li>
        </ol>
      </CalloutBox>

      {/* Pré-checagem */}
      <SectionHeading>Pré-checagem da foto</SectionHeading>
      <P>A qualidade da referência determina a qualidade do resultado. Passe sua foto por este checklist antes de gastar crédito.</P>
      <Checklist items={[
        "O produto aparece inteiro na foto (sem cortes)?",
        "A foto está em foco? O rótulo/estampa precisa ser legível.",
        "Tem luz suficiente? Não pode estar escura ou contra a luz.",
        "O produto está sozinho ou quase só no quadro?",
        "Consegue ver claramente a cor real do produto?",
      ]} />

      <CalloutBox variant="blue" title="Regra de ouro do NB">
        A melhor foto de entrada é a mais simples possível: produto inteiro, em foco, com luz natural. Não precisa ser bonita — precisa ser clara.
      </CalloutBox>

      {/* Regra de ouro */}
      <SectionHeading>A regra de ouro</SectionHeading>
      <CalloutBox variant="blue" title="A frase que carrega tudo">
        <strong>Ancora no produto real → ancora no mundo real ao redor → trava o que não pode mudar → especifica com medida física, nunca com adjetivo.</strong>
      </CalloutBox>
      <P>A diferença entre &quot;cara de IA&quot; e foto de estúdio está quase toda em: (1) especificidade do mundo ao redor e (2) medida física no lugar de adjetivo.</P>

      {/* Trava */}
      <SectionHeading>A trava — como proteger seu produto</SectionHeading>
      <P>Todo prompt do pack começa com uma instrução de preservação. A imagem que você sobe é a referência principal — o texto reforça o que não pode mudar. Essa linha já vem dentro de todos os prompts.</P>

      <CalloutBox variant="green" title="A trava base (já embutida em todos os prompts)">
        <code style={{ fontFamily: "monospace", fontSize: 12 }}>
          Follow the reference image closely and keep the product EXACTLY as shown — same shape, color, label/print/logo, material, finish and proportions. Do not recreate, recolor or restyle it; only build the scene around it.
        </code>
      </CalloutBox>

      {/* Os 6 prompts */}
      <SectionHeading>Os 6 tipos de foto</SectionHeading>
      <P>Cada um dos 6 tipos é uma seção. Abra o tipo de foto que quer gerar, copie o prompt em inglês e cole no Magnific junto com a foto de referência. Cada tipo indica se o modelo recomendado é <strong>Pro</strong> ou <strong>Flash</strong>.</P>

      <div style={{ marginTop: 16, borderBottom: "1px solid var(--border)" }}>
        {PROMPTS.map((p) => (
          <PromptCard key={p.id} prompt={p} tool="nb" />
        ))}
      </div>

      {/* Como usar Magnific */}
      <SectionHeading>Como usar no Magnific — passo a passo</SectionHeading>

      <SubHeading>Passo 1 — Acesse magnific.ai e vá em Generate → Image Generation</SubHeading>

      <SubHeading>Passo 2 — Escolha o modelo Nano Banana correto</SubHeading>
      <Checklist items={[
        "Nano Banana 2 Flash — para lifestyle, cena, stories (mais barato e rápido)",
        "Nano Banana Pro — para produto herói, rótulo crítico, fundo limpo (mais caro e mais fiel)",
      ]} />
      <P>Não use Pro &quot;por garantia&quot; em tudo — é onde o crédito vai mais rápido.</P>

      <SubHeading>Passo 3 — Suba a foto do produto como referência</SubHeading>
      <P>Clique em &quot;Add reference image&quot; ou arraste a foto. A referência é o que instrui o modelo sobre o produto real.</P>

      <SubHeading>Passo 4 — Preencha os slots do prompt e cole no campo de texto</SubHeading>

      <SubHeading>Passo 5 — Configure a geração</SubHeading>
      <Checklist items={[
        "Count: comece com 1. Só aumente para 2–4 depois de validar.",
        "Aspect ratio: escolha o formato (tabela abaixo).",
        "Seed: aleatório na primeira tentativa.",
      ]} />

      <SubHeading>Passo 6 — Gere e avalie</SubHeading>
      <P>NB2 Flash: ~30–35s · Pro: ~45–55s. Avalie antes de gerar mais.</P>

      <SubHeading>Formatos por uso</SubHeading>
      <div style={{ overflow: "auto", margin: "12px 0", border: "1px solid var(--border)", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              <th style={{ padding: 10, textAlign: "left", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Uso</th>
              <th style={{ padding: 10, textAlign: "left", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Ratio</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["E-commerce (Shopee, ML)", "1:1"],
              ["Feed Instagram foto", "4:5"],
              ["Stories / Reels", "9:16"],
              ["Banner horizontal", "16:9"],
              ["Foto produto isolado", "3:4"],
            ].map(([u, r]) => (
              <tr key={u} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: 10 }}>{u}</td>
                <td style={{ padding: 10, fontFamily: "monospace", color: "var(--accent)" }}>{r}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Escolha de modelo */}
      <SectionHeading>Escolha do modelo — Pro vs Flash</SectionHeading>

      <CalloutBox variant="blue" title="Regra simples">
        <strong>Produto é o foco e rótulo importa → Pro.</strong><br />
        <strong>Cena e atmosfera importam mais que o rótulo → NB2 Flash.</strong>
      </CalloutBox>

      <SubHeading>Por tipo de foto</SubHeading>
      <div style={{ overflow: "auto", margin: "12px 0", border: "1px solid var(--border)", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--surface2)" }}>
              <th style={{ padding: 10, textAlign: "left", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Tipo</th>
              <th style={{ padding: 10, textAlign: "left", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Modelo</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["01 · Fundo limpo", "Pro"],
              ["02 · Lifestyle", "NB2 Flash"],
              ["03 · Segurando (mão)", "NB2 Flash"],
              ["03 · Vestindo (roupa)", "Pro se cor/estampa crítica · Flash se lifestyle"],
              ["04 · Flat lay", "Pro"],
              ["05 · Macro / Detalhe", "Pro"],
              ["06 · Ghost mannequin", "Pro"],
            ].map(([t, m]) => (
              <tr key={t} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: 10 }}>{t}</td>
                <td style={{ padding: 10, color: "var(--accent)", fontWeight: 600 }}>{m}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Disciplina de crédito */}
      <SectionHeading>Disciplina de crédito — não desperdice</SectionHeading>
      <P>Crédito gasto à toa é o maior inimigo de quem usa o NB com frequência. Estas regras eliminam desperdício sem limitar o resultado.</P>

      <SubHeading>Regra 1 — Valide 1 antes de gerar em lote</SubHeading>
      <P>Nunca comece com count=4. Comece com count=1. Veja o resultado. Se estiver bom, aumenta. Se não, ajustou o prompt sem gastar 4× no prompt errado.</P>

      <SubHeading>Regra 2 — Formato é recorte, não nova geração</SubHeading>
      <P>Gerou boa em 4:5 e precisa em 9:16? <strong>Não gere de novo.</strong> Recorte. Crédito zero.</P>

      <SubHeading>Regra 3 — Explore no modo Unlimited (grátis) antes de gerar</SubHeading>
      <P>O Magnific tem um modo relaxado que não debita crédito. Use para testar prompts, cenas e composição. Quando achar o certo, gere com crédito.</P>

      <SubHeading>Regra 4 — Estimativa de sessão eficiente</SubHeading>
      <Checklist items={[
        "1 packshot/flat-lay validação → Pro × 1–2 imagens",
        "1 lifestyle variação → Flash × 1 (valida) + × 2 (entrega)",
        "1 lifestyle variação 2 → Flash × 1 + × 2",
        "1 macro/ghost (se aplicável) → Pro × 1–2",
        "Total típico: 8–12 gerações por produto completo",
      ]} />

      <CalloutBox variant="red" title="O que nunca fazer">
        Gerar count=4 sem validar count=1 antes. Usar Pro pra lifestyle quando Flash basta. Regerar só pra mudar formato (recorte é grátis). Rodar lote sem checar saldo.
      </CalloutBox>

      {/* Pipeline de fidelidade */}
      <SectionHeading>Pipeline de Fidelidade — o diferencial do NB</SectionHeading>
      <P>Quando o rótulo ou a cor exata não podem ser alterados, este pipeline garante fidelidade máxima em cenas complexas.</P>

      <CalloutBox variant="blue" title="Por que isso funciona">
        Em cenas com muitos elementos, a atenção do modelo se divide. O rótulo pode sair ligeiramente diferente — não porque errou, mas porque tinha &quot;concorrência visual&quot;. O pipeline resolve isso em duas etapas.
      </CalloutBox>

      <SubHeading>Etapa 1 — Gere o packshot / flat-lay</SubHeading>
      <P>Use Prompt 01 (Fundo limpo) ou Prompt 04 (Flat lay) com modelo <strong>Pro</strong>, count=1, fundo neutro, sem props.</P>
      <P>Valide antes de continuar:</P>
      <Checklist items={[
        "Forma correta?",
        "Cor fiel?",
        "Rótulo legível e correto?",
        "Textura crível?",
      ]} />

      <SubHeading>Etapa 2 — Salve a imagem gerada como nova referência</SubHeading>
      <P>Baixe a imagem. Ela agora é a sua <strong>nova referência de produto</strong> — mais eficiente que a foto de celular original porque já está no &quot;vocabulário visual&quot; do modelo.</P>

      <SubHeading>Etapa 3 — Gere as cenas usando essa referência</SubHeading>
      <P>Para cada cena lifestyle: suba a imagem da Etapa 1 como referência (no lugar da foto de celular). Use os prompts 02, 03 ou 04 normalmente. Modelo NB2 Flash pra lifestyle, Pro se rótulo continuar crítico.</P>

      <CalloutBox variant="green" title="Quando usar o pipeline vs ir direto pra cena">
        <strong>Use o pipeline quando:</strong> rótulo com texto legível, cor de marca específica, 5+ imagens do mesmo produto que precisam ser consistentes, produto pra e-commerce oficial.<br /><br />
        <strong>Vá direto pra cena quando:</strong> produto sem rótulo ou estampa simples, exploração inicial, foco é atmosfera e não o produto.
      </CalloutBox>

      {/* FAQ */}
      <SectionHeading>Dúvidas frequentes</SectionHeading>

      <div style={{ borderTop: "1px solid var(--border)" }}>
        <Toggle label="O que é o Nano Banana?">
          <P>Modelo de geração de imagem do Google (Imagen), acessado via plataforma Magnific. Tem fidelidade superior ao ChatGPT para preservação de rótulo, cor e detalhes.</P>
        </Toggle>
        <Toggle label="Precisa de conta no Magnific?">
          <P>Sim. O Magnific tem plano pago. O pack inclui guia de quanto crédito você precisa por sessão e como não gastar à toa.</P>
        </Toggle>
        <Toggle label="Qual o custo dos créditos?">
          <P>Varia pelo plano do Magnific. Para uma sessão completa de um produto (packshot + 3 lifestyles), o custo típico é 8–12 gerações.</P>
        </Toggle>
        <Toggle label="O rótulo vai sair perfeito?">
          <P>O NB preserva rótulo, texto e cor com fidelidade consideravelmente superior ao ChatGPT. Para rótulos com texto, o pipeline packshot-primeiro aumenta ainda mais a fidelidade. Não existe garantia de 100% em nenhuma IA — mas é o melhor disponível sem fotógrafo.</P>
        </Toggle>
        <Toggle label="Qual a diferença para o Pack ChatGPT?">
          <P>O ChatGPT cria cenas excelentes ao redor do produto, mas pode recriar o rótulo. O NB lê a referência visual com mais fidelidade e mantém o produto mais próximo do original. Para produto com identidade visual definida, o NB é a escolha certa.</P>
        </Toggle>
        <Toggle label="Funciona para qualquer produto?">
          <P>Sim. Mesmos 6 tipos de foto do Pack ChatGPT — os prompts são iguais, só a ferramenta muda.</P>
        </Toggle>
        <Toggle label="Posso usar os dois packs juntos?">
          <P>Sim, e faz muito sentido. ChatGPT para explorar conceitos rápido. NB para as fotos finais onde o produto precisa estar perfeito.</P>
        </Toggle>
        <Toggle label="Tem garantia?">
          <P>Sim, 7 dias. Se seguiu o passo a passo e o resultado não ficou satisfatório, devolvemos o valor.</P>
        </Toggle>
        <div style={{ borderBottom: "1px solid var(--border)" }} />
      </div>

      {/* Serviço */}
      <SectionHeading>Prefere que a gente faça pra você?</SectionHeading>
      <CalloutBox variant="orange" title="Serviço de foto de estúdio IA — sob demanda">
        Se o volume de fotos é grande, se o pack não cabe no seu tempo, ou se você quer garantia de curadoria humana em cada imagem: a gente executa. Você manda o produto e a briefing, entregamos o pack de fotos pronto.
        <div style={{ marginTop: 12 }}>
          <a
            href="mailto:contato@swellfilmes.com.br?subject=Quero%20contratar%20o%20servi%C3%A7o%20de%20foto%20IA"
            style={{ display: "inline-block", background: "var(--accent)", color: "#fff", padding: "10px 18px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14 }}
          >
            Falar com a equipe →
          </a>
        </div>
      </CalloutBox>

      {/* Rodapé */}
      <div style={{ marginTop: 60, paddingTop: 30, borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
        Feito por Swell Filmes · <a href="mailto:contato@swellfilmes.com.br" style={{ color: "var(--text-muted)" }}>contato@swellfilmes.com.br</a><br />
        Pack Foto Estúdio IA — Nano Banana · versão 1.0
      </div>
    </div>
  );
}
