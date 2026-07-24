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
  "Follow the reference images closely for the PRODUCT ONLY. Do not recreate, alter, or replace the product — keep its exact colors, design, shape, materials, finish and label/print as shown across the reference photos (use every reference angle to understand the product in full).";

// [1b. CENA NOVA] — a referência trava só o produto; o cenário é sempre construído do zero
const NEW_ENV =
  "IMPORTANT: build a COMPLETELY NEW environment around the product. The reference photos define ONLY the product itself — never reproduce, imitate or keep the background, surface, table, floor or setting from the reference photos. The scene, backdrop and every surrounding element must be freshly generated for this shot.";

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
      "Clean premium studio product photography on a seamless backdrop with a gentle gradient — never a flat dead background. Soft, sculpted studio lighting with intention.",
    compositions: [
      "Front three-quarter view, eye-level, product standing on light marble with a soft floor reflection, key light from camera-left at 45 degrees plus a subtle rim, seamless warm-grey gradient behind. 85mm, shallow depth of field.",
      "Slightly elevated top-down angle (about 30 degrees), product on textured pale paper, one soft directional shadow raking to the right, minimal negative space above for breathing room. 50mm.",
      "Low hero angle looking slightly up, product on a raised stone plinth against a darker moody gradient, dramatic single key with controlled falloff and a bright specular edge. 100mm.",
    ],
    style: "real", person: false, st: 22,
  },
  mostruario: {
    type: "Editorial retail display photograph",
    delta: "Only generate the display, hands/use, props, lighting and background around it.",
    block:
      "The product shown as it lives in real use — a display or in-use moment that makes a shopper want it. Directional, characterful lighting.",
    compositions: [
      "In-use hero: a hand (natural skin texture, from the wrist) holding or operating the product mid-gesture, the product razor sharp and large in frame, a softly blurred real environment behind fitting the product. 50mm.",
      "Live storefront display: the product on a designed retail shelf or stand with 2-3 specific props from its own universe, depth and reflections like a boutique window, directional light from above at 30 degrees. 35mm.",
      "Flat-lay from directly overhead: the product arranged with a curated set of matching props on a surface that fits its world, balanced editorial composition, soft even top light. 35mm.",
    ],
    style: "real", person: false, st: 30,
  },
  comercial: {
    type: "Bold advertising campaign photograph",
    delta: "Only generate the campaign world, environment, action, lighting and background around it.",
    block:
      "A striking ADVERTISING CAMPAIGN image — not a quiet lifestyle snapshot. Build a bold, purpose-built campaign WORLD that fits THIS specific product's universe, inferred from the product described above (for example: an action camera or sports gear → a dynamic outdoor adventure/extreme-sport scene with motion, spray, dust or speed; a gourmet food or drink → a rich artisanal or celebratory table with atmosphere; a cosmetic or fragrance → a sensorial, editorial spa-like or fashion set; a tech gadget → a sleek modern lifestyle environment). Cinematic advertising lighting with intention and mood, strong art direction, generous negative space for a headline. The product is the unmistakable hero of the campaign.",
    compositions: [
      "Wide cinematic campaign frame: the product hero in its bold campaign world with real depth and atmosphere (motion, elements, weather or ambience fitting the product), dramatic directional light, headline space to one side. 35mm.",
      "Dynamic close campaign angle: tighter on the product mid-action within the campaign world, energy and movement around it (splash, dust, light streaks or steam as fits), strong rim light. 50mm.",
      "Poster hero: the product large and central against a committed campaign environment, symmetrical confident art direction, cinematic key and haze, premium mood. 85mm.",
    ],
    style: "real", person: false, st: 42,
  },
  cg: {
    type: "High-end 3D product visualization",
    delta: "Only generate the environment, lighting and reflections around it.",
    block:
      "Precise specular reflections, controlled highlights, rich physically-based materials.",
    compositions: [
      "Eye-level monochrome sculptural set: podium, floor and background in one single color family sampled from the product itself, strong geometric shadow play from one hard light, the product the only contrasting element. 85mm.",
      "Overhead on a raw-material backdrop: the product resting on a dramatic oversized surface of its own ingredient or material (cocoa, fabric weave, stone, citrus peel — whatever matches), macro scale contrast. 50mm top-down.",
      "Low-angle suspended moment: the product floating center-frame with a few related elements frozen mid-air in slow-motion feel, deep gradient background, dual cool rim lights. 100mm.",
    ],
    style: "render", person: false, st: 40,
  },
  detalhe: {
    type: "Macro editorial photograph",
    delta: "Only generate the lighting and the out-of-focus surroundings.",
    block:
      "Extreme close-up revealing the craft of the product — texture, label, seam or material. The detail razor sharp, the rest dissolving into shallow focus. 100mm macro lens.",
    compositions: [
      "Neutral macro: the product detail against a clean, out-of-focus neutral studio backdrop, raking side light revealing the relief of the texture, no distracting props.",
      "In-context macro: the same tight detail but nested in a softly blurred environment that fits the product's world, warm directional light, a hint of a matching prop bokeh behind.",
    ],
    style: "real", person: false, st: 24,
  },
  influencia: {
    type: "Authentic UGC customer smartphone selfie",
    delta: "Only generate the person, hand, setting, lighting and background around it.",
    block:
      "Must look like a REAL PHOTO A CUSTOMER TOOK — credible for TikTok Shop, Instagram and marketplace — NOT a produced ad. A young Brazilian person with a casual look, front-facing selfie at arm's length with slight lens distortion, in a cozy everyday home setting fitting the product's vibe. Soft domestic or natural window light, no studio look. Simple pose, spontaneous genuine expression, small natural photographic imperfections (slight motion, uneven light, real skin). PRODUCT IS THE PROTAGONIST even with a person present: show it whole or nearly whole, large enough to recognize clearly, held near the face or chest to draw attention, in a natural position of use or presentation. The hand holds the product plausibly — correct finger placement, believable scale and contact, real shadows, NEVER fingers covering the label, face or key details, never a floating or pasted-on look. Keep the product's shape, colors, face/design, proportions, glossy finish and any ring/clasp exactly as in the reference.",
    compositions: [
      "Selfie holding it up by the face: front-facing phone selfie, the person smiling softly, holding the product right beside their cheek so it reads big and clear, cozy bedroom or living-room background softly blurred, warm lamp + window light.",
      "Chest-height show to camera: waist-up selfie, the product held forward at chest level facing the lens, fingers only at the edges so nothing important is covered, casual outfit, everyday kitchen or desk setting behind.",
      "Mirror selfie: phone visible in a mirror reflection, the product held up in the free hand near the face, full casual outfit visible, real home clutter softly out of focus, natural imperfections in the glass.",
    ],
    style: "real", person: true, negativeExtra: NEG_HANDS + ", fingers covering the product, product too small, floating product, pasted-on look, studio lighting, glossy advertising look", st: 48, review: true,
  },
  "estudio-modelo": {
    type: "Editorial studio photograph",
    delta: "Only generate the model, backdrop, lighting and shadows around it.",
    block:
      "A Brazilian model on a seamless gradient backdrop with real photographic direction, the product as the protagonist. Soft editorial key from camera-right at 45 degrees, subtle rim light, soft floor shadow. Confident restrained pose, editorial gaze — premium is restraint, not a smiling stock pose. Styling in neutral basics so the product is the only strong color.",
    compositions: [
      "FULL-BODY editorial: the model head-to-toe with generous headroom, three-quarter turn, gaze off camera, the product held loosely at waist height catching the key light — architectural fashion-campaign framing. 50mm.",
      "TORSO-AND-HEAD crop (waist up): tight editorial framing, the model looking DOWN at the product in her hands, absorbed, product at the brightest point of the frame. 85mm shallow depth of field.",
      "Half-body seated on an apple box, relaxed editorial posture, the product resting on her knee or beside her hand, eyes away from camera, side light sculpting the face. 85mm.",
    ],
    style: "real", person: true, negativeExtra: NEG_HANDS, st: 32,
  },
  "comercial-modelo": {
    type: "Bold advertising campaign photograph with a model",
    delta: "Only generate the model, campaign world, action, lighting and background around it.",
    block:
      "A real ADVERTISING CAMPAIGN with a model — NOT a selfie, NOT UGC, NOT a casual phone photo. Cinematic art direction: a model interacting with the product inside a bold campaign WORLD that fits the product's universe (inferred from the product described above), professional campaign lighting with mood and intention, generous space for a headline. Polished, aspirational, magazine-ad quality.",
    compositions: [
      "Wide campaign frame: the model in motion using or presenting the product within a committed campaign environment fitting the product, cinematic directional light and atmosphere, the product clearly readable as the hero. 35mm.",
      "Editorial medium shot: the model three-quarter, product held with intention at chest height, strong rim separating her from a dramatic campaign backdrop, confident non-smiling editorial gaze. 85mm.",
    ],
    style: "real", person: true, negativeExtra: NEG_HANDS, st: 40,
  },
  "mostruario-modelo": {
    type: "Editorial product presentation photograph",
    delta: "Only generate the model, use, backdrop, lighting and shadows around it.",
    block:
      "The product shown IN USE by a model — someone actually wearing, holding-in-use or demonstrating it — so a shopper sees how it works and wants it. Clean catalog-grade lighting, the product always the sharp hero.",
    compositions: [
      "In-use demonstration: the model actively using the product as intended (wearing it, operating it, applying it), mid-gesture, product sharp and central, clean solid-color backdrop with a gentle gradient. 50mm.",
      "Offering gesture: the product held out on an open palm at frame center, the model looking at the product (not the camera), calm museum-like restraint, soft catalog light. 85mm.",
      "Close use-detail: tight on the model's hands using the product against a softly blurred solid backdrop, the mechanism or fit clearly visible. 100mm.",
    ],
    style: "real", person: true, negativeExtra: NEG_HANDS, st: 32,
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

// Perfil de marca do lojista ("Minha Marca") — vira um slot do prompt.
export interface BrandDirection {
  tone?: string;     // ex: "premium e minimalista"
  colorHex?: string; // cor principal da marca — guia fundo/set, nunca o produto
  mood?: string;     // clima visual: clean, quente, escuro, colorido
  human?: string;    // presença humana preferida da marca
}

function brandLine(b?: BrandDirection): string {
  if (!b) return "";
  const parts: string[] = [];
  if (b.colorHex) parts.push(`the brand's primary color ${b.colorHex} may guide the backdrop and set accents (NEVER recolor the product itself)`);
  if (b.tone) parts.push(`brand tone: ${b.tone}`);
  if (b.mood) parts.push(`overall visual mood: ${b.mood}`);
  if (b.human) parts.push(`human presence preference: ${b.human}`);
  return parts.length ? `Brand direction: ${parts.join("; ")}.` : "";
}

// Estrutura-mestre: [TIPO] → [TRAVA] → [DELTA] → [MEDIDA] → [MARCA] → [MUNDO] → [COMPOSIÇÃO] → [ANTI] → [EXCLUSÕES] → [FECHO]
// `variant` escolhe a composição do leque — variações do mesmo clique saem com
// composições diferentes (mata a monotonia sem perder o verbatim).
export function assembleScene(categoryKey: string, product: ProductInfo, variant = 0, brand?: BrandDirection): SceneAssembly {
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
    NEW_ENV,
    c.delta,
    measureLine(product),
    brandLine(brand),
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
