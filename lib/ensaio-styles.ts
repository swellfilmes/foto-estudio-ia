// Catálogo de estilos do Ensaio de Pessoa — direção Swell.
// Cada estilo é um bloco de prompt em EN, verbatim.
// Personalizar depois é editar aqui — não parafrasear entre gerações
// pra manter consistência visual da marca.

export type EnsaioStyleId =
  | "editorial-minimalista"
  | "street-bw"
  | "praia-dourada"
  | "rooftop-urbano"
  | "corporativo-clean"
  | "fashion-estudio"
  | "coffee-shop"
  | "nature-outdoor";

export interface EnsaioStyle {
  id: EnsaioStyleId;
  name: string;
  description: string;      // 1 linha, o que é
  icon: string;             // emoji
  aspectRatio: string;      // "4:5" | "3:4" | "1:1"
  promptBlock: string;      // bloco EN pronto (mundo + luz + câmera + mood)
  suggestions: string[];    // sugestões pro campo livre de ajuste
}

// TRAVA DE IDENTIDADE — aparece em todos os prompts, antes do bloco de estilo.
// É o que garante que a IA não altera o rosto/corpo da pessoa.
export const IDENTITY_LOCK = `Follow the reference photo(s) closely and preserve the exact facial identity, features, skin tone, hair color and hair texture, and body proportions of the person shown. Do not alter, restyle or invent facial features — only build the scene, wardrobe styling variation and lighting around the same person.`;

// ANTI-IA — proibições universais que empurram pra "cara de foto real".
export const UNIVERSAL_ANTI = `Photorealistic photography. Natural skin texture with visible pores and micro-imperfections, no plastic skin, no over-retouching. Real hair with texture. Genuine unposed micro-moment expression (glancing, mid-breath, half-smile), never a stiff stock-photo pose. Subtle sensor grain. NOT CGI, NOT 3D render, NOT illustration, no oversmooth surfaces, no artificial lighting without direction, no watermark, no text overlay.`;

// NEGATIVE base — sempre presente.
export const UNIVERSAL_NEGATIVE = `plastic skin, oversmooth, over-retouched, waxy doll skin, cartoon, 3D render, CGI, illustration, stiff pose, stock-photo smile, distorted face, asymmetric eyes, crossed eyes, malformed iris, uncanny valley face, extra fingers, missing fingers, fused fingers, six fingers, deformed hands, mangled hands, extra limbs, deformed ears, malformed teeth, unnatural neck, warped body proportions, watermark, text on image, blurry, low quality, altered facial features, different person, wrong identity`;

