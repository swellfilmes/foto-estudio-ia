// Motor de cena do Modo Produto — arquitetura portada da skill apparel-prompt-engine:
// blocos VERBATIM por categoria (nunca parafraseados a cada geração), negative
// obrigatório, style strength da matriz por categoria, ANTI nomeado.
// O Claude só entra quando há pedido específico do cliente — e mesmo aí os blocos
// fixos (trava, exclusões, fecho) não podem ser parafraseados.

import { ProductInfo } from "./types";

export interface SceneAssembly {
  promptEN: string;
  negative: string;
  styleStrength: number; // ponto médio da faixa da matriz
  needsReview: boolean;  // categoria de risco (SS alto) — revisar fidelidade após gerar
}

// [1. TRAVA] — sempre primeiro, antes de qualquer criativo
const TRAVA =
  "Follow the reference image closely. Do not recreate, alter, or replace the product. Keep its colors, design, shape, materials, finish and label/print exactly as shown in the reference photo.";

// Blocos de ESTILO (verbatim — regra 6: parafrasear = deriva visual)
const STYLE_REAL =
  "Photorealistic commercial photography. Real material texture with visible surface detail and natural imperfections. Physically accurate lighting with defined direction and soft natural shadows. Subtle sensor grain. Realistic depth of field.";
const STYLE_REAL_PERSON =
  "Natural skin texture with visible pores and micro imperfections, no retouching look. Real hair texture. Expression as a quiet natural micro-moment (calm focus, glancing away, absorbed in what they are doing) — never a posed stock smile, never laughing at the camera.";
const STYLE_RENDER =
  "High-end 3D product render, octane/redshift quality. Physically-based materials with accurate surface response, soft subsurface scattering where the material is translucent, accurate cloth or surface simulation. Studio HDRI lighting, soft gradient background, gentle contact shadow and subtle reflection under the product.";

// [5. ANTI] — nomear o comportamento ruim funciona melhor que pedir o bom
const ANTI_REAL =
  "NOT CGI, NOT 3D render, NOT illustration, no plastic surfaces, no perfectly smooth artificial surfaces, not a staged stock photo.";
const ANTI_RENDER =
  "NOT a photograph in a real location, no photographic grain, no candid imperfections — clean controlled render aesthetic.";

const EXCLUSOES =
  "No third-party logos, no competitor brands, no invented text — only the product's existing label.";
const FECHO =
  "A single full-frame photograph — no collage, no grid, no split panels.";

// [6. NEGATIVE] — obrigatório sempre
const NEG_REAL =
  "CGI, 3D render, illustration, cartoon, plastic surfaces, oversmooth, oversaturated, artificial lighting without direction, stock photo pose, watermark, text overlay";
const NEG_RENDER =
  "photographic grain, candid photo, messy background, low-poly, game asset look, plastic cheap material, flat shading, harsh reflections, watermark, text overlay";
const NEG_HANDS =
  "extra fingers, deformed hands, mannequin hands, plastic skin";

interface CategoryDef {
  type: string;            // [TIPO DE FOTO]
  delta: string;           // [2. DELTA] o que a IA gera — explícito
  block: string;           // [4. MUNDO] bloco verbatim da categoria
  compositions?: string[]; // leque de composições fixas — cada variação usa uma diferente
  style: "real" | "render";
  person: boolean;
  negativeExtra?: string;
  st: number;              // Style Strength (ponto médio da matriz)
  review?: boolean;        // categoria de risco — revisar produto após gerar
}

