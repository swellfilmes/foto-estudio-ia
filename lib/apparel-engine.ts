// Motor de prompts para o Modo Pessoas / Apparel.
// Deriva do apparel-prompt-engine (SKILL.md v1) — regras verbatim das categorias
// e estilos. NÃO parafrasear: a fidelidade vem da consistência textual.

export type ApparelStyle = "realista" | "render-3d";

export type ApparelCategory =
  | "studio"
  | "ghost-mannequin"
  | "flat-lay"
  | "model-studio"
  | "model-lifestyle"
  | "product-in-hand"
  | "ugc-selfie"
  | "campaign-editorial";

export interface ApparelInfo {
  garmentType: string;      // ex: "cropped babylook branca"
  fit: string;              // ex: "cropped — barra ~10cm abaixo da axila"
  color: string;            // ex: "off-white creme #F2ECE0"
  fabric: string;           // ex: "malha 100% algodão penteado"
  print: string;            // ex: "estampa peito 12cm de largura, letras 'SWELL'"
  details: string;          // ex: "gola careca ribana fina, punho reto"
  blocks: string;           // ex: "logo Nike visível no lado esquerdo" — vira negative
  notes: string;            // qualquer contexto adicional
}

export interface ApparelSceneInfo {
  style: ApparelStyle;
  category: ApparelCategory;
  scene: string;            // livre: contexto/local/mood
  colorHex: string;         // hex opcional (fundo de marca, cor da parede)
  modelProfile: string;     // "mulher 30 anos pele parda, cabelo cacheado" — só se categoria com pessoa
}

export const APPAREL_STYLES: { value: ApparelStyle; label: string; desc: string }[] = [
  { value: "realista", label: "Realista", desc: "Foto real, com textura de tecido e imperfeição controlada" },
  { value: "render-3d", label: "Render 3D", desc: "Visualização premium tipo campanha digital" },
];

export const APPAREL_CATEGORIES: {
  value: ApparelCategory;
  label: string;
  desc: string;
  hasPerson: boolean;
}[] = [
  { value: "studio", label: "Estúdio (catálogo)", desc: "Foto principal, fundo neutro, sem modelo", hasPerson: false },
  { value: "ghost-mannequin", label: "Ghost mannequin", desc: "Roupa com volume 3D, sem modelo — e-commerce", hasPerson: false },
  { value: "flat-lay", label: "Flat lay", desc: "Peça vista de cima, composição com props", hasPerson: false },
  { value: "model-studio", label: "Modelo · Estúdio", desc: "Modelo vestindo, fundo neutro editorial", hasPerson: true },
  { value: "model-lifestyle", label: "Modelo · Lifestyle", desc: "Modelo em cena real (rua, café, casa)", hasPerson: true },
  { value: "product-in-hand", label: "Produto na mão", desc: "Detalhe, textura, escala — mão segurando", hasPerson: true },
  { value: "ugc-selfie", label: "UGC / Selfie", desc: "Estética real de cliente — foto de celular", hasPerson: true },
  { value: "campaign-editorial", label: "Campanha editorial", desc: "Hero de lançamento, fundo de marca, headroom p/ texto", hasPerson: true },
];

// Style Strength recomendado por (categoria × estilo). null = combinação não recomendada.
export const STYLE_STRENGTH_MATRIX: Record<
  ApparelCategory,
  { realista: [number, number] | null; "render-3d": [number, number] | null }
> = {
  studio:              { realista: [20, 30], "render-3d": [35, 45] },
  "ghost-mannequin":   { realista: [30, 40], "render-3d": [35, 45] },
  "flat-lay":          { realista: [20, 30], "render-3d": [30, 40] },
  "model-studio":      { realista: [25, 35], "render-3d": [40, 50] },
  "model-lifestyle":   { realista: [30, 40], "render-3d": null },
  "product-in-hand":   { realista: [30, 40], "render-3d": [40, 50] },
  "ugc-selfie":        { realista: [45, 60], "render-3d": null },
  "campaign-editorial":{ realista: [25, 40], "render-3d": [40, 50] },
};