export const ENSAIO_STYLES: EnsaioStyle[] = [
  {
    id: "editorial-minimalista",
    name: "Editorial minimalista",
    description: "Fundo neutro, luz suave, expressão contida. Vibe capa de revista quieta.",
    icon: "📷",
    aspectRatio: "4:5",
    promptBlock: `Editorial fashion photograph on a seamless studio backdrop in warm off-white (#F2ECE0). Soft diffused key light from camera-left at 45°, gentle fill from the right, subtle floor shadow. Half-body composition from hips up, 85mm lens with shallow depth of field focusing on the subject. Wardrobe: neutral basics — a well-cut cream or off-white top and simple bottoms, no strong colors. Restrained editorial gaze, chin slightly down, one hand resting naturally. Mood: quiet luxury, Kinfolk magazine energy, premium is restraint. Warm 4200K color temperature.`,
    suggestions: [
      "Fundo em cor específica (ex: bege queimado, verde-oliva claro)",
      "Roupa de cor da marca",
      "Corpo inteiro em vez de meio corpo",
      "Óculos de armação fina",
    ],
  },

  {
    id: "street-bw",
    name: "Street B&W",
    description: "Rua urbana, alto contraste preto e branco, atmosfera espontânea.",
    icon: "🖤",
    aspectRatio: "4:5",
    promptBlock: `Candid black and white street photography. High-contrast monochrome, deep blacks and clean highlights, silver-gelatin film look. Urban sidewalk setting with visible architectural detail (brick wall, storefront window, street pole) slightly out of focus in the background. Hard directional sunlight cutting across the frame from camera-left, sharp shadow on the far cheek. 35mm lens, natural walking framing, subject caught mid-step or looking sideways off-frame — never posed. Wardrobe: dark neutrals (black jacket, denim, cotton tee). Mood: Magnum agency documentary, cinematic and observational.`,
    suggestions: [
      "Chuva na rua",
      "Neblina fina",
      "Cigarro na mão / xícara de café",
      "Rua específica (nome de cidade)",
    ],
  },

  {
    id: "praia-dourada",
    name: "Praia dourada",
    description: "Litoral em golden hour, luz quente, tom natural e leve.",
    icon: "🌅",
    aspectRatio: "4:5",
    promptBlock: `Warm golden hour beach photograph, real coastline setting with visible wet sand, gentle wave breaking softly in the mid-ground, slight lens flare from a low sun behind the subject. Warm 3200K rim light backlighting the hair and shoulders, soft warm bounce light on the face from below (sand reflection). 50mm lens, natural framing, subject standing barefoot slightly turned toward the water, gaze soft into the middle distance. Wardrobe: relaxed linen or light cotton in cream, sand or terracotta tones — never bright synthetic colors. Mood: unhurried summer end of day, Cereal magazine energy.`,
    suggestions: [
      "Praia específica (Trancoso, Jericoacoara, litoral norte SP)",
      "Segurando um chapéu de palha",
      "Só de cabelo molhado",
      "Amanhecer em vez de fim de tarde",
    ],
  },

  {
    id: "rooftop-urbano",
    name: "Rooftop urbano",
    description: "Cidade ao fundo, luz de fim de tarde, mood cinemático.",
    icon: "🌆",
    aspectRatio: "4:5",
    promptBlock: `Cinematic rooftop photograph at late afternoon (~1 hour before sunset). Distant skyline of a real large city (skyscrapers, distant construction cranes, water tower silhouettes) slightly out of focus in the background under a warm hazy amber sky. Warm directional rim light from camera-back-right cutting through the atmosphere, gentle bounce fill from the concrete rooftop surface. 50mm lens, half-body framing, subject leaning slightly on a low concrete parapet or standing hands-in-pockets looking off across the city. Wardrobe: modern layered neutrals (grey coat, dark denim, simple tee). Mood: contemplative, Wong Kar-wai / Sofia Coppola cinematography.`,
    suggestions: [
      "Cidade específica ao fundo",
      "Segurando taça de vinho / xícara",
      "Vento leve no cabelo",
      "Momento após uma chuva (concreto molhado)",
    ],
  },

  {
    id: "corporativo-clean",
    name: "Corporativo Clean",
    description: "LinkedIn premium — parede neutra, luz frontal suave, profissional.",
    icon: "💼",
    aspectRatio: "4:5",
    promptBlock: `Contemporary professional headshot photograph on a seamless mid-tone grey backdrop (#C8C6C1). Soft frontal beauty-dish light from camera-front slightly above, subtle rim from camera-back-right to separate from background, clean even exposure. 85mm lens with medium depth of field, half-body composition from mid-chest up. Wardrobe: solid-color professional attire in dark navy, deep charcoal or muted olive — nothing patterned, nothing branded. Confident calm expression, direct or slightly off-camera gaze, natural half-smile, hands relaxed. Mood: premium LinkedIn / About page, executive but human, not corporate stiff.`,
    suggestions: [
      "Fundo em cor específica da marca",
      "Blazer aberto vs terno completo",
      "Cabelo preso vs solto",
      "Óculos",
    ],
  },

  {
    id: "fashion-estudio",
    name: "Fashion estúdio",
    description: "Fundo colorido, luz direcional forte, pose editorial.",
    icon: "✨",
    aspectRatio: "4:5",
    promptBlock: `High-fashion editorial studio photograph on a solid saturated color backdrop (choose one: deep cobalt blue #1E3A8A, terracotta #C55A3D, or forest green #2F5D3B). Hard directional key light from camera-right at 30° creating a defined shadow on the opposite cheek, small rim from behind. 85mm lens, three-quarter body framing, subject in a confident editorial pose — one hand near the face or resting on the hip, body turned slightly. Wardrobe: monochromatic strong-color outfit that complements or contrasts the backdrop, tailored silhouette. Mood: Vogue Brazil editorial, cinematic drama, deliberate and posed but never smiling into camera.`,
    suggestions: [
      "Cor exata do fundo (hex ou nome)",
      "Cabelo com vento (soprador)",
      "Acessório específico (chapéu, brincos grandes, luvas)",
      "Corpo inteiro em pé",
    ],
  },

  {
    id: "coffee-shop",
    name: "Coffee shop / lifestyle",
    description: "Café iluminado, luz natural pela janela, atmosfera casual.",
    icon: "☕",
    aspectRatio: "4:5",
    promptBlock: `Lifestyle photograph inside a real small independent coffee shop. Visible café details: exposed brick wall or dark wood panel, ceramic cups on nearby tables, soft-focus barista counter with a chalkboard menu in the deep background, one or two other customers slightly out of focus. Soft window light from camera-left at ~11am, warm 3800K bounce from the wooden interior, subtle rim from the window. 50mm lens, natural half-body framing, subject seated at a table with a ceramic mug in hand, mid-conversation or looking down at the cup. Wardrobe: relaxed layered casual — knit sweater, denim, leather jacket variants. Mood: caught, unposed, weekday morning energy.`,
    suggestions: [
      "Tipo específico de café (barista pour-over, espresso simples)",
      "Livro aberto na mesa / caderno",
      "Amigo ou pet junto na cena",
      "Café bem escuro / bem iluminado",
    ],
  },

  {
    id: "nature-outdoor",
    name: "Nature outdoor",
    description: "Natureza, luz difusa entre folhas, tom terroso, ao ar livre.",
    icon: "🌿",
    aspectRatio: "4:5",
    promptBlock: `Outdoor natural light photograph in a real green landscape (choose one: temperate forest floor with tall trees and dappled light, tall grass meadow at golden hour, or rocky coastal cliff with low vegetation). Soft diffused overcast light OR warm dappled light through leaves depending on scene, gentle backlight halo through the hair. 50mm lens, natural three-quarter body framing, subject in a real unposed moment — walking slowly, kneeling to touch a plant, or seated on a rock looking off into the landscape. Wardrobe: earthy natural fibers — linen, wool knit, cotton canvas in olive, taupe, terracotta, cream. Mood: quiet, present, Aesop advertising energy.`,
    suggestions: [
      "Estação (verão, outono com folhas laranja, inverno com neblina)",
      "Bioma específico (Serra da Mantiqueira, Chapada Diamantina)",
      "Segurando planta ou flor",
      "Cachorro na cena",
    ],
  },
];