const CATEGORIES: Record<string, CategoryDef> = {
  estudio: {
    type: "Studio packshot",
    delta: "Only generate the backdrop, surface, lighting and shadows around it.",
    block:
      "Product photography on a seamless studio backdrop with a gentle gradient — never a flat dead background. The product front-facing, centered, with breathing room around it, standing on a real surface (light marble, pale wood or textured paper). Soft even studio lighting, key from camera-left at 45 degrees, one gentle natural shadow beneath the product. 85mm lens, shallow depth of field.",
    style: "real", person: false, st: 25,
  },
  mostruario: {
    type: "Editorial retail display photograph",
    delta: "Only generate the display, props, lighting and background around it.",
    block:
      "The product on a store display shelf or stand, arranged with 2-3 specific props from its own universe, composed with depth like a live storefront. Directional display lighting from above at 30 degrees, soft but defined shadow edges. 35mm lens.",
    style: "real", person: false, st: 25,
  },
  comercial: {
    type: "Candid lifestyle photograph",
    delta: "Only generate the scene, environment, lighting and background around it.",
    block:
      "The product in a real everyday setting appropriate to its category, surrounded by specific named objects (a lived-in table, real utensils, a window in the background), caught mid-use — being set down, opened or used. Warm natural window light matching the time of day, long soft shadows. 35mm lens with subtle film grain, natural framing. The moment feels caught, not staged — NOT advertising, NOT stock photo.",
    style: "real", person: false, st: 35,
  },
  cg: {
    type: "High-end 3D product visualization",
    delta: "Only generate the environment, lighting and reflections around it.",
    block:
      "Precise specular reflections, controlled highlights, rich physically-based materials. 85mm perspective.",
    compositions: [
      "Monochrome sculptural set: podium, floor and background all in one single color family sampled from the product itself, strong geometric shadow play from one hard light, the product as the only contrasting element.",
      "Raw-material backdrop: the product resting on a dramatic oversized surface of its own ingredient or material (cocoa, fabric weave, stone, citrus peel — whichever matches the product), macro scale contrast between texture and product.",
      "Suspended moment: the product floating center-frame with a few related elements frozen mid-air around it in a slow-motion feel, deep gradient background, dual cool rim lights.",
    ],
    style: "render", person: false, st: 40,
  },
  detalhe: {
    type: "Macro editorial photograph",
    delta: "Only generate the lighting and the out-of-focus surroundings.",
    block:
      "Extreme close-up of one area of the product (label, seam or surface texture), raking side light revealing the relief of the texture, the detail razor sharp and the rest dissolving into shallow focus. 100mm macro lens.",
    style: "real", person: false, st: 25,
  },
  influencia: {
    type: "Candid front-facing smartphone photo",
    delta: "Only generate the person, setting, lighting and background around it.",
    block:
      "A real Brazilian person VISIBLE from the waist up, in a real domestic setting (bedroom or lived-in kitchen), at arm's length with a slight tilt and natural lens distortion. Natural window light, no flash. Genuine unposed expression. The viewer must believe a real customer took this photo.",
    compositions: [
      "Casual show: the person holds the product relaxed at chest height, calm genuine expression toward the camera — like a quick photo for a friend, NOT an influencer ad pose, NOT pointing at the product.",
      "Caught in use: the person is actually using the product in the scene, eyes on the product, completely unaware of the camera — a moment someone else photographed.",
    ],
    style: "real", person: true, negativeExtra: NEG_HANDS, st: 50, review: true,
  },
  "estudio-modelo": {
    type: "Editorial studio photograph",
    delta: "Only generate the model, backdrop, lighting and shadows around it.",
    block:
      "A Brazilian model framed from the waist up on a seamless gradient backdrop, the product as the protagonist. Soft editorial key from camera-right at 45 degrees, subtle rim light, soft floor shadow. Confident restrained pose, editorial gaze — premium is restraint, not a smiling stock pose. Styling in neutral basics so the product is the only strong color. 85mm, shallow depth of field focusing the product.",
    compositions: [
      "Three-quarter turn, gaze off camera into the distance, the product held loosely at waist height catching the key light — the model is elegant context, not a presenter.",
      "Quiet focus: the model looking DOWN at the product in her hands, absorbed, profile-leaning composition, the product at the brightest point of the frame.",
      "Seated on an apple box, relaxed editorial posture, the product resting on her knee or beside her hand, eyes away from camera.",
    ],
    style: "real", person: true, negativeExtra: NEG_HANDS, st: 30,
  },
  "comercial-modelo": {
    type: "Candid lifestyle campaign photograph",
    delta: "Only generate the model, scene, lighting and background around it.",
    block:
      "A real everyday setting (street café, urban sidewalk or a home living room) with specific named details, warm natural light appropriate to the setting and time of day. 35mm lens, natural framing — the moment feels caught, not staged, NOT advertising, NOT stock photo.",
    compositions: [
      "Living the scene: the model mid-action using the product naturally, completely unaware of the camera, gaze on what she is doing, foreground elements slightly out of focus adding depth.",
      "Product hero with human presence: the product in sharp focus on the table/surface in the foreground, the model softly blurred in the background living the scene — her presence tells the story, the product owns the frame.",
    ],
    style: "real", person: true, negativeExtra: NEG_HANDS, st: 35,
  },
  "mostruario-modelo": {
    type: "Editorial product presentation photograph",
    delta: "Only generate the model, backdrop, lighting and shadows around it.",
    block:
      "A model framed from the waist up on a solid color backdrop with a gentle gradient, the product in the central third of the frame and in sharp focus. Clean frontal-top catalog lighting, one soft shadow. 50mm lens.",
    compositions: [
      "Still catalog presentation: the product held steady toward the lens at chest height, the model's expression neutral and composed, face slightly soft in focus so the product stays the hero.",
      "Offering gesture: the product held out on an open palm at frame center, the model looking at the product (not the camera), calm museum-like restraint.",
    ],
    style: "real", person: true, negativeExtra: NEG_HANDS, st: 30,
  },
};