// Blocos verbatim das CATEGORIAS (não parafrasear — consistência textual).
export const CATEGORY_BLOCKS: Record<ApparelCategory, string> = {
  studio: `Product photography on a seamless studio backdrop. Background: [neutral light gray #EDEDED | soft warm beige | solid brand color HEX]. Soft even studio lighting from above and front, gentle natural shadow beneath the garment. The garment is presented [laid/hanging/front-facing] cleanly, centered, with breathing room around it.`,

  "ghost-mannequin": `Ghost mannequin product mockup. The garment is worn and shaped by an invisible body, natural 3D volume and realistic fabric drape, sleeves and torso filled naturally. Pure white seamless background (#FFFFFF). Soft even studio lighting from above, subtle natural shadow at the base of the garment. Professional apparel e-commerce standard.`,

  "flat-lay": `Overhead flat lay product photo, top-down view. The garment laid [flat and smooth | neatly folded] on [warm wooden table | natural linen fabric | clean white paper | light marble]. Soft natural window light from the side, gentle real shadows following the folds, visible fabric texture and stitching.`,

  "model-studio": `Editorial studio photo of a model wearing the garment, seamless [color/HEX] backdrop. Soft warm studio light, one main source from camera-left at 45°, gentle fill, soft floor shadow. [Full body 50mm with headroom | half body from hips up, 85mm shallow DOF focusing the garment]. Confident restrained pose, editorial gaze — premium is restraint, not a smiling stock pose. Styling: neutral basics (jeans / neutral trousers) so the product is the only strong color.`,

  "model-lifestyle": `Candid lifestyle photo of a model wearing the garment in a real everyday setting: [street café | urban sidewalk | home living room | rooftop at golden hour | park]. Warm natural light appropriate to the setting and time of day. Real environment with specific named details (real furniture, real objects, background people slightly out of focus when public). 35mm lens, natural framing. The moment feels caught, not staged — NOT advertising, NOT stock photo.`,

  "product-in-hand": `Close-up photo of hands holding/presenting the garment, showing [the fabric texture | the collar detail | the print | the fold]. Natural warm light, shallow depth of field (85mm), the product sharp and the background soft. Real hands with natural skin texture and realistic grip. The garment fills most of the frame.`,

  "ugc-selfie": `Candid front-facing smartphone selfie at arm's length, slightly tilted, face and chest framed, natural lens distortion. The person wears the garment naturally (can be styled loosely). Genuine unposed expression. Real skin with pores, real hair texture. Subtle grain. The viewer must believe a real customer took this photo.`,

  "campaign-editorial": `Editorial fashion campaign photo. Model(s) wearing the garment against a seamless solid backdrop in the brand color [HEX — pedir ao cliente]. Soft warm studio light from camera-left at 45°, soft floor shadow. Confident editorial poses, Zara-campaign aesthetic, premium and restrained. Optional prop: [wooden crate | stool | none]. Full body or group composition with generous headroom above the subjects.`,
};

// Blocos verbatim dos ESTILOS.
export const STYLE_BLOCKS: Record<ApparelStyle, string> = {
  realista: `Photorealistic commercial photography. Real cotton fabric texture with visible weave and natural wrinkles. Physically accurate lighting with defined direction and soft natural shadows. Subtle sensor grain. Realistic depth of field.`,

  "render-3d": `High-end 3D product render, octane/redshift quality. Physically-based fabric material with visible cotton weave in the shader, soft subsurface scattering on the fabric, accurate cloth simulation with natural drape and fold. Studio HDRI lighting, soft gradient background, gentle contact shadow and subtle reflection under the product.`,
};

// Complemento "se houver pessoa" (só cola quando categoria tem pessoa).
export const STYLE_PERSON_ADDON: Record<ApparelStyle, string> = {
  realista: `Natural skin texture with visible pores and micro imperfections, no retouching look. Real hair texture. Expression as a micro-moment (mid-laugh, glancing sideways), not a stock-photo pose.`,
  "render-3d": ``, // não se aplica em 3D com pessoa realista
};

// Bloco ANTI (proibições nomeadas) por estilo.
export const STYLE_ANTI: Record<ApparelStyle, string> = {
  realista: `NOT CGI, NOT 3D render, NOT illustration, no plastic fabric, no plastic skin, no perfectly smooth surfaces, not a staged stock photo`,
  "render-3d": `NOT a photograph with people in real locations, no photographic grain, no candid imperfections — clean controlled render aesthetic`,
};

