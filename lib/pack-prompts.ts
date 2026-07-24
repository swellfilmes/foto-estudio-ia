// Fonte única de verdade dos 6 prompts do pack.
// Baseada em nucleo/prompts/01-fundo-limpo.md ... 06-ghost-mannequin.md
// NÃO parafrasear os prompts — a fidelidade depende deles verbatim.

export type PackSlug = "chatgpt" | "nano-banana";

export const PACK_PASSWORDS: Record<PackSlug, string> = {
  chatgpt: "swellchatgpt2026",
  "nano-banana": "swellnb2026",
};

export const PACK_LABELS: Record<PackSlug, string> = {
  chatgpt: "Pack Foto Estúdio IA — ChatGPT",
  "nano-banana": "Pack Foto Estúdio IA — Nano Banana",
};

export interface PromptSlot {
  key: string;      // ex: "[PRODUTO]"
  what: string;     // o que colocar
  example: string;  // exemplo
}

export interface PromptDoc {
  id: string;
  number: string;         // "01" a "06"
  title: string;          // "Fundo limpo / E-commerce"
  when: string;           // quando usar
  slots: PromptSlot[];
  promptEN: string;       // prompt base em inglês, verbatim
  filledExampleTitle?: string;
  filledExample: string;  // exemplo preenchido
  commonErrors: { problem: string; fix: string }[];
  recommendedModel: { chatgpt: string; nb: string };
}

