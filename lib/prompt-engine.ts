import { ProductInfo, SceneInfo, PhotoType, Tool } from "./types";

export function buildSystemPrompt(): string {
  return `Você é um especialista em direção de fotografia de campanha e prompt engineering para IA de geração de imagem.

Seu trabalho é receber informações de um produto e gerar um prompt em inglês otimizado para gerar fotos de produto com qualidade de estúdio.

REGRAS OBRIGATÓRIAS:
1. O prompt SEMPRE começa com a trava de produto: "Follow the reference image closely and keep the product EXACTLY as shown — same shape, color, label/print/logo, material, finish and proportions. Do not recreate, recolor or restyle it; only build the scene around it."
2. Use medidas físicas concretas, NUNCA adjetivos de vibe (nunca: beautiful, stunning, elegant, premium, aesthetic)
3. Especifique SEMPRE: tipo de captura (câmera/lente), direção de luz, temperatura de cor, dureza
4. Inclua SEMPRE uma imperfeição proposital (ex: "one slightly soft edge", "a small water drop")
5. Termine SEMPRE com: "A single full-frame photograph — no collage, no grid, no split panels."
6. Para ChatGPT: adicione "Accurate true-to-life color temperature — neutral white balance" se o produto for branco, azul ou cor fria
7. Para Nano Banana: o prompt deve ser mais denso em detalhes físicos de textura

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "promptEN": "...",
  "instructionsPT": "...",
  "toolTips": "...",
  "warnings": ["..."]
}

- promptEN: o prompt completo em inglês, pronto para copiar e colar
- instructionsPT: passo a passo em português de como usar o prompt na ferramenta escolhida (3-5 passos simples)
- toolTips: 1-2 dicas específicas para a ferramenta escolhida (ChatGPT ou Nano Banana)
- warnings: array de 0-2 avisos sobre limitações específicas para este produto+ferramenta (pode ser array vazio [])`;
}

export function buildUserMessage(product: ProductInfo, scene: SceneInfo): string {
  const photoTypeLabels: Record<PhotoType, string> = {
    "fundo-limpo": "Fundo limpo / E-commerce (produto isolado em fundo neutro)",
    lifestyle: "Lifestyle / Em cena (produto em contexto de uso)",
    segurando: "Alguém segurando ou vestindo",
    "flat-lay": "Flat lay / Vista de cima",
    macro: "Macro / Detalhe / Textura",
    "ghost-mannequin": "Ghost mannequin (roupa sem modelo visível)",
  };

  const toolLabels: Record<Tool, string> = {
    chatgpt: "ChatGPT (GPT-4o com geração de imagem)",
    "nano-banana": "Nano Banana via Magnific (modelo imagen-nano-banana-2-flash para lifestyle, imagen-nano-banana-2 Pro para produto/rótulo)",
  };

  return `Gere um prompt de foto de produto com estas informações:

PRODUTO:
- Categoria: ${product.category}
- Nome/descrição: ${product.name}
- Cor: ${product.color}
- Material: ${product.material}
- Tamanho aproximado: ${product.size}
- Tem rótulo/logo/estampa: ${product.hasLabel ? "Sim" : "Não"}
${product.hasLabel ? `- Texto/logo do rótulo: ${product.labelText}` : ""}
${product.hasLabel ? `- Posição do rótulo: ${product.labelPosition}` : ""}

FOTO DESEJADA:
- Tipo de foto: ${photoTypeLabels[scene.photoType]}
- Ferramenta: ${toolLabels[scene.tool]}
- Cena/contexto: ${scene.scene || "não especificado — escolha algo adequado para a categoria"}
- Fundo/background: ${scene.background || "adequado para o tipo de foto"}
- Clima/atmosfera: ${scene.lightMood || "natural e clean"}

Gere o prompt otimizado seguindo todas as regras do sistema.`;
}