// Negative base por estilo.
export const STYLE_NEGATIVE: Record<ApparelStyle, string> = {
  realista: `CGI, 3D render, illustration, cartoon, plastic skin, plastic fabric, oversmooth, oversaturated, artificial lighting without direction, stock photo pose, watermark`,
  "render-3d": `photographic grain, candid photo, messy background, low-poly, game asset look, plastic cheap material, flat shading, harsh reflections, watermark`,
};

// Negative específico por categoria (concatena com o do estilo).
export const CATEGORY_NEGATIVE: Partial<Record<ApparelCategory, string>> = {
  "ghost-mannequin": `visible model, visible person, hands, neck, mannequin head, mannequin legs, flattened garment, elongated torso, regular length, colored background`,
  "product-in-hand": `extra fingers, deformed hands, mannequin hands, plastic skin, distorted print`,
};

// Câmera recomendada por categoria.
export const CATEGORY_CAMERA: Record<ApparelCategory, string> = {
  studio: "85-100mm lens, shallow depth of field, product-still framing",
  "ghost-mannequin": "85-100mm lens, straight-on eye level, garment centered",
  "flat-lay": "top-down 50mm equivalent, camera perfectly parallel to surface",
  "model-studio": "50mm full body OR 85mm half body — pick one and stick to it",
  "model-lifestyle": "35mm lens, natural framing, environment visible",
  "product-in-hand": "85mm lens, shallow DOF, product sharp, background soft",
  "ugc-selfie": "smartphone front camera, arm's length, slight tilt, natural lens distortion",
  "campaign-editorial": "50mm full-body OR 85mm crop — headroom above subject for post text",
};

// Palavras proibidas (a skill sempre remove).
export const BANNED_WORDS = [
  "beautiful", "stunning", "perfect", "vibrant", "amazing",
  "high quality", "professional", "4k", "8k",
];

export function isCombinationRecommended(cat: ApparelCategory, style: ApparelStyle): boolean {
  return STYLE_STRENGTH_MATRIX[cat][style] !== null;
}

export function getStyleStrength(cat: ApparelCategory, style: ApparelStyle): number | null {
  const range = STYLE_STRENGTH_MATRIX[cat][style];
  if (!range) return null;
  const [min, max] = range;
  return Math.round((min + max) / 2);
}

// Trava de produto — SEMPRE primeira linha do prompt.
export function buildProductLock(info: ApparelInfo): string {
  const parts: string[] = [
    `Follow the reference image closely. Do not recreate, alter, or replace the garment. Keep its colors, design, cut, fabric, drape and print exactly as shown in the reference photo. Only generate the scene/person/lighting/background around it.`,
  ];

  if (info.fit && /crop|curt|baby/i.test(info.fit)) {
    parts.push(`Preserve the short length exactly as shown — do NOT lengthen the garment.`);
  }
  if (info.print) {
    parts.push(`Keep the print exactly as in the reference (${info.print}), proportional, NOT oversized, do not redraw the lettering.`);
  }
  return parts.join(" ");
}

// System prompt para o gerador principal do modo Pessoas.
// Recebe ApparelInfo + ApparelSceneInfo e retorna o mesmo shape do modo Produto.
export function buildApparelSystemPrompt(): string {
  return `Você é o motor de prompts APPAREL da Swell — estúdio de imagem por IA para vestuário.

Sua função: receber informação de uma peça (roupa/produto vestível) + estilo + categoria e devolver um prompt em inglês pronto para gerar imagem, seguindo a ESTRUTURA-MESTRE:

[1. TRAVA]     Preservação do produto — sempre primeiro
[2. DELTA]     O que a IA gera (cena, pessoa, luz)
[3. MEDIDA]    Specs físicas: cm, hex, lente mm, ângulo — nunca adjetivo
[4. MUNDO]     Bloco do estilo + bloco da categoria (VERBATIM, não parafraseie)
[5. ANTI]      Proibições nomeadas (do NOT ...)
[6. NEGATIVE]  Sempre presente, no campo negative do JSON

REGRAS DE OURO (obrigatórias):
1. Medida > adjetivo. "hem ends ~8cm below armpit" funciona; "cropped" sozinho não.
2. Nomear o comportamento ruim ("do NOT lengthen") funciona melhor que só pedir o bom.
3. Bloco de estilo + bloco de categoria vêm VERBATIM do input — não reescreva.
4. Palavras proibidas (empurram pro genérico e devem ser REMOVIDAS se aparecerem): beautiful, stunning, perfect, vibrant, amazing, high quality, professional (solto), 4k, 8k.
5. Se a categoria tem pessoa, adicionar o complemento de pele real e cabelo texturizado (fornecido).
6. Se a referência tem logo de terceiro (Nike, marcas), adicionar ao negative.

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "promptEN": "...",
  "negativeEN": "...",
  "instructionsPT": "...",
  "toolTips": "...",
  "warnings": ["..."]
}

- promptEN: prompt completo em inglês seguindo a estrutura-mestre, pronto para colar
- negativeEN: negative prompt em inglês (concatena base do estilo + específico da categoria + logos de terceiros da referência)
- instructionsPT: 3-5 passos em português de como usar (Magnific / ChatGPT), incluindo Style Strength recomendado quando Magnific
- toolTips: 1-2 dicas específicas — se ugc-selfie: sempre alertar para revisar o produto após gerar
- warnings: 0-2 avisos sobre limitações (detalhe <5%, texto muito pequeno, categoria de risco)`;
}