export const PROMPTS: PromptDoc[] = [
  {
    id: "fundo-limpo",
    number: "01",
    title: "Fundo limpo / E-commerce",
    when: "Foto de catálogo. Shopee, Mercado Livre, Instagram Shop, site próprio. Produto em destaque absoluto, sem distração. O cliente precisa ver o produto com clareza.",
    slots: [
      { key: "[PRODUTO]", what: "Tipo + cor + material + tamanho aproximado + rótulo/logo", example: `350ml cylindrical glass bottle, matte white label with green text "Erva Boa", silver screw cap` },
      { key: "[COR DO FUNDO]", what: "Branco puro / cinza claro / cor da marca / cor que contrasta", example: `warm white / light grey / clay beige` },
      { key: "[ÂNGULO]", what: "De frente / três-quartos / levemente lateral", example: `straight-on front view / slight three-quarter angle` },
      { key: "[SOMBRA]", what: "Sombra suave embaixo / reflexo sutil / sem sombra", example: `one soft drop shadow below / subtle reflection on the surface` },
    ],
    promptEN: `Studio packshot for an e-commerce listing. Follow the reference image closely and keep the product EXACTLY as shown — same shape, color, label/print/logo, material, finish and proportions. Do not recreate, recolor or restyle it; only build the scene around it. [PRODUTO], [ÂNGULO], centered on a [COR DO FUNDO] seamless backdrop with a gentle gradient. [SOMBRA]. Studio strobe, soft frontal light from slightly above, 50mm lens, even exposure, the label and every detail clearly legible. Matte surface texture with one subtle surface imperfection, true-to-life color. No third-party logos, no competitor brands, no invented text — only the product's existing label. A single full-frame photograph — no collage, no grid, no split panels.`,
    filledExampleTitle: `Pote de mel artesanal, hexagonal, vidro âmbar, rótulo kraft com texto "Mel do Vale" escrito à mão, tampa dourada de metal.`,
    filledExample: `Studio packshot for an e-commerce listing. Follow the reference image closely and keep the product EXACTLY as shown — same shape, color, label/print/logo, material, finish and proportions. Do not recreate, recolor or restyle it; only build the scene around it. 350ml hexagonal amber glass honey jar, kraft paper label with handwritten black text "Mel do Vale", gold metal lid, straight-on front view, centered on a warm white seamless backdrop with a gentle gradient. One soft drop shadow below. Studio strobe, soft frontal light from slightly above, 50mm lens, even exposure, the label and every detail clearly legible. Matte glass texture with one tiny water drop on the side, true-to-life amber color. No third-party logos, no competitor brands, no invented text — only the product's existing label. A single full-frame photograph — no collage, no grid, no split panels.`,
    commonErrors: [
      { problem: "Fundo muito branco + produto branco: o produto some", fix: "Use `warm white` em vez de `pure white`, ou mude para `light grey seamless`." },
      { problem: "Sombra estranha", fix: "Troque `drop shadow below` por `subtle reflection on a white surface` para produtos com fundo reflexivo." },
      { problem: "Rótulo pequeno desaparecendo", fix: "Adicione `the label clearly legible, shot at medium distance` para o NB não afastar o produto demais." },
    ],
    recommendedModel: {
      chatgpt: "GPT-4o com imagem anexada",
      nb: "Pro (imagen-nano-banana-2) — produto é herói, fidelidade máxima",
    },
  },

  {
    id: "lifestyle",
    number: "02",
    title: "Lifestyle / Em cena",
    when: "Produto em contexto de uso real. Feed de Instagram, stories, anúncios. O produto está no mundo, não flutuando no fundo branco. ChatGPT brilha aqui (cena e atmosfera). Nano Banana também, mas com cuidado com o rótulo (use pipeline packshot-primeiro se o rótulo for crítico).",
    slots: [
      { key: "[PRODUTO]", what: "Tipo + cor + material + rótulo", example: `500ml matte black glass bottle, gold embossed label "PURA"` },
      { key: "[CENA]", what: "Onde o produto está e com quais objetos ao redor", example: `marble kitchen counter, a folded white linen towel to the left, morning light from a window` },
      { key: "[POSIÇÃO]", what: "Como o produto está posicionado na cena", example: `standing upright slightly off-center / laid on its side` },
      { key: "[LUZ]", what: "De onde vem, temperatura, dureza", example: `soft window light from the left, warm 4000K, diffused` },
      { key: "[CÂMERA]", what: "Lente e estilo", example: `50mm lens, shallow depth of field / 35mm film grain` },
    ],
    promptEN: `Lifestyle photograph for a campaign. Follow the reference image closely and keep the product EXACTLY as shown — same shape, color, label/print/logo, material, finish and proportions. Do not recreate, recolor or restyle it; only build the scene around it. [PRODUTO], [POSIÇÃO], [CENA]. [LUZ]. [CÂMERA], real surface texture with one intentional imperfection, true-to-life color, the product clearly visible. No third-party logos, no competitor brands, no invented text — only the product's existing label. A single full-frame photograph — no collage, no grid, no split panels.`,
    filledExampleTitle: `Vela aromática, pote de vidro transparente com cera bege, rótulo quadrado branco com texto "Bambu & Cedro" em fonte serif preta.`,
    filledExample: `Lifestyle photograph for a campaign. Follow the reference image closely and keep the product EXACTLY as shown — same shape, color, label/print/logo, material, finish and proportions. Do not recreate, recolor or restyle it; only build the scene around it. Clear glass candle jar, beige wax, square white matte label with serif black text "Bambu & Cedro", standing upright slightly off-center on a white marble tray with a small dried eucalyptus branch beside it and a folded linen cloth in the background. Soft window light from the left, warm 4000K, diffused, no harsh shadows. 50mm lens, shallow depth of field, real glass texture with one tiny wax drip on the outside, true-to-life warm beige wax color, the label clearly visible. No third-party logos, no competitor brands, no invented text — only the product's existing label. A single full-frame photograph — no collage, no grid, no split panels.`,
    commonErrors: [
      { problem: "Cena genérica: 'beautiful kitchen background'", fix: "IA inventa qualquer coisa. Especifique o material e 2–3 objetos concretos." },
      { problem: "Rótulo sumindo", fix: "Se o produto tem rótulo com texto importante, gere um flat-lay primeiro (Prompt 04), salve essa imagem e use como nova referência antes do lifestyle." },
      { problem: "Produto muito pequeno na cena", fix: "Adicione `the product is the clear foreground subject, sharp and centered` para forçar o tamanho correto." },
    ],
    recommendedModel: {
      chatgpt: "GPT-4o com imagem anexada — cena e atmosfera excelentes",
      nb: "NB2 Flash (imagen-nano-banana-2-flash) — mais barato, rápido, bom para cena",
    },
  },

  {
    id: "segurando",
    number: "03",
    title: "Alguém segurando / Vestindo",
    when: "Mão segurando o produto, pessoa usando a roupa, produto em situação de uso real com pessoa. Transmite escala real e contexto humano. Funciona muito bem para alimentos, bebidas, cosméticos e vestuário.",
    slots: [
      { key: "[PRODUTO]", what: "Tipo + cor + material + rótulo", example: `small amber glass bottle with dropper, white label "Sérum C"` },
      { key: "[MÃO]", what: "Tom de pele + detalhe real", example: `woman's hand, medium brown skin, short natural nails` },
      { key: "[GESTO]", what: "Como segura", example: `held by two fingers at waist height / cupped in open palm` },
      { key: "[FUNDO]", what: "O que aparece atrás", example: `blurred light beige wall / soft kitchen background / outdoor light` },
      { key: "[LUZ]", what: "Direção + temperatura", example: `soft window light from the left, warm 4000K` },
    ],
    promptEN: `Lifestyle photograph for a campaign. Follow the reference image closely and keep the product EXACTLY as shown — same shape, color, label/print/logo, material, finish and proportions. Do not recreate, recolor or restyle it; only build the scene around it. [PRODUTO], [GESTO] by [MÃO], [FUNDO] slightly out of focus. [LUZ], 50mm lens, shallow depth of field, the product in clear focus, real skin texture with visible pores, one natural skin imperfection, true-to-life color, the label clearly legible. No third-party logos, no competitor brands, no invented text — only the product's existing label. A single full-frame photograph — no collage, no grid, no split panels.`,
    filledExampleTitle: `Sachê de chá, embalagem kraft retangular, texto "Camomila Noite" carimbado.`,
    filledExample: `Lifestyle photograph for a campaign. Follow the reference image closely and keep the product EXACTLY as shown — same shape, color, label/print/logo, material, finish and proportions. Do not recreate, recolor or restyle it; only build the scene around it. Kraft paper rectangular tea sachet with stamped black text "Camomila Noite", held by two fingers in a relaxed pinch by a woman's hand, medium brown skin, short unpainted nails, blurred warm kitchen background slightly out of focus. Soft window light from the left, warm 4000K, 50mm lens, shallow depth of field, the product in clear focus, real skin texture with visible pores, one natural skin imperfection, true-to-life kraft paper texture. No third-party logos, no competitor brands, no invented text — only the product's existing label. A single full-frame photograph — no collage, no grid, no split panels.`,
    commonErrors: [
      { problem: "Pele plástica", fix: "Adicione `real skin texture with visible pores` e `one natural skin imperfection`. Sem isso o resultado parece manequim digital." },
      { problem: "Pose de catálogo", fix: "'person holding product smiling' → resultado genérico. Especifique um micro-momento: `caught mid-step`, `glancing down at the product`, `adjusting the label`." },
      { problem: "Corpo cortado estranhamente", fix: "Defina o enquadramento: `waist-up shot` / `close-up on hands only` / `full body from a distance`." },
    ],
    recommendedModel: {
      chatgpt: "GPT-4o — bom para cenas com pessoa, mas pode recriar roupa/rótulo",
      nb: "NB2 Flash para mão+produto · Pro se rótulo for crítico",
    },
  },

  {
    id: "flat-lay",
    number: "04",
    title: "Flat lay / De cima",
    when: "Vista de cima (90°). Forte para cosméticos, alimentos, moda, produtos com rótulo no topo. É a posição onde o NB mantém mais fidelidade ao rótulo — use este prompt primeiro quando o rótulo for crítico, antes de gerar cenas lifestyle.",
    slots: [
      { key: "[PRODUTO]", what: "Tipo + cor + material + rótulo", example: `small white ceramic jar, matte lid with embossed text "Creme Facial"` },
      { key: "[SUPERFÍCIE]", what: "Material e cor da superfície embaixo", example: `white marble surface / light oak wood / linen fabric / concrete` },
      { key: "[PROPS]", what: "2–4 objetos concretos ao redor", example: `dried rose petals, a small silver spoon, a white folded cloth` },
      { key: "[DISPOSIÇÃO]", what: "Como o produto e os props estão arrumados", example: `product centered, props loosely scattered around` },
      { key: "[LUZ]", what: "Direção + temperatura", example: `soft diffused overhead light, daylight 5500K` },
    ],
    promptEN: `Flat lay product photograph, straight overhead 90° angle, for a campaign. Follow the reference image closely and keep the product EXACTLY as shown — same shape, color, label/print/logo, material, finish and proportions. Do not recreate, recolor or restyle it; only build the scene around it. [PRODUTO] placed on [SUPERFÍCIE], [DISPOSIÇÃO], with [PROPS] arranged around it. [LUZ], 50mm lens, even exposure from above, every surface texture clearly visible, one intentional small imperfection (natural placement, slight shadow), true-to-life color. No third-party logos, no competitor brands, no invented text — only the product's existing label. A single full-frame photograph — no collage, no grid, no split panels.`,
    filledExampleTitle: `Kit de pincéis de maquiagem, 5 pincéis de cabo preto com cerdas brancas, embalagem kraft com elástico rosa.`,
    filledExample: `Flat lay product photograph, straight overhead 90° angle, for a campaign. Follow the reference image closely and keep the product EXACTLY as shown — same shape, color, label/print/logo, material, finish and proportions. Do not recreate, recolor or restyle it; only build the scene around it. Set of 5 makeup brushes, black handles, white synthetic bristles, bundled with a kraft paper band and thin pink elastic, placed on a white marble surface, product centered horizontally, with a small folded blush-pink linen cloth at bottom-left, 3 dried rose petals scattered lightly, and a small flat white stone at top-right. Soft diffused overhead light, daylight 5500K, 50mm lens, even exposure from above, every texture clearly visible — marble veining, kraft paper grain, brush bristle detail — one petal slightly curled as natural imperfection, true-to-life color. No third-party logos, no competitor brands, no invented text — only the product's existing label. A single full-frame photograph — no collage, no grid, no split panels.`,
    commonErrors: [
      { problem: "Produtos redondos escapando para o lado", fix: "Adicione `the product is perfectly centered, seen directly from above` para forçar o ângulo." },
      { problem: "Props inventados pela IA", fix: "Adicione `only the props described — no additional elements` ao final." },
      { problem: "Luz com sombra marcada no flat-lay", fix: "Troque para `soft even overhead diffused light, no harsh shadows`." },
    ],
    recommendedModel: {
      chatgpt: "GPT-4o — bom para flat-lay; rótulo pode ser recriado",
      nb: "Pro (imagen-nano-banana-2) — use Pro quando o rótulo for crítico",
    },
  },

  {
    id: "macro",
    number: "05",
    title: "Macro / Detalhe / Textura",
    when: "Close extremo em material, costura, ingrediente, textura do rótulo, acabamento do produto. Transmite qualidade sem precisar de muito texto. Brilha em cosméticos, tecidos, alimentos artesanais e joias.",
    slots: [
      { key: "[DETALHE]", what: "O que está em close — material, textura, parte específica", example: `the woven cotton fabric detail at the collar seam / honey dripping from a wooden spoon` },
      { key: "[PRODUTO]", what: "Contexto — o que é o produto, brevemente", example: `handmade linen tote bag / artisanal raw honey jar` },
      { key: "[LUZ]", what: "Raking light realça textura. Especifique ângulo rasante", example: `hard side light raking across the surface at 15°` },
      { key: "[FOCO]", what: "O que fica nítido e o que fica fora", example: `sharp focus on the texture, foreground and background soft` },
      { key: "[CÂMERA]", what: "Macro ou lente longa", example: `100mm macro lens / 60mm macro, close focusing distance` },
    ],
    promptEN: `Macro detail photograph for a campaign. Follow the reference image closely and keep the product EXACTLY as shown — same color, material, finish. [DETALHE] of [PRODUTO], extreme close-up, [CÂMERA], [LUZ], [FOCO]. Real texture with visible detail, one intentional imperfection — a tiny natural variation in the material. True-to-life color. No third-party logos, no competitor brands. A single full-frame photograph — no collage, no grid, no split panels.`,
    filledExampleTitle: `Vidro fosco de frasco de skincare com texto embossed.`,
    filledExample: `Macro detail photograph for a campaign. Follow the reference image closely and keep the product EXACTLY as shown — same color, material, finish. The frosted glass texture and embossed label detail of a skincare serum bottle, extreme close-up at the shoulder of the bottle, 100mm macro lens, hard raking side light from the right at 20°, sharp focus on the embossed letters, glass surface soft front and back. Real frosted glass texture with micro-bubbles and slight surface variation, one tiny water droplet resting at the base of the embossed text as intentional imperfection. True-to-life cool translucent frosted white. No third-party logos, no competitor brands, no invented text — only the product's existing embossed text. A single full-frame photograph — no collage, no grid, no split panels.`,
    commonErrors: [
      { problem: "Foco em tudo (resultado plano)", fix: "Macro sem bokeh parece flat. Sempre especifique o que fica nítido e o que fica fora." },
      { problem: "Luz plana (textura desaparece)", fix: "Luz raking (rasante) é o que revela textura. Use `hard side light raking across the surface at 15°` em vez de luz frontal difusa." },
      { problem: "Imagem muito escura", fix: "Adicione `subtle fill light from the right to reveal shadow detail` se a imagem sair escura demais." },
    ],
    recommendedModel: {
      chatgpt: "GPT-4o — bom resultado em macro, especialmente para alimentos e líquidos",
      nb: "Pro (imagen-nano-banana-2) — fidelidade de textura é onde o Pro brilha",
    },
  },

  {
    id: "ghost-mannequin",
    number: "06",
    title: "Ghost mannequin (roupa sem modelo)",
    when: "Roupa sem modelo visível — o tecido mantém o volume e a forma como se alguém estivesse dentro, mas a pessoa não aparece. Padrão de e-commerce de vestuário. Funciona melhor com camisetas, moletons, blazers, jaquetas, vestidos.",
    slots: [
      { key: "[PEÇA]", what: "Tipo + cor + material + estampa/detalhe", example: `oversized white cotton hoodie, ribbed cuffs, front kangaroo pocket, no print` },
      { key: "[CORPO]", what: "Volume e postura do corpo fantasma", example: `medium build, arms slightly away from the body / relaxed stance` },
      { key: "[ÂNGULO]", what: "Frente / três quartos / costas", example: `straight-on front view / slight three-quarter angle` },
      { key: "[FUNDO]", what: "Cor e textura do fundo", example: `clean white seamless / warm grey seamless` },
      { key: "[LUZ]", what: "Direção + temperatura", example: `soft key from camera-left 45°, subtle rim from behind-right, warm 4000K` },
    ],
    promptEN: `Ghost mannequin product photograph for an e-commerce listing — the garment appears worn by an invisible figure, showing natural volume and drape as if on a body, but no person or mannequin is visible. Follow the reference image closely and keep the garment EXACTLY as shown — same color, cut, length, fabric texture, seams, print and details. Do not alter the length, silhouette or proportions. [PEÇA], [ÂNGULO], on a ghost mannequin with [CORPO], [FUNDO] seamless backdrop. [LUZ], 50mm lens. The fabric shows natural drape and real textile texture with one subtle natural fold as imperfection. Every seam, stitch detail and the garment's existing print/label clearly visible. No third-party logos, no competitor brands, no invented text or print. A single full-frame photograph — no collage, no grid, no split panels.`,
    filledExampleTitle: `Moletom cropped, cor terracota, sem estampa, punhos e barra em canelado.`,
    filledExample: `Ghost mannequin product photograph for an e-commerce listing — the garment appears worn by an invisible figure, showing natural volume and drape as if on a body, but no person or mannequin is visible. Follow the reference image closely and keep the garment EXACTLY as shown — same color, cut, length, fabric texture, seams and details. Do not alter the cropped length, silhouette or proportions. Cropped terracotta fleece hoodie, slightly boxy fit, ribbed cuffs and hem, no print or logo, straight-on front view, on a ghost mannequin with medium build, arms relaxed at sides, white seamless backdrop. Soft key from camera-left at 45°, subtle rim from behind-right, warm 4000K, 50mm lens. The fabric shows natural drape and real fleece texture — soft brushed surface with slight visible pile — with one small natural fold at the left hip as imperfection. Every seam and the cropped length clearly visible. No third-party logos, no competitor brands, no invented text or print. A single full-frame photograph — no collage, no grid, no split panels.`,
    commonErrors: [
      { problem: "Peça 'achatada' sem volume", fix: "Adicione `the garment filled with natural volume, fabric with realistic drape and weight` e especifique o tipo de corpo do manequim fantasma." },
      { problem: "Comprimento alterado (IA 'corrige' peça curta)", fix: "Adicione explicitamente: `keep the cropped length EXACTLY — hem sits [Xcm] below the chest, do NOT lengthen`." },
      { problem: "Manequim aparecendo na saída", fix: "Adicione `completely invisible body — only the floating garment visible, no mannequin, no body parts, no transparent figure`." },
    ],
    recommendedModel: {
      chatgpt: "GPT-4o — funciona mas tende a alterar proporções; atenção ao comprimento",
      nb: "Pro (imagen-nano-banana-2) — ghost mannequin exige fidelidade de corte e cor",
    },
  },
];