// [3. MEDIDA] — specs físicas do produto analisado, com trava de rótulo
function measureLine(p: ProductInfo): string {
  const parts = [`Product: ${p.name || "as shown in the reference"}.`];
  if (p.color) parts.push(`Color: ${p.color}.`);
  if (p.material) parts.push(`Material: ${p.material}.`);
  if (p.size) parts.push(`Approximate size: ${p.size}.`);
  if (p.hasLabel && p.labelText) {
    parts.push(
      `Keep the label/print exactly as in the reference ("${p.labelText}"${p.labelPosition ? `, ${p.labelPosition}` : ""}), do not redraw the lettering.`
    );
  }
  return parts.join(" ");
}

// Estrutura-mestre: [TIPO] → [TRAVA] → [DELTA] → [MEDIDA] → [MUNDO] → [COMPOSIÇÃO] → [ANTI] → [EXCLUSÕES] → [FECHO]
// `variant` escolhe a composição do leque — variações do mesmo clique saem com
// composições diferentes (mata a monotonia sem perder o verbatim).
export function assembleScene(categoryKey: string, product: ProductInfo, variant = 0): SceneAssembly {
  const c = CATEGORIES[categoryKey];
  if (!c) throw new Error(`Categoria desconhecida: ${categoryKey}`);

  const styleBlock =
    c.style === "render" ? STYLE_RENDER : STYLE_REAL + (c.person ? " " + STYLE_REAL_PERSON : "");
  const anti = c.style === "render" ? ANTI_RENDER : ANTI_REAL;
  const composition = c.compositions?.length
    ? c.compositions[variant % c.compositions.length]
    : "";

  const promptEN = [
    `${c.type}.`,
    TRAVA,
    c.delta,
    measureLine(product),
    c.block,
    composition,
    styleBlock,
    anti,
    EXCLUSOES,
    FECHO,
  ].filter(Boolean).join(" ");

  const negative = [c.style === "render" ? NEG_RENDER : NEG_REAL, c.negativeExtra]
    .filter(Boolean)
    .join(", ");

  return { promptEN, negative, styleStrength: c.st, needsReview: !!c.review };
}