export function buildApparelUserMessage(info: ApparelInfo, scene: ApparelSceneInfo): string {
  const cat = APPAREL_CATEGORIES.find((c) => c.value === scene.category)!;
  const strengthRange = STYLE_STRENGTH_MATRIX[scene.category][scene.style];

  const productLock = buildProductLock(info);
  const styleBlock = STYLE_BLOCKS[scene.style];
  const personAddon = cat.hasPerson ? STYLE_PERSON_ADDON[scene.style] : "";
  const antiBlock = STYLE_ANTI[scene.style];
  const camera = CATEGORY_CAMERA[scene.category];
  const categoryBlock = CATEGORY_BLOCKS[scene.category];
  const categoryNegative = CATEGORY_NEGATIVE[scene.category] || "";
  const negativeBase = STYLE_NEGATIVE[scene.style];
  const banned = BANNED_WORDS.join(", ");

  return `Monte o prompt APPAREL com estes inputs:

PEÇA (referência do cliente):
- Tipo: ${info.garmentType || "(não informado — deduzir da referência)"}
- Corte/comprimento: ${info.fit || "(não informado)"}
- Cor: ${info.color || "(usar a referência)"}
- Tecido: ${info.fabric || "(usar a referência)"}
- Estampa/print: ${info.print || "(sem estampa ou usar a referência)"}
- Detalhes (ribana, gola, punho): ${info.details || "(usar a referência)"}
- Elementos a BLOQUEAR no negative: ${info.blocks || "(nenhum)"}
- Notas extras: ${info.notes || "-"}

ESTILO: ${scene.style} (${scene.style === "realista" ? "foto real" : "render 3D premium"})
CATEGORIA: ${scene.category} — ${cat.label} (${cat.desc})
TEM PESSOA: ${cat.hasPerson ? "Sim" : "Não"}
${cat.hasPerson ? `PERFIL DO MODELO: ${scene.modelProfile || "(não informado — sugerir alinhado com o público típico de e-commerce brasileiro)"}` : ""}
CENA/CONTEXTO: ${scene.scene || "(escolha algo adequado para a categoria)"}
COR HEX (fundo/marca): ${scene.colorHex || "(não informado)"}

BLOCOS VERBATIM PARA MONTAR O PROMPT (não parafraseie):

TRAVA (item 1):
${productLock}

CÂMERA (item 3):
${camera}

BLOCO DE ESTILO (item 4a — copie exatamente):
${styleBlock}
${personAddon ? `\n${personAddon}` : ""}

BLOCO DE CATEGORIA (item 4b — copie exatamente, ajustando placeholders [colchetes] conforme o input do cliente):
${categoryBlock}

ANTI (item 5):
${antiBlock}

NEGATIVE — combine base + específico + logos de terceiros do input.blocks:
Base: ${negativeBase}
${categoryNegative ? `Específico da categoria: ${categoryNegative}` : ""}

Style Strength recomendado (Magnific): ${strengthRange ? `${strengthRange[0]}–${strengthRange[1]}` : "categoria incompatível com este estilo — avise no warnings"}

Palavras proibidas (remova se aparecerem): ${banned}

Monte o JSON final agora.`;
}
