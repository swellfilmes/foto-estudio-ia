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
// [6b. NEGATIVE PESSOA] — os modos que a IA mais erra em humanos; obrigatório em toda categoria com pessoa
const NEG_PERSON =
  "deformed face, distorted facial features, asymmetric eyes, extra eyes, crossed eyes, malformed iris, uncanny valley face, waxy plastic skin, airbrushed doll skin, extra fingers, missing fingers, fused fingers, six fingers, mangled hands, extra hands, extra arms, extra limbs, deformed ears, malformed teeth, unnatural neck, warped body proportions, mannequin look";

// [REGRA HUMANO] — verbatim em toda categoria com pessoa: subordina o humano ao produto
// e empurra pro degrau confiável do dial (parcial/recortado > rosto frontal inteiro).
const HUMAN_RULE =
  "The person is CONTEXT for the product, never the subject: the product stays the sharp, well-lit hero, large and fully readable, never covered by fingers, hair or clothing. Favor natural partial framing — hands, forearms, a cropped torso, the body turned or seen from the side — over full frontal faces. Any visible face is a calm natural micro-moment and must be anatomically correct: two even eyes, natural hands with exactly five fingers, real skin texture, believable proportions. Realistic contact and shadows between the person and the product.";

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
  // ── Taxonomia Riverflow (funil: identificar → inspecionar → entender → desejar) ──
  // IDENTIFICAR — a base de marketplace, limpa e padronizada (conserta o "estúdio mid")
  "fundo-branco": {
    type: "Clean e-commerce product photo on white",
    delta: "Only generate the seamless white backdrop, the soft even light and the contact shadow.",
    block:
      "Pure marketplace product shot: the product perfectly centered on a clean pure-white to very light warm-grey seamless background, evenly and softly lit, with one subtle realistic contact shadow directly beneath. Consistent catalog framing with even breathing room. NO props, NO gradient drama, NO colored backdrop — absolute clarity and standardization, the way Amazon / Shopee / Mercado Livre listings require. The product razor sharp, true-to-life color, every label perfectly readable.",
    compositions: [
      "Straight-on eye-level front view, product centered on pure white, one soft contact shadow beneath, 100mm lens for zero distortion.",
      "Gentle three-quarter angle showing a hint of depth, still on pure clean white, soft even light, a subtle shadow to one side. 85mm.",
      "Slightly elevated angle (about 20 degrees) — better for products read from above like jars, pots and boxes — pure white, soft top light. 85mm.",
    ],
    style: "real", person: false, st: 18,
  },
  // INSPECIONAR — reduzir a dúvida sobre qualidade tátil/funcional
  detalhe: {
    type: "Macro detail product photograph",
    delta: "Only generate the lighting and the softly blurred surroundings.",
    block:
      "Extreme close-up that lets the buyer inspect what matters before buying — the texture, the finish, the applicator, the mechanism, the material weave, the label print. The key detail razor sharp, everything else melting into shallow focus. Reduces doubt about tactile and functional quality. 100mm macro lens.",
    compositions: [
      "Neutral macro: the product detail against a clean, out-of-focus neutral studio backdrop, raking side light revealing the relief of the texture, no distracting props.",
      "In-context macro: the same tight detail nested in a softly blurred environment that fits the product's world, warm directional light, a hint of a matching prop bokeh behind.",
    ],
    style: "real", person: false, st: 24,
  },
  // ENTENDER escala — produto na mão (sem modelo, só mão pra dar escala)
  "na-mao": {
    type: "Product-in-hand photograph",
    delta: "Only generate the hand, the setting, the light and background around it.",
    block:
      "A single hand (natural real skin from the wrist, realistic grip) holding, opening or using the product to communicate its REAL SCALE and how it is handled — ideal for small products (beauty, food, supplements, accessories). The product stays the sharp hero, large in frame; fingers only at the edges, NEVER covering the label or key details. Soft natural light, a softly blurred fitting background.",
    compositions: [
      "A hand holding the product up toward soft window light, product face to camera and razor sharp, cozy real background blurred, fingers at the edges only. 85mm shallow depth of field.",
      "Hand mid-action opening or using the product (twisting the cap, dispensing, unboxing), captured naturally, the mechanism visible, warm directional light. 50mm.",
    ],
    style: "real", person: false, negativeExtra: NEG_HANDS + ", fingers covering the product, product too small", st: 34,
  },
  // ENTENDER conteúdo — flat lay, kit/props vistos de cima
  "flat-lay": {
    type: "Overhead flat-lay product photograph",
    delta: "Only generate the surface, the matching props and the even top light around it.",
    block:
      "A top-down flat-lay: the product arranged from directly above with a curated set of 2-4 matching props, ingredients or kit pieces from its own universe, laid out with balanced editorial composition and breathing room. Great for beauty, food, stationery and gift sets. Soft even overhead light with one gentle unified shadow. Square-friendly, clean and intentional — tells the whole story of the product or routine at a glance.",
    compositions: [
      "Perfectly overhead, the product as the anchor with a symmetrical arrangement of matching props on a surface that fits its world (linen, marble, wood, kraft paper), soft even light. 50mm top-down.",
      "Overhead off-center rule-of-thirds composition, a looser lifestyle scatter of related props and ingredients, warm directional top light casting soft real shadows. 35mm top-down.",
    ],
    style: "real", person: false, st: 30,
  },
  // DESEJAR (contexto) — lifestyle, produto vivendo numa cena real, aspiracional
  lifestyle: {
    type: "Lifestyle product photograph in a real setting",
    delta: "Only generate the real everyday environment, props, light and background around it.",
    block:
      "The product living in a real, believable everyday setting that fits its world and its moment of use (a morning kitchen counter, a cozy bathroom shelf, a sunny café table, a work desk — whatever matches the product). Warm natural light, specific real props of that world softly present, gentle depth of field. Aspirational but honest — the buyer should picture themselves using it. NOT a studio, NOT a staged ad.",
    compositions: [
      "The product on a real surface in its natural habitat, morning window light, a couple of authentic props of its world softly out of focus, generous negative space. 35mm.",
      "Closer intimate angle, the product mid-life (just used, lid off, steam or condensation as fits), warm golden light, shallow focus. 50mm.",
    ],
    style: "real", person: false, st: 34,
  },
  // DESEJAR (campanha) — hero shot, impacto, espaço pra headline
  hero: {
    type: "Hero campaign product photograph",
    delta: "Only generate the campaign set, props, dramatic lighting and background around it.",
    block:
      "A striking HERO campaign image built to stop the scroll and create desire — the kind used for launches, paid ads, email banners and landing pages. ONE strong visual idea, elaborate art direction, dramatic sculpted studio lighting, a few intentional premium props, and GENEROUS clean space reserved for a headline. Bold, premium, aspirational — impact over explanation. The product is the unmistakable hero. Build a bold set that fits THIS product's universe (inferred from the product described above).",
    compositions: [
      "The product elevated on a sculptural pedestal or floating, dramatic single key light with deep shadow, a committed bold color backdrop matching the product's world, wide headline space above. 85mm.",
      "Dynamic hero with motion and atmosphere fitting the product (splash, powder, petals, light streaks or smoke), the product frozen center-frame, cinematic rim light. 50mm.",
      "Symmetrical poster composition, the product large and central, haze and a premium color grade, clean room for a tagline. 100mm.",
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
  // ── Presença humana = dial subordinado ao produto (mãos → parcial → inteiro).
  // Leque sempre com o enquadramento MAIS SEGURO primeiro (variações padrão = 0 e 1).
  // NO CORPO — worn scale: prova fit/escala com o corpo de régua, recorte na parte
  "estudio-modelo": {
    type: "On-body worn-scale product photograph",
    delta: "Only generate the relevant body part, the skin, styling, lighting and background around it.",
    block:
      "The product WORN or held against the exact body part it belongs to, cropped tight to that zone to prove REAL SCALE and FIT with the body as the ruler — a ring or bracelet on a hand and wrist, a necklace or pendant on a neck and décolletage, earrings beside the jaw, a watch on a wrist, apparel on a torso, a cosmetic swatch on skin or lips. No full face and no full body needed — just enough body to read scale and how it sits. The commercial job is FIT and SCALE. Clean neutral styling so the product is the only strong element, soft even editorial light, the product the sharp hero.",
    compositions: [
      "Tight crop on the body zone the product relates to (hand, wrist, neckline, ear, forearm), the product worn and razor sharp, natural skin in soft even light, plain out-of-focus neutral backdrop, NO face in frame. 100mm.",
      "Slightly wider worn shot showing the body part in a calm natural gesture (a relaxed hand, a turned neck), the product catching the key light, neutral styling, gentle side light sculpting the skin, face cropped out or turned away. 85mm.",
    ],
    style: "real", person: true, negativeExtra: NEG_PERSON, st: 30,
  },
  // EM USO — manuseio/rotina: mãos + torso recortado usando, sem rosto
  "mostruario-modelo": {
    type: "Product-in-use photograph",
    delta: "Only generate the hands, partial body, the action, setting, lighting and shadows around it.",
    block:
      "The product actively IN USE by a partial model — hands and a cropped torso applying, operating, pouring, wearing or demonstrating it in a believable moment. The commercial job is to show HOW IT WORKS so the shopper gets it instantly. Favor hands and a cropped body over any full face; the product is sharp, central and mid-action. Clean catalog-grade light or a soft real setting that fits the product.",
    compositions: [
      "Close on the hands using the product as intended (applying, opening, operating, pouring), the mechanism or result clearly visible, product sharp and central, NO face in frame, soft directional light, backdrop softly blurred. 100mm.",
      "Cropped-torso use shot: waist-up or over-the-shoulder, a cropped body mid-gesture using the product, face out of frame or turned away, the action reading clearly, clean solid or soft real backdrop. 50mm.",
    ],
    style: "real", person: true, negativeExtra: NEG_PERSON, st: 32,
  },
  // CLIENTE REAL — UGC/depoimento: único com rosto, mas produto na frente e rosto secundário
  influencia: {
    type: "Authentic UGC customer smartphone photo",
    delta: "Only generate the person, hand, setting, lighting and background around it.",
    block:
      "Must look like a REAL PHOTO A CUSTOMER TOOK for TikTok Shop, Instagram or a marketplace review — never a produced ad. A young Brazilian person, casual, in a cozy everyday home with soft domestic or window light, holding and showing the product to the phone. The commercial job is TRUST from a real peer: the PRODUCT IS THE PROTAGONIST — shown whole, large, clearly recognizable, held near the chest or face to draw the eye, in a natural position of use; the person's face is soft and secondary, never a posed stock smile at the camera. Small honest phone-photo imperfections (slight motion, uneven light, real skin). Keep the product's shape, colors, design, proportions and finish exactly as in the reference.",
    compositions: [
      "Hands-only close review: both hands holding and turning the product toward the phone over a real home surface, NO face in frame, natural window light, the product filling much of the frame.",
      "Chest-height show-to-camera: waist-up phone photo, the product held forward at chest level facing the lens and razor sharp, fingers only at the edges, the face soft and secondary (half in frame or glancing DOWN at the product, not a posed smile), everyday kitchen or desk softly blurred behind.",
      "Held beside the face, candid: the person looking DOWN at the product held up near the cheek (not staring at the camera), warm lamp + window light, cozy room bokeh, product big and clear.",
    ],
    style: "real", person: true, negativeExtra: NEG_PERSON + ", fingers covering the product, product too small, floating product, pasted-on look, studio lighting, glossy advertising look", st: 42, review: true,
  },
  // CAMPANHA — único com modelo inteiro; de perfil/costas primeiro, QA forte, marcado como risco
  "comercial-modelo": {
    type: "Advertising campaign photograph with a model",
    delta: "Only generate the model, campaign world, action, lighting and background around it.",
    block:
      "A real ADVERTISING CAMPAIGN with a model — NOT a selfie, NOT UGC, NOT a casual phone photo. Cinematic art direction: a model interacting with the product inside a bold campaign WORLD that fits the product's universe (inferred from the product described above), professional lighting with mood, generous space for a headline. The commercial job is DESIRE and brand aspiration. Even here the product stays the unmistakable hero, sharp and readable; the model serves the product. Favor a confident restrained pose over a posed smile.",
    compositions: [
      "Editorial medium shot, the model three-quarter and slightly turned, the product held with intention at chest height and razor sharp, strong rim light separating her from a dramatic campaign backdrop, calm non-smiling gaze off camera. 85mm.",
      "The model seen from behind or in profile presenting the product forward into the light within a committed campaign environment, so the focus stays on the product, cinematic directional light and atmosphere. 50mm.",
      "Wide campaign frame, the model in motion using the product inside a bold set fitting the product, the product clearly the hero, headline space around. 35mm.",
    ],
    style: "real", person: true, negativeExtra: NEG_PERSON, st: 40, review: true,
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
  tone?: string;      // ex: "premium e minimalista"
  colorHex?: string;  // cor principal da marca — guia fundo/set, nunca o produto
  mood?: string;      // clima visual: clean, quente, escuro, colorido
  human?: string;     // presença humana preferida da marca
  palette?: string[]; // paleta da marca — guia fundo/acentos (nunca recolore o produto)
  scenario?: string;  // cenário preferido da marca
  forbidden?: string; // o que nunca deve aparecer nas fotos
}

function brandLine(b?: BrandDirection): string {
  if (!b) return "";
  const parts: string[] = [];
  if (b.colorHex) parts.push(`the brand's primary color ${b.colorHex} may guide the backdrop and set accents (NEVER recolor the product itself)`);
  if (b.palette && b.palette.length) parts.push(`keep the backdrop and set accents within the brand palette (${b.palette.join(", ")}) — never recolor the product`);
  if (b.tone) parts.push(`brand tone: ${b.tone}`);
  if (b.mood) parts.push(`overall visual mood: ${b.mood}`);
  if (b.scenario) parts.push(`preferred scene: ${b.scenario}`);
  if (b.human) parts.push(`human presence preference: ${b.human}`);
  let line = parts.length ? `Brand direction: ${parts.join("; ")}.` : "";
  if (b.forbidden && b.forbidden.trim()) line += ` STRICTLY AVOID (brand rules): ${b.forbidden.trim()}.`;
  return line.trim();
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
    c.person ? HUMAN_RULE : "",
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
