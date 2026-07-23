"use client";

import { PROMPTS } from "@/lib/pack-prompts";
import { CalloutBox, PackHeader, SectionHeading, SubHeading, P, Checklist, Toggle } from "./PackUI";
import { PromptCard } from "./PromptCard";

export function PackChatGPT() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "40px 20px 120px" }}>
      <PackHeader
        label="Swell Filmes · Pack ChatGPT"
        title="Foto Estúdio IA — ChatGPT"
        subtitle="Foto do seu produto no celular → foto com cara de estúdio, em 30 segundos, no ChatGPT."
      />

      {/* Comece aqui */}
      <CalloutBox variant="orange" title="Comece aqui — leia antes de usar">
        <strong>Antes de usar qualquer prompt, faça duas coisas:</strong>
        <ol style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Leia &quot;A regra de ouro&quot; abaixo (3 minutos)</li>
          <li>Passe a foto do seu produto pelo checklist de pré-checagem</li>
        </ol>
        Se pular essas duas etapas, os prompts vão funcionar menos. Se não pular, vão funcionar muito bem.
      </CalloutBox>

      {/* Pré-checagem */}
      <SectionHeading>Pré-checagem da foto</SectionHeading>
      <P>Antes de jogar qualquer prompt, passe sua foto por este checklist. A qualidade da saída depende diretamente da qualidade da entrada.</P>
      <Checklist items={[
        "O produto aparece inteiro na foto (sem cortes)?",
        "A foto está em foco? O rótulo/estampa precisa ser legível.",
        "Tem luz suficiente? Não pode estar escura ou contra a luz.",
        "O produto está sozinho ou quase só no quadro?",
        "Consegue ver claramente a cor real do produto?",
      ]} />

      <SubHeading>Problemas comuns e como resolver antes de gerar</SubHeading>
      <CalloutBox variant="red" title="Foto escura ou mal iluminada">
        Não use. A IA vai inventar detalhes que não existem. Refaça a foto perto de uma janela com luz do dia, produto de frente para a janela. 30 segundos de trabalho, resultado muito melhor.
      </CalloutBox>
      <CalloutBox variant="red" title="Foto borrada">
        Não use. O rótulo vai sair inventado. Apoie o celular numa mesa e fotografe sem segurar, ou use o temporizador de 3 segundos.
      </CalloutBox>
      <CalloutBox variant="red" title="Produto cortado na foto">
        A IA vai &quot;completar&quot; a parte que faltou — às vezes bem, às vezes errado. Refaça com o produto inteiro no quadro.
      </CalloutBox>
      <CalloutBox variant="red" title="Muita bagunça ao redor">
        A IA pode confundir o que é o produto principal. Coloque o produto em cima de uma folha de papel branca. Limpo e rápido.
      </CalloutBox>

      {/* Regra de ouro */}
      <SectionHeading>A regra de ouro</SectionHeading>
      <CalloutBox variant="blue" title="A frase que carrega tudo">
        <strong>Ancora no produto real → ancora no mundo real ao redor → trava o que não pode mudar → especifica com medida física, nunca com adjetivo.</strong>
      </CalloutBox>
      <P>A diferença entre &quot;cara de IA&quot; e foto de estúdio está quase toda em duas coisas:</P>
      <Checklist items={[
        "Especificidade do mundo ao redor — não &apos;mesa bonita&apos;, mas &apos;mesa de mármore branco com 2–3 cubos de gelo derretendo e toalha de linho dobrada à esquerda&apos;",
        "Medida no lugar de adjetivo — não &apos;embalagem elegante&apos;, mas &apos;embalagem cilíndrica de vidro fosco, 8cm de altura, tampa preta rosqueável&apos;",
      ]} />

      <SubHeading>A fórmula em 3 partes</SubHeading>
      <P>
        <strong>Produto real</strong> + <strong>Mundo real ao redor</strong> + <strong>Como a foto foi tirada</strong>
      </P>
      <P><strong>Produto real:</strong> o que é, qual cor, qual tamanho, o que tem no rótulo, de que material é feito.</P>
      <P><strong>Mundo real ao redor:</strong> onde está o produto, quais objetos dividem o quadro, qual superfície, qual fundo. Objetos específicos, não &quot;ambiente aconchegante&quot;.</P>
      <P><strong>Como a foto foi tirada:</strong> lente, distância, de onde vem a luz, de qual ângulo. Isso é o que mais tira o cara de IA.</P>

      <SubHeading>Antes de usar qualquer prompt, responda mentalmente:</SubHeading>
      <Checklist items={[
        "Qual é a cor exata? (não &apos;azul&apos;, mas &apos;azul marinho quase preto&apos;)",
        "Qual é o tamanho real? (&apos;cabe numa mão&apos; ou &apos;garrafa de 500ml&apos;)",
        "Tem rótulo, logo ou estampa? O que está escrito?",
        "De que material é feito? (vidro, plástico, tecido, papel, metal…)",
      ]} />

      {/* Trava */}
      <SectionHeading>A trava — como proteger seu produto</SectionHeading>
      <P>Todo prompt do pack começa com uma instrução de preservação. Sem ela, a IA &quot;melhora&quot; o produto: inventa detalhes, normaliza a forma, suaviza o rótulo, troca a cor. A trava é o que impede isso.</P>
      <P>A imagem que você sobe é a referência principal. O texto da trava reforça o que não pode mudar. Essa linha já vem dentro de todos os prompts — você não precisa digitar de novo.</P>

      <CalloutBox variant="green" title="A trava base (já embutida em todos os prompts)">
        <code style={{ fontFamily: "monospace", fontSize: 12 }}>
          Follow the reference image closely and keep the product EXACTLY as shown — same shape, color, label/print/logo, material, finish and proportions. Do not recreate, recolor or restyle it; only build the scene around it.
        </code>
      </CalloutBox>

      {/* Os 6 prompts */}
      <SectionHeading>Os 6 tipos de foto</SectionHeading>
      <P>Cada um dos 6 tipos é uma seção. Abra o que corresponde ao tipo de foto que você quer gerar. Copie o prompt em inglês com um clique e cole no ChatGPT junto com a foto do seu produto.</P>

      <div style={{ marginTop: 16, borderBottom: "1px solid var(--border)" }}>
        {PROMPTS.map((p) => (
          <PromptCard key={p.id} prompt={p} tool="chatgpt" />
        ))}
      </div>

      {/* Como usar ChatGPT */}
      <SectionHeading>Como usar no ChatGPT — passo a passo</SectionHeading>

      <SubHeading>O que você precisa</SubHeading>
      <Checklist items={[
        "Conta no ChatGPT (a versão gratuita com GPT-4o funciona)",
        "Foto do seu produto (tirada no celular, seguindo a pré-checagem)",
        "O prompt do tipo de foto que quer (abra a seção acima)",
      ]} />

      <SubHeading>Passo 1 — Abra o ChatGPT em uma conversa nova</SubHeading>
      <P>Não use uma conversa antiga — contexto de outras mensagens pode interferir.</P>

      <SubHeading>Passo 2 — Anexe a foto do produto</SubHeading>
      <P>Clique no ícone de clipe (📎) ou arraste a foto para o campo de texto. Confirme que é a foto certa antes de enviar.</P>

      <SubHeading>Passo 3 — Preencha os slots do prompt</SubHeading>
      <P>Abra o prompt do tipo de foto que quer usar (acima). Preencha os slots marcados com <code style={{ background: "var(--surface2)", padding: "1px 5px", borderRadius: 4, fontSize: 12 }}>[MAIÚSCULAS]</code> com as informações do seu produto.</P>

      <SubHeading>Passo 4 — Cole o prompt junto com a foto</SubHeading>
      <P>O prompt vai junto com a foto na mesma mensagem. Não envie a foto separada primeiro.</P>

      <SubHeading>Passo 5 — Aguarde a geração (10–30 segundos)</SubHeading>
      <P>O ChatGPT gera 1 imagem por padrão.</P>

      <SubHeading>Passo 6 — Avalie e refine</SubHeading>
      <P>Se o resultado não ficou bom, <strong>não gere do zero</strong> — refine na mesma conversa. O ChatGPT mantém contexto.</P>

      <Toggle label="Frases prontas para refinar na mesma conversa">
        <div style={{ padding: "8px 0" }}>
          <P><strong>Cor muito quente:</strong> <em>Make the product color cooler and more accurate to the reference — less warm, more neutral</em></P>
          <P><strong>Rótulo errado:</strong> <em>Keep the exact label text from the reference image. Do not change the font, text or logo</em></P>
          <P><strong>Cena muito genérica:</strong> <em>Change the background to [descreva a cena específica]</em></P>
          <P><strong>Produto pequeno demais:</strong> <em>Bring the product closer and larger in the frame, keep it as the main subject</em></P>
          <P><strong>Imagem saiu em grade:</strong> <em>Generate a single full-frame photograph, not a grid or collage</em></P>
        </div>
      </Toggle>

      {/* Tom amarelado */}
      <SectionHeading>Correção do tom amarelado (viés do ChatGPT)</SectionHeading>
      <P>O ChatGPT tem um viés para o lado quente. Imagens tendem a ficar levemente mais âmbar que a referência. Em brancos, azuis e produtos com cor de marca, é problema. Em mel, madeira, terracota, favorece.</P>

      <SubHeading>Correção no prompt (antes de gerar)</SubHeading>
      <P>Adicione uma destas linhas ao final do prompt, antes da linha anti-colagem:</P>
      <CalloutBox variant="blue" title="Correção leve (só neutralizar o viés)">
        <code style={{ fontFamily: "monospace", fontSize: 12 }}>
          Accurate true-to-life color temperature — neutral white balance, do not add warmth or golden tones.
        </code>
      </CalloutBox>
      <CalloutBox variant="blue" title="Correção forte (produto muito branco ou cor fria)">
        <code style={{ fontFamily: "monospace", fontSize: 12 }}>
          Cool neutral color temperature, daylight 6000K white balance. The product color must match the reference exactly — do not shift toward warm or yellow tones.
        </code>
      </CalloutBox>

      {/* Rótulo */}
      <SectionHeading>Rótulo com texto — o que esperar</SectionHeading>
      <P>Essa é a principal limitação do ChatGPT. Ele <strong>lê a referência visual e reconstrói a cena</strong> — não copia pixels. Com rótulos, isso significa:</P>
      <Checklist items={[
        "Forma e posição do rótulo: geralmente preservados",
        "Cor do rótulo: geralmente preservada, pode esquentar levemente",
        "Texto do rótulo: pode ser recriado com erros (letras trocadas, fonte diferente)",
        "Logo simples: preservado. Logo complexo: pode ser alterado",
      ]} />

      <SubHeading>Técnica: reforçar a preservação</SubHeading>
      <P>Cole esta instrução <strong>antes</strong> do prompt principal, na mesma mensagem:</P>
      <CalloutBox variant="blue" title="Reforço de preservação de rótulo">
        <code style={{ fontFamily: "monospace", fontSize: 12 }}>
          IMPORTANT: The label on this product must appear EXACTLY as in the reference photo. Do not change, rewrite or stylize the label text, font or logo in any way. Preserve the label as a photograph would — do not recreate it.
        </code>
      </CalloutBox>

      <CalloutBox variant="orange" title="Quando aceitar que é limitação">
        Se após 2–3 refinamentos o rótulo continua sair diferente, isso não é falha sua nem do prompt — é limitação do modelo. Para produtos onde o rótulo é o ponto de venda, use o <strong>Pack Nano Banana</strong>.
      </CalloutBox>

      {/* Limites honestos */}
      <SectionHeading>Limites honestos — o que esperar</SectionHeading>

      <SubHeading>O que o ChatGPT faz muito bem</SubHeading>
      <Checklist items={[
        "Cena e atmosfera — é onde ele brilha",
        "Lifestyle — Prompts 02 e 03 saem excepcionais",
        "Produto sem rótulo (cerâmica, tecido, artesanato)",
        "Variações rápidas na mesma conversa",
        "Acessível — funciona no plano gratuito",
      ]} />

      <SubHeading>O que o ChatGPT faz com limitações</SubHeading>
      <Checklist items={[
        "Rótulo com texto — pode sair com erros em 30–40% dos casos",
        "Cor exata — viés para o quente, mas corrigível",
        "Logo complexo — pode simplificar",
        "Consistência entre gerações — cada conversa começa do zero",
      ]} />

      <SubHeading>O que não fazer</SubHeading>
      <Checklist items={[
        "Não espere que a foto original seja editada — o ChatGPT GERA uma nova",
        "Não use pra impressão grande (resolução limitada)",
        "Não confie 100% no rótulo — sempre valide",
      ]} />

      {/* FAQ */}
      <SectionHeading>Dúvidas frequentes</SectionHeading>

      <div style={{ borderTop: "1px solid var(--border)" }}>
        <Toggle label="Preciso saber escrever prompt?">
          <P>Não. Os prompts estão prontos em inglês. Você preenche algumas informações do produto em português (cor, material, tamanho) e cola o prompt no ChatGPT. É copiar e colar.</P>
        </Toggle>
        <Toggle label="Precisa de ChatGPT pago?">
          <P>Não. O plano gratuito com GPT-4o funciona para gerar imagens. Se chegar no limite de uso gratuito, você pode esperar o ciclo resetar ou assinar o Plus.</P>
        </Toggle>
        <Toggle label="O produto vai ficar exatamente igual ao meu?">
          <P>A forma e a cor geral são bem preservadas. O texto do rótulo pode ter pequenas diferenças — letras trocadas, fonte um pouco diferente. Para feed/stories/anúncios isso geralmente não é percebido. Para material oficial onde o rótulo precisa ser perfeito, recomendamos o Pack Nano Banana.</P>
        </Toggle>
        <Toggle label="A cor pode ficar diferente?">
          <P>Sim, pode ficar levemente mais quente. O pack inclui a técnica de correção — é uma linha a mais no prompt.</P>
        </Toggle>
        <Toggle label="Quantas fotos posso gerar?">
          <P>Quantas quiser. Os 6 prompts funcionam para qualquer produto, qualquer número de vezes. Sem limite de uso do pack — só o limite natural do ChatGPT.</P>
        </Toggle>
        <Toggle label="Funciona para qualquer tipo de produto?">
          <P>Sim. Universal — alimento, bebida, cosmético, roupa, acessório, artesanal.</P>
        </Toggle>
        <Toggle label="Tem garantia?">
          <P>Sim, 7 dias. Se seguiu o passo a passo e o resultado não ficou satisfatório, devolvemos o valor.</P>
        </Toggle>
        <div style={{ borderBottom: "1px solid var(--border)" }} />
      </div>

      {/* Upsell */}
      <SectionHeading>Precisa de fidelidade cirúrgica no rótulo?</SectionHeading>
      <CalloutBox variant="orange" title="Pack Nano Banana — R$67 (de R$97)">
        O ChatGPT cria cenas incríveis, mas pode recriar o texto e a logo do produto. Para produto com identidade visual definida (logo, texto no rótulo, cor de marca), o Pack Nano Banana preserva o produto com fidelidade cirúrgica. Mesmos 6 tipos de foto, ferramenta diferente.
        <div style={{ marginTop: 12 }}>
          <a
            href="https://kiwify.com.br"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block", background: "var(--accent)", color: "#fff", padding: "10px 18px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14 }}
          >
            Ver Pack Nano Banana →
          </a>
        </div>
      </CalloutBox>

      {/* Rodapé */}
      <div style={{ marginTop: 60, paddingTop: 30, borderTop: "1px solid var(--border)", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
        Feito por Swell Filmes · <a href="mailto:contato@swellfilmes.com.br" style={{ color: "var(--text-muted)" }}>contato@swellfilmes.com.br</a><br />
        Pack Foto Estúdio IA — ChatGPT · versão 1.0
      </div>
    </div>
  );
}