export function getStyle(id: EnsaioStyleId): EnsaioStyle {
  const s = ENSAIO_STYLES.find((x) => x.id === id);
  if (!s) throw new Error(`Estilo desconhecido: ${id}`);
  return s;
}

// System prompt para o gerador do modo Ensaio.
export function buildEnsaioSystemPrompt(): string {
  return `Você é o motor de prompts do MODO ENSAIO da Swell — plataforma de fotografia por IA no estilo cinemático da marca.

Sua função: receber (1) características extraídas da foto de referência da pessoa + (2) um estilo escolhido do catálogo + (3) um ajuste livre opcional do cliente, e devolver um prompt em inglês pronto para gerar 1 foto do ensaio.

ESTRUTURA-MESTRE DO PROMPT (nesta ordem):
[1. TRAVA DE IDENTIDADE]    Fornecida verbatim. Sempre primeira.
[2. BLOCO DE ESTILO]         Copiado VERBATIM do catálogo — não parafrasear.
[3. AJUSTE PERSONALIZADO]    O que o cliente pediu no campo livre, se pediu (integrado com naturalidade — nunca "the client wants X").
[4. DESCRIÇÃO DA PESSOA]     Traços físicos preservados da referência (não recriados).
[5. ANTI]                    Fornecido verbatim.

REGRAS OBRIGATÓRIAS:
1. Bloco de estilo copiado literal — mudar palavra por palavra causa deriva visual.
2. NUNCA descrever o rosto da pessoa em detalhes específicos (evita a IA "recriar"). Descrever traços gerais: gênero aparente, faixa etária, tom de pele, estilo de cabelo. A trava + referência visual fazem o resto.
3. Palavras proibidas (remover se aparecerem): beautiful, stunning, perfect, gorgeous, vibrant, amazing, high quality, professional (solto), 4k, 8k, aesthetic (solto).
4. Micro-momento sobre pose: sempre um verbo de ação/estado (glancing, mid-step, adjusting sleeve, half-smile) — nunca "posing for the camera".
5. Terminar com: "A single full-frame photograph — no collage, no grid, no split panels."

Retorne APENAS um JSON válido:
{
  "promptEN": "...",
  "negativeEN": "...",
  "warnings": ["..."]
}

- promptEN: prompt completo em inglês pronto pro Magnific
- negativeEN: negative prompt (base universal + qualquer coisa específica do estilo/ajuste)
- warnings: 0-2 avisos sobre limitações (detalhes muito pequenos, categoria de risco, etc)`;
}
