"use client";

import { useState, useEffect, useRef } from "react";

/* ===================== tokens (Swell Studio — design v3) ===================== */
const SW = {
  bg: "#0A0908",
  surface: "#16120F",
  ember: "#E0742F",
  emberHi: "#EE8440",
  text: "#F4EFE6",
  t72: "rgba(244,239,230,0.72)",
  t62: "rgba(244,239,230,0.62)",
  t55: "rgba(244,239,230,0.55)",
  t45: "rgba(244,239,230,0.45)",
  t42: "rgba(244,239,230,0.42)",
  t40: "rgba(244,239,230,0.4)",
  t38: "rgba(244,239,230,0.38)",
  t35: "rgba(244,239,230,0.35)",
  line: "rgba(244,239,230,0.07)",
  line2: "rgba(244,239,230,0.09)",
};
const FONT = {
  archivo: "'Archivo', 'Manrope', system-ui, sans-serif",
  body: "'Hanken Grotesk', system-ui, sans-serif",
  mono: "'IBM Plex Mono', monospace",
};
const EMBER_GRAD = "linear-gradient(180deg, #EE8440 0%, #D96A24 100%)";

/* ===================== idiomas ===================== */
type Lang = "pt" | "es" | "en";
const LANGS: { code: Lang; label: string }[] = [
  { code: "pt", label: "PT" },
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
];

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem("swl-lang");
    if (saved === "pt" || saved === "es" || saved === "en") return saved;
  } catch {}
  const nav = (typeof navigator !== "undefined" ? navigator.language : "pt").toLowerCase();
  if (nav.startsWith("es")) return "es";
  if (nav.startsWith("en")) return "en";
  return "pt";
}

/* ===================== conteúdo por idioma ===================== */
const pt = {
  docTitle: "Swell Studio — Foto de estúdio, do seu celular",
  nav: { login: "Entrar", tryFree: "Testar grátis" },
  hero: {
    kicker: "FOTO DE PRODUTO COM IA",
    h1a: "Cansado de foto feia", h1b: "travando sua venda",
    subPre: "Sua foto de celular vira ", subStrong: "foto de estúdio em 1 minuto", subPost: ".",
    emailPlaceholder: "Seu melhor e-mail",
    cta: "Testar grátis — 5 fotos",
    processPre: "Sobe a foto", processStrong: "4 versões em ~2 min", processPost: ", sem cartão.",
    urgency: "Cada dia de foto fraca é venda que escapa — testa hoje.",
  },
  ba: { before: "ANTES · CELULAR", after: "DEPOIS · SWELL", drag: "ARRASTA PRA VER", beforeShort: "ANTES", afterShort: "DEPOIS" },
  sent: { title: "Confira seu e-mail.", body: (e: string) => <>Mandamos um link pra <strong style={{ color: SW.text }}>{e}</strong> — clica nele pra liberar suas 5 fotos.</>, spam: "ÀS VEZES CAI EM PROMOÇÕES / SPAM" },
  blocked: { title: "Teste já usado.", used: "Você já testou com esse e-mail. Pra continuar, escolha um plano — a partir de R$79,90.", device: "Este aparelho já usou o teste grátis. Entre com o e-mail que você usou, ou escolha um plano.", seePlans: "Ver planos", alreadyHave: "JÁ TENHO ACESSO — ENTRAR" },
  err: { invalid: "Ops — digite um e-mail válido (ex.: voce@suamarca.com).", send: "Não conseguimos enviar agora. Tenta de novo em instantes.", conn: "Sem conexão. Tenta de novo em instantes." },
  proof: { kicker: "01 — PROVA", h2a: "Tirei no celular.", h2b: "Virou isso", labels: ["BEBIDA", "CALÇADO", "ACESSÓRIO", "VESTUÁRIO"], disclaimer: "MENSAGENS REAIS DE CLIENTES" },
  reactions: { kicker: "QUEM VIU, FALOU", h2: "Reação de quem recebeu", items: [
    { text: "A arte ficou cachorrada", via: "CLIENTE · WHATSAPP" },
    { text: "Tá lindo de mais", via: "CLIENTE · WHATSAPP" },
    { text: "Outro nível aí 👏🏻👏🏻", via: "CLIENTE · INSTAGRAM" },
    { text: "Me arrepiei… olha isso", via: "CLIENTE · WHATSAPP" },
  ] },
  caseStudy: { kicker: "CASO REAL", brand: "Eclesyart · Moda", quote: "Precisava de criativos diversos e o orçamento de fotografia não fechava. Fiz mais de 20 criativos validados no Swell Studio, rodei os anúncios — e o estoque esgotou em 3 semanas.", stats: [{ big: "20+", small: "CRIATIVOS VALIDADOS" }, { big: "3 semanas", small: "ESTOQUE ESGOTADO" }, { big: "R$0", small: "EM SESSÃO DE FOTOS" }] },
  how: { kicker: "02 — COMO FUNCIONA", steps: ["Sobe a foto", "Escolhe a cena", "Baixa e posta"] },
  tool: { kicker: "POR DENTRO DA FERRAMENTA", h2: "É você no controle, do início ao fim", shots: ["Sobe a foto do produto", "Escolhe a cena e quantas fotos", "Revisa e baixa as versões prontas"] },
  fidelity: { kicker: "03 — FIDELIDADE", h2a: "Seu produto, fiel.", h2b: "Você revisa antes de postar", body: "Rótulo, cor e formato preservados a partir da sua foto. Muda o cenário e a luz — e você escolhe quais fotos usar antes de publicar. Direção de arte de uma produtora audiovisual.", labels: ["COSMÉTICO", "DECORAÇÃO", "BEBIDA", "ACESSÓRIO"] },
  modes: { kicker: "04 — DOIS MODOS", productT: "Produto", productD: "1 foto do celular → 4 variações de campanha.", personT: "Pessoa", personD: "3 selfies → 8 fotos de ensaio editorial." },
  plans: { kicker: "04 — PLANOS", perMonth: "/mês", photosWord: "fotos", perMonthWord: "por mês", included: "Todos os estilos inclusos", subscribe: "Assinar", mostPopular: "MAIS POPULAR", guarantee: "7 DIAS DE GARANTIA · CANCELA QUANDO QUISER",
    items: [
      { name: "SIMPLES", label: "Simples", highlight: "Ideal pra começar" },
      { name: "MÉDIO", label: "Médio", highlight: "2× mais fotos que o Simples" },
      { name: "GRANDE", label: "Grande", highlight: "5× mais fotos que o Simples" },
    ] },
  faq: { kicker: "05 — DÚVIDAS", items: [
    { q: "Meu produto fica fiel ao original?", a: "Sim — rótulo, cor e formato saem fiéis à foto que você manda; muda só o cenário e a luz. E você sempre revisa antes de postar: escolhe as fotos que ficaram boas." },
    { q: "Preciso saber editar ou mexer em programa?", a: "Não, nada. Você sobe a foto do produto, escolhe a cena e pronto — luz, cenário e ângulo ficam por nossa conta. Você só baixa e posta." },
    { q: "Quanto tempo demora?", a: "De 20 a 40 segundos por foto. Um pacote com 4 variações sai em cerca de 2 minutos." },
    { q: "Como funcionam os créditos?", a: "1 foto = 1 imagem gerada. São 35 no Simples, 80 no Médio e 180 no Grande, por mês. Se uma geração falha, o crédito volta automaticamente. Os créditos valem no mês — não acumulam pro mês seguinte." },
    { q: "O teste é grátis mesmo?", a: "Sim: 5 fotos, sem cartão. Depois você escolhe um plano se quiser continuar." },
  ] },
  finalCta: { h2a: "Seu produto merece", h2b: "foto boa", cta: "Testar grátis", sub: "5 FOTOS · SEM CARTÃO" },
  modal: { kicker: "TESTE GRÁTIS", title: "5 fotos, sem cartão.", body: "Deixa seu e-mail — a gente manda um link pra liberar.", placeholder: "seu@email.com", cta: "Quero testar", nospam: "SEM SPAM · CANCELA QUANDO QUISER" },
  sticky: "Testar grátis — 5 fotos, sem cartão",
};
type Content = typeof pt;

const es: Content = {
  docTitle: "Swell Studio — Foto de estudio, desde tu celular",
  nav: { login: "Entrar", tryFree: "Probar gratis" },
  hero: {
    kicker: "FOTOS DE PRODUCTO CON IA",
    h1a: "¿Cansada de fotos feas", h1b: "que frenan tus ventas",
    subPre: "Tu foto de celular se vuelve ", subStrong: "foto de estudio en 1 minuto", subPost: ".",
    emailPlaceholder: "Tu mejor e-mail",
    cta: "Probar gratis — 5 fotos",
    processPre: "Sube la foto", processStrong: "4 versiones en ~2 min", processPost: ", sin tarjeta.",
    urgency: "Cada día con fotos flojas es una venta que se escapa — prueba hoy.",
  },
  ba: { before: "ANTES · CELULAR", after: "DESPUÉS · SWELL", drag: "ARRASTRA PARA VER", beforeShort: "ANTES", afterShort: "DESPUÉS" },
  sent: { title: "Revisa tu e-mail.", body: (e: string) => <>Enviamos un enlace a <strong style={{ color: SW.text }}>{e}</strong> — haz clic para liberar tus 5 fotos.</>, spam: "A VECES CAE EN PROMOCIONES / SPAM" },
  blocked: { title: "Prueba ya usada.", used: "Ya probaste con este e-mail. Para seguir, elige un plan — desde R$79,90.", device: "Este dispositivo ya usó la prueba gratis. Entra con el e-mail que usaste, o elige un plan.", seePlans: "Ver planes", alreadyHave: "YA TENGO ACCESO — ENTRAR" },
  err: { invalid: "Ups — escribe un e-mail válido (ej.: tu@tumarca.com).", send: "No pudimos enviar ahora. Inténtalo de nuevo en un momento.", conn: "Sin conexión. Inténtalo de nuevo en un momento." },
  proof: { kicker: "01 — PRUEBA", h2a: "Foto del celular.", h2b: "Se volvió esto", labels: ["BEBIDA", "CALZADO", "ACCESORIO", "ROPA"], disclaimer: "MENSAJES REALES DE CLIENTES" },
  reactions: { kicker: "QUIEN LO VIO, LO DIJO", h2: "Reacción de quien recibió", items: [
    { text: "El arte quedó brutal", via: "CLIENTE · WHATSAPP" },
    { text: "Quedó lindísimo", via: "CLIENTE · WHATSAPP" },
    { text: "Otro nivel 👏🏻👏🏻", via: "CLIENTE · INSTAGRAM" },
    { text: "Me dio escalofríos… mira esto", via: "CLIENTE · WHATSAPP" },
  ] },
  caseStudy: { kicker: "CASO REAL", brand: "Eclesyart · Moda", quote: "Necesitaba creativos variados y el presupuesto de fotografía no daba. Hice más de 20 creativos validados en Swell Studio, corrí los anuncios — y el stock se agotó en 3 semanas.", stats: [{ big: "20+", small: "CREATIVOS VALIDADOS" }, { big: "3 semanas", small: "STOCK AGOTADO" }, { big: "R$0", small: "EN SESIÓN DE FOTOS" }] },
  how: { kicker: "02 — CÓMO FUNCIONA", steps: ["Sube la foto", "Elige la escena", "Descarga y publica"] },
  tool: { kicker: "DENTRO DE LA HERRAMIENTA", h2: "Eres tú en control, de principio a fin", shots: ["Subes la foto del producto", "Eliges la escena y cuántas fotos", "Revisas y descargas las versiones listas"] },
  fidelity: { kicker: "03 — FIDELIDAD", h2a: "Tu producto, fiel.", h2b: "Revisas antes de publicar", body: "Etiqueta, color y forma preservados a partir de tu foto. Cambia el escenario y la luz — y eliges qué fotos usar antes de publicar. Dirección de arte de una productora audiovisual.", labels: ["COSMÉTICO", "DECORACIÓN", "BEBIDA", "ACCESORIO"] },
  modes: { kicker: "04 — DOS MODOS", productT: "Producto", productD: "1 foto del celular → 4 variaciones de campaña.", personT: "Persona", personD: "3 selfies → 8 fotos de sesión editorial." },
  plans: { kicker: "04 — PLANES", perMonth: "/mes", photosWord: "fotos", perMonthWord: "al mes", included: "Todos los estilos incluidos", subscribe: "Suscribir", mostPopular: "MÁS POPULAR", guarantee: "7 DÍAS DE GARANTÍA · CANCELA CUANDO QUIERAS",
    items: [
      { name: "SIMPLE", label: "Simple", highlight: "Ideal para empezar" },
      { name: "MEDIO", label: "Medio", highlight: "2× más fotos que el Simple" },
      { name: "GRANDE", label: "Grande", highlight: "5× más fotos que el Simple" },
    ] },
  faq: { kicker: "05 — DUDAS", items: [
    { q: "¿Mi producto queda fiel al original?", a: "Sí — etiqueta, color y forma salen fieles a la foto que envías; solo cambian el escenario y la luz. Y siempre revisas antes de publicar: eliges las fotos que quedaron bien." },
    { q: "¿Necesito saber editar o usar programas?", a: "No, nada. Subes la foto del producto, eliges la escena y listo — luz, escenario y ángulo van por nuestra cuenta. Solo descargas y publicas." },
    { q: "¿Cuánto tarda?", a: "De 20 a 40 segundos por foto. Un paquete con 4 variaciones sale en cerca de 2 minutos." },
    { q: "¿Cómo funcionan los créditos?", a: "1 foto = 1 imagen generada. Son 35 en el Simple, 80 en el Medio y 180 en el Grande, al mes. Si una generación falla, el crédito se devuelve automáticamente. Los créditos valen en el mes — no se acumulan para el siguiente." },
    { q: "¿La prueba es gratis de verdad?", a: "Sí: 5 fotos, sin tarjeta. Después eliges un plan si quieres continuar." },
  ] },
  finalCta: { h2a: "Tu producto merece", h2b: "buena foto", cta: "Probar gratis", sub: "5 FOTOS · SIN TARJETA" },
  modal: { kicker: "PRUEBA GRATIS", title: "5 fotos, sin tarjeta.", body: "Deja tu e-mail — te enviamos un enlace para liberar.", placeholder: "tu@email.com", cta: "Quiero probar", nospam: "SIN SPAM · CANCELA CUANDO QUIERAS" },
  sticky: "Probar gratis — 5 fotos, sin tarjeta",
};

const en: Content = {
  docTitle: "Swell Studio — Studio photos, from your phone",
  nav: { login: "Log in", tryFree: "Try free" },
  hero: {
    kicker: "AI PRODUCT PHOTOGRAPHY",
    h1a: "Ugly photos", h1b: "killing your sales",
    subPre: "Your phone photo becomes a ", subStrong: "studio photo in 1 minute", subPost: ".",
    emailPlaceholder: "Your best email",
    cta: "Try free — 5 photos",
    processPre: "Upload your photo", processStrong: "4 versions in ~2 min", processPost: ", no card.",
    urgency: "Every day with weak photos is a sale slipping away — try today.",
  },
  ba: { before: "BEFORE · PHONE", after: "AFTER · SWELL", drag: "DRAG TO SEE", beforeShort: "BEFORE", afterShort: "AFTER" },
  sent: { title: "Check your email.", body: (e: string) => <>We sent a link to <strong style={{ color: SW.text }}>{e}</strong> — click it to unlock your 5 photos.</>, spam: "SOMETIMES LANDS IN PROMOTIONS / SPAM" },
  blocked: { title: "Trial already used.", used: "You already tried with this email. To continue, pick a plan — from R$79.90.", device: "This device already used the free trial. Log in with the email you used, or pick a plan.", seePlans: "See plans", alreadyHave: "I ALREADY HAVE ACCESS — LOG IN" },
  err: { invalid: "Oops — enter a valid email (e.g. you@yourbrand.com).", send: "We couldn't send right now. Try again in a moment.", conn: "No connection. Try again in a moment." },
  proof: { kicker: "01 — PROOF", h2a: "Shot on a phone.", h2b: "Became this", labels: ["DRINK", "FOOTWEAR", "ACCESSORY", "APPAREL"], disclaimer: "REAL MESSAGES FROM CLIENTS" },
  reactions: { kicker: "PEOPLE WHO SAW IT", h2: "What people said", items: [
    { text: "The art came out killer", via: "CLIENT · WHATSAPP" },
    { text: "This looks amazing", via: "CLIENT · WHATSAPP" },
    { text: "Next level 👏🏻👏🏻", via: "CLIENT · INSTAGRAM" },
    { text: "Got chills… look at this", via: "CLIENT · WHATSAPP" },
  ] },
  caseStudy: { kicker: "REAL CASE", brand: "Eclesyart · Fashion", quote: "I needed varied creatives and the photography budget didn't fit. I made 20+ validated creatives with Swell Studio, ran the ads — and stock sold out in 3 weeks.", stats: [{ big: "20+", small: "VALIDATED CREATIVES" }, { big: "3 weeks", small: "SOLD OUT" }, { big: "R$0", small: "ON PHOTO SHOOTS" }] },
  how: { kicker: "02 — HOW IT WORKS", steps: ["Upload the photo", "Pick the scene", "Download & post"] },
  tool: { kicker: "INSIDE THE TOOL", h2: "You're in control, start to finish", shots: ["Upload the product photo", "Pick the scene and how many", "Review and download the ready versions"] },
  fidelity: { kicker: "03 — FIDELITY", h2a: "Your product, faithful.", h2b: "You review before posting", body: "Label, color and shape preserved from your photo. The scene and lighting change — and you choose which shots to use before posting. Art direction from a film studio.", labels: ["COSMETIC", "DECOR", "DRINK", "ACCESSORY"] },
  modes: { kicker: "04 — TWO MODES", productT: "Product", productD: "1 phone photo → 4 campaign variations.", personT: "Person", personD: "3 selfies → 8 editorial shoot photos." },
  plans: { kicker: "04 — PLANS", perMonth: "/mo", photosWord: "photos", perMonthWord: "per month", included: "All styles included", subscribe: "Subscribe", mostPopular: "MOST POPULAR", guarantee: "7-DAY GUARANTEE · CANCEL ANYTIME",
    items: [
      { name: "SIMPLE", label: "Simple", highlight: "Perfect to start" },
      { name: "MEDIUM", label: "Medium", highlight: "2× more photos than Simple" },
      { name: "LARGE", label: "Large", highlight: "5× more photos than Simple" },
    ] },
  faq: { kicker: "05 — FAQ", items: [
    { q: "Does my product stay true to the original?", a: "Yes — label, color and shape come out faithful to the photo you send; only the scene and lighting change. And you always review before posting: you pick the shots that came out great." },
    { q: "Do I need to know editing or software?", a: "No, nothing. You upload the product photo, pick the scene, and that's it — light, scene and angle are on us. You just download and post." },
    { q: "How long does it take?", a: "20 to 40 seconds per photo. A 4-variation pack comes out in about 2 minutes." },
    { q: "How do credits work?", a: "1 photo = 1 generated image. That's 35 on Simple, 80 on Medium and 180 on Large, per month. If a generation fails, the credit is refunded automatically. Credits are monthly — they don't roll over." },
    { q: "Is the trial really free?", a: "Yes: 5 photos, no card. Then you pick a plan if you want to continue." },
  ] },
  finalCta: { h2a: "Your product deserves", h2b: "a good photo", cta: "Try free", sub: "5 PHOTOS · NO CARD" },
  modal: { kicker: "FREE TRIAL", title: "5 photos, no card.", body: "Leave your email — we'll send a link to unlock.", placeholder: "you@email.com", cta: "I want to try", nospam: "NO SPAM · CANCEL ANYTIME" },
  sticky: "Try free — 5 photos, no card",
};

const CONTENT: Record<Lang, Content> = { pt, es, en };

/* ===================== dados (estáveis) ===================== */
const utm = (content: string) =>
  "?utm_source=landing&utm_medium=cta&utm_campaign=swell_studio&utm_content=" + content;

// Preço/checkout/estilo são estáveis; nome/label/highlight vêm do idioma.
const PLAN_BASE = [
  { url: "https://pay.kiwify.com.br/iT4Cc0s" + utm("plano_simples"), price: "R$79,90", photos: "35",
    featured: false, border: "rgba(244,239,230,0.1)", shadow: "none", nameColor: SW.t45,
    btnBg: "none", btnBorder: "1px solid rgba(244,239,230,0.18)", btnColor: SW.text, btnShadow: "none" },
  { url: "https://pay.kiwify.com.br/J6cjEFC" + utm("plano_medio"), price: "R$159,90", photos: "80",
    featured: true, border: "rgba(224,116,47,0.5)", shadow: "0 0 90px rgba(224,116,47,0.1), 0 24px 70px rgba(0,0,0,0.45)", nameColor: SW.ember,
    btnBg: EMBER_GRAD, btnBorder: "none", btnColor: "#0A0908", btnShadow: "0 12px 36px rgba(224,116,47,0.24)" },
  { url: "https://pay.kiwify.com.br/xB1SN3A" + utm("plano_grande"), price: "R$299,90", photos: "180",
    featured: false, border: "rgba(244,239,230,0.1)", shadow: "none", nameColor: SW.t45,
    btnBg: "none", btnBorder: "1px solid rgba(244,239,230,0.18)", btnColor: SW.text, btnShadow: "none" },
];

const PROOF_IMG = [
  { antes: "/assets/opt/suco-antes.jpg", depois: "/assets/opt/suco-depois.jpg" },
  { antes: "/assets/opt/tenis-antes.jpg", depois: "/assets/opt/tenis-depois.jpg" },
  { antes: "/assets/opt/relogio-antes.jpg", depois: "/assets/opt/relogio-depois.jpg" },
  { antes: "/assets/opt/camisa-antes.jpg", depois: "/assets/opt/camisa-depois.jpg" },
];

// Pares antes/depois da seção de fidelidade (inclui o shampoo novo).
const FID_IMG = [
  { antes: "/assets/opt/shampoo-antes.jpg", depois: "/assets/opt/shampoo-depois.jpg" },
  { antes: "/assets/opt/luminaria-antes.jpg", depois: "/assets/opt/luminaria-depois.jpg" },
  { antes: "/assets/opt/suco-antes.jpg", depois: "/assets/opt/suco-depois.jpg" },
  { antes: "/assets/opt/relogio-antes.jpg", depois: "/assets/opt/relogio-depois.jpg" },
];
const TOOL_SHOTS = ["/assets/tool/1-upload.jpg", "/assets/tool/2-cena.jpg", "/assets/tool/3-resultado.jpg"];

const REACT_EMOJI: (string | null)[] = ["❤️", "❤️", null, "😍"];

const DATACRAZY_WEBHOOK =
  "https://api.datacrazy.io/v1/crm/api/crm/integrations/webhook/business/a1391dce-2771-4a48-b4d8-6743f67ef8c6";

/* ===================== Meta Pixel (eventos de conversão) ===================== */
type Fbq = (...args: unknown[]) => void;
function track(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (fbq) fbq("track", event, params, eventId ? { eventID: eventId } : undefined);
}
function newEventId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}.${rand}`;
}
function priceToNumber(price: string): number {
  const n = Number(price.replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/* ===================== ícones ===================== */
const Arrow = ({ size = 19 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ===================== slider antes/depois (v3) ===================== */
function BeforeAfter({ t }: { t: Content["ba"] }) {
  const [reveal, setReveal] = useState(52);
  const [touched, setTouched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const update = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setReveal(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)));
    if (!touched) setTouched(true);
  };
  const onDown = (e: React.PointerEvent) => { drag.current = true; try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {} update(e.clientX); };
  const onMove = (e: React.PointerEvent) => { if (drag.current) update(e.clientX); };
  const onUp = () => { drag.current = false; };
  return (
    <div ref={ref} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      style={{ position: "relative", aspectRatio: "4/5", width: "100%", borderRadius: 4, overflow: "hidden", background: SW.surface, border: "1px solid rgba(244,239,230,0.1)", touchAction: "none", cursor: "ew-resize", userSelect: "none", boxShadow: "0 40px 110px rgba(0,0,0,0.6)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/opt/luminaria-depois.jpg" alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - reveal}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/opt/luminaria-antes.jpg" alt="" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} />
      </div>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${reveal}%`, width: 1.5, background: SW.ember, pointerEvents: "none", boxShadow: "0 0 24px rgba(224,116,47,0.55)" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 46, height: 46, borderRadius: 999, background: SW.ember, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#0A0908" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 4 12 9 18" /><polyline points="15 6 20 12 15 18" /></svg>
        </div>
      </div>
      <span style={{ position: "absolute", left: 12, top: 12, fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.16em", color: SW.t72, background: "rgba(10,9,8,0.55)", padding: "5px 9px", pointerEvents: "none" }}>{t.before}</span>
      <span style={{ position: "absolute", right: 12, top: 12, fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.16em", color: SW.ember, background: "rgba(10,9,8,0.55)", padding: "5px 9px", pointerEvents: "none" }}>{t.after}</span>
      <span style={{ position: "absolute", left: "50%", bottom: 14, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 7, fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.14em", color: SW.t62, background: "rgba(10,9,8,0.6)", padding: "6px 12px", pointerEvents: "none", opacity: touched ? 0 : 1, transition: "opacity 300ms cubic-bezier(0.22,1,0.36,1)" }}>
        {t.drag}
        <span style={{ display: "inline-flex", animation: "swlNudge 1.6s cubic-bezier(0.22,1,0.36,1) infinite" }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </span>
      </span>
    </div>
  );
}

/* ===================== carrossel da prova ===================== */
function ProofRail({ labels, before, after }: { labels: string[]; before: string; after: string }) {
  const railRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 60);
      last = now;
      if (!paused.current) {
        const half = el.scrollWidth / 2;
        let next = el.scrollLeft + dt * 0.032;
        if (next >= half) next -= half;
        el.scrollLeft = next;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const pause = () => { paused.current = true; };
  const resume = () => { paused.current = false; };
  const items = PROOF_IMG.concat(PROOF_IMG);
  return (
    <div ref={railRef} className="swl-rail"
      onPointerDown={pause} onPointerUp={resume} onPointerLeave={resume} onPointerCancel={resume}
      onTouchStart={pause} onTouchEnd={resume}
      style={{ display: "flex", gap: "clamp(30px, 7vw, 52px)", overflowX: "auto", padding: "4px clamp(16px, 4vw, 40px) 6px", WebkitOverflowScrolling: "touch" }}>
      {items.map((p, i) => (
        <figure key={i} style={{ margin: 0, flex: "0 0 min(80%, 340px)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ position: "relative", flex: 1, aspectRatio: "3/4", overflow: "hidden", background: SW.surface, border: "1px solid rgba(244,239,230,0.09)", borderRadius: 3 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.antes} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <span style={{ position: "absolute", left: 8, top: 8, fontFamily: FONT.mono, fontSize: 8.5, letterSpacing: "0.14em", color: SW.t62, background: "rgba(10,9,8,0.5)", padding: "4px 7px" }}>{before}</span>
            </div>
            <div style={{ position: "relative", flex: 1, aspectRatio: "3/4", overflow: "hidden", background: SW.surface, border: "1px solid rgba(224,116,47,0.4)", borderRadius: 3 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.depois} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <span style={{ position: "absolute", left: 8, top: 8, fontFamily: FONT.mono, fontSize: 8.5, letterSpacing: "0.14em", color: SW.ember, background: "rgba(10,9,8,0.5)", padding: "4px 7px" }}>{after}</span>
            </div>
          </div>
          <figcaption style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.18em", color: SW.t38 }}>{labels[i % labels.length]}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/* ===================== slider automático (uma por vez, esquerda→direita) ===================== */
function Slider({ items, arrows = false }: { items: React.ReactNode[]; arrows?: boolean }) {
  const [idx, setIdx] = useState(0);
  const paused = useRef(false);
  const n = items.length;
  useEffect(() => {
    if (n <= 1) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => { if (!paused.current) setIdx((i) => (i + 1) % n); }, 4200);
    return () => clearInterval(id);
  }, [n]);
  const pause = () => { paused.current = true; };
  const resume = () => { paused.current = false; };
  const go = (d: number) => setIdx((i) => (i + d + n) % n);
  const arrowStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute", top: "50%", [side]: 8, transform: "translateY(-50%)", zIndex: 3,
    width: 38, height: 38, borderRadius: 999, background: "rgba(10,9,8,0.6)", backdropFilter: "blur(6px)",
    border: `1px solid ${SW.line2}`, color: SW.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  });
  return (
    <div>
      <div style={{ position: "relative" }}>
        <div style={{ overflow: "hidden", borderRadius: 8 }} onPointerDown={pause} onPointerUp={resume} onPointerLeave={resume} onPointerCancel={resume} onTouchStart={pause} onTouchEnd={resume}>
          <div style={{ display: "flex", transform: `translateX(-${idx * 100}%)`, transition: "transform 600ms cubic-bezier(0.22,1,0.36,1)" }}>
            {items.map((c, i) => (
              <div key={i} style={{ flex: "0 0 100%", minWidth: 0 }}>{c}</div>
            ))}
          </div>
        </div>
        {arrows && n > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="anterior" className="swl-cta" style={arrowStyle("left")}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button onClick={() => go(1)} aria-label="próximo" className="swl-cta" style={arrowStyle("right")}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </>
        )}
      </div>
      {n > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 7, marginTop: 16 }}>
          {items.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} aria-label={`slide ${i + 1}`}
              style={{ width: i === idx ? 24 : 8, height: 8, borderRadius: 999, border: "none", background: i === idx ? SW.ember : "rgba(244,239,230,0.25)", cursor: "pointer", padding: 0, transition: "width 250ms, background 250ms" }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== componente ===================== */
export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("pt");
  const [open, setOpen] = useState<number>(-1);
  const [showLead, setShowLead] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadStatus, setLeadStatus] = useState<"idle" | "sent" | "blocked">("idle");
  const [leadMsg, setLeadMsg] = useState("");
  const [leadError, setLeadError] = useState("");
  const [showSticky, setShowSticky] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const exitShown = useRef(false);

  const t = CONTENT[lang];

  // Detecta o idioma no cliente (evita mismatch de hidratação: SSR sempre em PT).
  useEffect(() => { setLang(detectLang()); }, []);
  useEffect(() => { document.title = CONTENT[lang].docTitle; }, [lang]);

  const changeLang = (l: Lang) => { setLang(l); try { localStorage.setItem("swl-lang", l); } catch {} };

  useEffect(() => {
    try { exitShown.current = localStorage.getItem("swl-exit-shown") === "1"; } catch {}
    const onMouseOut = (e: MouseEvent) => {
      if (exitShown.current || showLead || leadStatus !== "idle") return;
      if (e.clientY <= 8 && !e.relatedTarget) {
        exitShown.current = true;
        try { localStorage.setItem("swl-exit-shown", "1"); } catch {}
        setShowLead(true);
      }
    };
    document.addEventListener("mouseout", onMouseOut);
    return () => document.removeEventListener("mouseout", onMouseOut);
  }, [showLead, leadStatus]);

  // Barra fixa só aparece quando o herói (com o formulário) sai da tela.
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShowSticky(true); return; }
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const submitLead = async () => {
    const email = leadEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLeadError(t.err.invalid);
      return;
    }
    setLeadError("");
    const name = email.split("@")[0];
    const params = new URLSearchParams(window.location.search);
    // Captura de lead → automação de CRM (Datacrazy).
    fetch(DATACRAZY_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email, name, country_code: "", phone: "",
        source: "landing-swell-studio", origem: "landing-swell-studio", evento: "teste-gratis",
        page: window.location.href, lang,
        utm_source: params.get("utm_source") || "landing",
        utm_medium: params.get("utm_medium") || "cta",
        utm_campaign: params.get("utm_campaign") || "swell_studio",
        utm_content: params.get("utm_content") || "teste-gratis",
        created_at: new Date().toISOString(),
      }),
    }).catch(() => {});
    // Confirma o e-mail e libera o teste: cria o trial e manda o link mágico (Resend).
    try {
      const leadEventId = newEventId("lead");
      const r = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, source: "landing-swell-studio", eventId: leadEventId }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setLeadError(typeof data?.error === "string" ? data.error : t.err.send);
        return;
      }
      if (data?.status === "blocked") {
        setLeadMsg(data?.reason === "device" ? t.blocked.device : t.blocked.used);
        setLeadStatus("blocked");
      } else {
        setLeadStatus("sent");
        track("Lead", { content_name: "teste-gratis" }, leadEventId);
      }
    } catch {
      setLeadError(t.err.conn);
    }
  };

  const openLead = () => setShowLead(true);
  const proofLabels = t.proof.labels;

  return (
    <div style={{ background: SW.bg, minHeight: "100vh", overflowX: "hidden", color: SW.text, fontFamily: FONT.body }}>
      <style>{`
        html { scroll-behavior: smooth; }
        ::selection { background: ${SW.ember}; color: #0A0908; }
        .swl-rail { -ms-overflow-style: none; scrollbar-width: none; }
        .swl-rail::-webkit-scrollbar { display: none; }
        @keyframes swlNudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(7px); } }
        @keyframes swlRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .swl-rise { animation: swlRise 700ms cubic-bezier(0.22,1,0.36,1) both; }
        .swl-cta { transition: filter 250ms, transform 120ms; }
        .swl-cta:hover { filter: brightness(1.06); }
        .swl-cta:active { transform: translateY(1px); }
        .swl-ghost { transition: color 200ms; }
        .swl-ghost:hover { color: ${SW.emberHi}; }
        .swl-sticky, .swl-stickypad { display: none; }
        @media (max-width: 640px) { .swl-sticky { display: block; } .swl-stickypad { display: block; } }
        @keyframes swlPulse { 0%, 100% { box-shadow: 0 16px 50px rgba(224,116,47,0.26); } 50% { box-shadow: 0 16px 60px rgba(224,116,47,0.5); } }
        .swl-pulse { animation: swlPulse 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

      {/* ============ HEADER ============ */}
      <header style={{ position: "sticky", top: 0, zIndex: 60, background: "rgba(10,9,8,0.9)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: `1px solid ${SW.line}` }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "11px clamp(16px, 4vw, 40px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/swell-studio-logo.png" alt="Swell Studio" style={{ height: 26, width: "auto", display: "block", flex: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px, 2.5vw, 18px)", flex: "none" }}>
            {/* seletor de idioma */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, border: `1px solid ${SW.line2}`, borderRadius: 999, padding: 2 }}>
              {LANGS.map(({ code, label }) => (
                <button key={code} onClick={() => changeLang(code)} aria-label={label}
                  style={{ background: lang === code ? "rgba(224,116,47,0.16)" : "transparent", color: lang === code ? SW.ember : SW.t45, border: "none", borderRadius: 999, padding: "5px 9px", fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: "0.06em", fontWeight: lang === code ? 700 : 500, cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
            <a href="/entrar" className="swl-ghost" style={{ fontFamily: FONT.body, fontSize: 13.5, fontWeight: 700, color: SW.t72, textDecoration: "none" }}>{t.nav.login}</a>
            <button onClick={openLead} className="swl-cta" style={{ flex: "none", background: EMBER_GRAD, color: "#0A0908", border: "none", borderRadius: 999, padding: "10px 16px", fontFamily: FONT.body, fontSize: 13, fontWeight: 800, letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "0 8px 26px rgba(224,116,47,0.22)" }}>{t.nav.tryFree}</button>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section style={{ padding: "clamp(30px, 5vw, 60px) clamp(16px, 4vw, 40px) clamp(40px, 6vw, 70px)" }}>
        <div ref={heroRef} className="swl-rise" style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(22px, 4vw, 30px)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "center" }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.t42 }}>{t.hero.kicker}</div>
            <h1 style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: "clamp(28px, 7.5vw, 46px)", lineHeight: 1.06, letterSpacing: "-0.015em", margin: 0 }}>{t.hero.h1a}<br />{t.hero.h1b}<span style={{ color: SW.ember }}>?</span></h1>
            <p style={{ fontSize: "clamp(16px, 4.5vw, 19px)", lineHeight: 1.4, color: SW.t72, margin: 0, textWrap: "balance" }}>{t.hero.subPre}<strong style={{ color: SW.text, fontWeight: 700 }}>{t.hero.subStrong}</strong>{t.hero.subPost}</p>
          </div>

          <BeforeAfter t={t.ba} />

          {leadStatus === "idle" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                value={leadEmail}
                onChange={(e) => { setLeadEmail(e.target.value); if (leadError) setLeadError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") submitLead(); }}
                type="email" autoComplete="email" inputMode="email" placeholder={t.hero.emailPlaceholder}
                style={{ width: "100%", background: "rgba(244,239,230,0.06)", border: `1.5px solid ${leadError ? "rgba(232,131,111,0.85)" : "rgba(224,116,47,0.55)"}`, borderRadius: 4, padding: "18px 18px", color: SW.text, fontFamily: FONT.body, fontSize: 16.5, outline: "none", textAlign: "center" }}
              />
              <button onClick={submitLead} className="swl-cta swl-pulse" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: EMBER_GRAD, color: "#0A0908", border: "none", borderRadius: 4, padding: "20px 28px", fontFamily: FONT.body, fontSize: 17, fontWeight: 800, letterSpacing: "-0.015em", cursor: "pointer" }}>
                {t.hero.cta}<Arrow />
              </button>
              {leadError && <div style={{ color: "#E8836F", fontSize: 13, lineHeight: 1.4, textAlign: "center" }}>{leadError}</div>}
              <p style={{ fontSize: 13.5, lineHeight: 1.55, color: SW.t55, margin: "2px auto 0", textAlign: "center", maxWidth: "42ch" }}>
                {t.hero.processPre} <span style={{ color: SW.ember }}>→</span> <strong style={{ color: SW.text, fontWeight: 700 }}>{t.hero.processStrong}</strong>{t.hero.processPost} <span style={{ color: SW.emberHi }}>{t.hero.urgency}</span>
              </p>
            </div>
          ) : leadStatus === "sent" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", textAlign: "center", background: SW.surface, border: "1px solid rgba(224,116,47,0.4)", borderRadius: 4, padding: "24px 20px" }}>
              <div style={{ width: 48, height: 48, borderRadius: 999, background: "rgba(224,116,47,0.12)", border: "1px solid rgba(224,116,47,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={SW.ember} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22 6 12 13 2 6" /></svg>
              </div>
              <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 23, letterSpacing: "-0.02em" }}>{t.sent.title}</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.5, color: SW.t55, margin: 0 }}>{t.sent.body(leadEmail)}</p>
              <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.14em", color: SW.t35 }}>{t.sent.spam}</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", textAlign: "center", background: SW.surface, border: `1px solid ${SW.line2}`, borderRadius: 4, padding: "24px 20px" }}>
              <div style={{ fontFamily: FONT.archivo, fontWeight: 800, fontSize: 21, letterSpacing: "-0.02em" }}>{t.blocked.title}</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.5, color: SW.t55, margin: 0 }}>{leadMsg}</p>
              <a href="#planos" className="swl-cta" style={{ width: "100%", textAlign: "center", background: EMBER_GRAD, color: "#0A0908", borderRadius: 4, padding: 15, fontFamily: FONT.body, fontSize: 15, fontWeight: 800, textDecoration: "none", marginTop: 2 }}>{t.blocked.seePlans}</a>
            </div>
          )}
        </div>
      </section>

      {/* ============ 01 · PROVA ============ */}
      <section style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(44px, 7vw, 84px) 0" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 clamp(16px, 4vw, 40px)", display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.ember }}>{t.proof.kicker}</div>
          <h2 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(30px, 8vw, 46px)", lineHeight: 0.95, letterSpacing: "-0.035em", margin: 0 }}>{t.proof.h2a}<br />{t.proof.h2b}<span style={{ color: SW.ember }}>.</span></h2>
        </div>
        <ProofRail labels={proofLabels} before={t.ba.beforeShort} after={t.ba.afterShort} />
      </section>

      {/* ============ 02 · COMO FUNCIONA (ferramenta real, título ao lado + slider) ============ */}
      <section style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(44px, 7vw, 84px) clamp(16px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "clamp(24px, 5vw, 56px)", alignItems: "center" }}>
          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.ember, marginBottom: 12 }}>{t.how.kicker}</div>
            <h2 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(27px, 5.5vw, 42px)", lineHeight: 0.98, letterSpacing: "-0.03em", margin: "0 0 24px" }}>{t.tool.h2}<span style={{ color: SW.ember }}>.</span></h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {t.tool.shots.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ flex: "none", width: 30, height: 30, borderRadius: 999, background: "rgba(224,116,47,0.12)", border: "1px solid rgba(224,116,47,0.35)", color: SW.ember, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.archivo, fontWeight: 800, fontSize: 14 }}>{i + 1}</span>
                  <span style={{ fontSize: 16, color: SW.t72, lineHeight: 1.3 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: "1.4 1 360px", minWidth: 0 }}>
            <Slider arrows items={TOOL_SHOTS.map((src, i) => (
              <div key={i} style={{ border: `1px solid ${SW.line2}`, borderRadius: 8, overflow: "hidden", background: SW.surface, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 12px", borderBottom: `1px solid ${SW.line}` }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "rgba(244,239,230,0.18)" }} />
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "rgba(244,239,230,0.18)" }} />
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: "rgba(224,116,47,0.5)" }} />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={t.tool.shots[i]} loading="lazy" decoding="async" style={{ width: "100%", display: "block" }} />
              </div>
            ))} />
          </div>
        </div>
      </section>

      {/* ============ CASO REAL (Eclesyart) ============ */}
      <section style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(44px, 7vw, 84px) clamp(16px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.ember, marginBottom: 16 }}>{t.caseStudy.kicker}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/eclesyart-logo.png" alt={t.caseStudy.brand} style={{ height: 58, width: "auto", display: "block", marginBottom: 22 }} />
          <blockquote style={{ margin: 0, fontFamily: FONT.archivo, fontWeight: 800, fontSize: "clamp(21px, 4.4vw, 30px)", lineHeight: 1.28, letterSpacing: "-0.02em", color: SW.text }}>
            “{t.caseStudy.quote}”
          </blockquote>
          <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.16em", color: SW.t55, marginTop: 18 }}>— {t.caseStudy.brand.toUpperCase()}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "clamp(10px, 2vw, 16px)", marginTop: 28 }}>
            {t.caseStudy.stats.map((s, i) => (
              <div key={i} style={{ background: SW.surface, border: `1px solid ${SW.line2}`, borderRadius: 3, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(24px, 5vw, 32px)", letterSpacing: "-0.03em", color: SW.ember, lineHeight: 1 }}>{s.big}</div>
                <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.14em", color: SW.t45 }}>{s.small}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ REAÇÕES REAIS ============ */}
      <section style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(40px, 6vw, 72px) clamp(16px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.ember, marginBottom: 10 }}>{t.reactions.kicker}</div>
          <h2 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(26px, 6.5vw, 40px)", lineHeight: 0.97, letterSpacing: "-0.03em", margin: "0 0 28px" }}>{t.reactions.h2}<span style={{ color: SW.ember }}>.</span></h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {t.reactions.items.map((r, i) => (
              <div key={i} style={{ position: "relative", flex: "1 1 240px", background: SW.surface, border: `1px solid ${SW.line2}`, borderRadius: "16px 16px 16px 4px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                {REACT_EMOJI[i] && <span style={{ position: "absolute", right: 14, top: 14, fontSize: 16, lineHeight: 1 }}>{REACT_EMOJI[i]}</span>}
                <p style={{ margin: 0, paddingRight: REACT_EMOJI[i] ? 26 : 0, fontSize: 16.5, lineHeight: 1.4, color: SW.text, fontWeight: 500 }}>{r.text}</p>
                <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.14em", color: SW.t40 }}>{r.via}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.14em", color: SW.t35, marginTop: 22 }}>{t.proof.disclaimer}</div>
        </div>
      </section>

      {/* ============ 03 · FIDELIDADE (antes/depois em slider) ============ */}
      <section style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(44px, 7vw, 84px) clamp(16px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16, alignItems: "center", marginBottom: 34 }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.ember }}>{t.fidelity.kicker}</div>
            <h2 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(30px, 8vw, 48px)", lineHeight: 0.95, letterSpacing: "-0.035em", margin: 0 }}>{t.fidelity.h2a}<br />{t.fidelity.h2b}<span style={{ color: SW.ember }}>.</span></h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: SW.t55, margin: 0, maxWidth: "44ch" }}>{t.fidelity.body}</p>
          </div>
          <Slider items={FID_IMG.map((p, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 2px" }}>
              <div style={{ display: "flex", gap: "clamp(8px, 2vw, 14px)" }}>
                <div style={{ position: "relative", flex: 1, aspectRatio: "3/4", overflow: "hidden", borderRadius: 4, border: `1px solid ${SW.line2}`, background: SW.surface }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.antes} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <span style={{ position: "absolute", left: 8, top: 8, fontFamily: FONT.mono, fontSize: 8.5, letterSpacing: "0.14em", color: SW.t62, background: "rgba(10,9,8,0.5)", padding: "4px 7px" }}>{t.ba.beforeShort}</span>
                </div>
                <div style={{ position: "relative", flex: 1, aspectRatio: "3/4", overflow: "hidden", borderRadius: 4, border: "1px solid rgba(224,116,47,0.4)", background: SW.surface }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.depois} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <span style={{ position: "absolute", left: 8, top: 8, fontFamily: FONT.mono, fontSize: 8.5, letterSpacing: "0.14em", color: SW.ember, background: "rgba(10,9,8,0.5)", padding: "4px 7px" }}>{t.ba.afterShort}</span>
                </div>
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 9.5, letterSpacing: "0.18em", color: SW.t45, textAlign: "center" }}>{t.fidelity.labels[i]}</div>
            </div>
          ))} />
        </div>
      </section>

      {/* ============ PLANOS ============ */}
      <section id="planos" style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(44px, 7vw, 84px) clamp(16px, 4vw, 40px)", scrollMarginTop: 70 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.ember, marginBottom: 26 }}>{t.plans.kicker}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "clamp(14px, 2vw, 20px)", alignItems: "start" }}>
            {PLAN_BASE.map((p, i) => {
              const pl = t.plans.items[i];
              return (
                <div key={i} style={{ position: "relative", background: SW.surface, border: `1px solid ${p.border}`, borderRadius: 3, padding: "26px 22px", display: "flex", flexDirection: "column", gap: 18, boxShadow: p.shadow }}>
                  {p.featured && (
                    <div style={{ position: "absolute", top: -1, right: -1, background: SW.ember, color: "#0A0908", fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.16em", padding: "5px 10px" }}>{t.plans.mostPopular}</div>
                  )}
                  <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.2em", color: p.nameColor }}>{pl.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <div style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: 36, letterSpacing: "-0.04em", lineHeight: 1 }}>{p.price}</div>
                    <div style={{ fontSize: 14, color: SW.t40 }}>{t.plans.perMonth}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 15, color: SW.t62 }}>
                    <div><strong style={{ color: SW.text, fontWeight: 700 }}>{p.photos} {t.plans.photosWord}</strong> {t.plans.perMonthWord}</div>
                    <div>{pl.highlight}</div>
                    <div>{t.plans.included}</div>
                  </div>
                  <a href={p.url} onClick={() => track("InitiateCheckout", { content_name: pl.label, value: priceToNumber(p.price), currency: "BRL" })} className="swl-cta" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: p.btnBg, border: p.btnBorder, color: p.btnColor, borderRadius: 4, padding: "15px 20px", fontFamily: FONT.body, fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", boxShadow: p.btnShadow, textDecoration: "none" }}>{t.plans.subscribe} {pl.label}</a>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 9, fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.16em", color: SW.t40 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={SW.ember} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            {t.plans.guarantee}
          </div>
        </div>
      </section>

      {/* ============ 06 · DÚVIDAS ============ */}
      <section style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(44px, 7vw, 84px) clamp(16px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", color: SW.ember, marginBottom: 22 }}>{t.faq.kicker}</div>
          {t.faq.items.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ borderBottom: `1px solid ${SW.line2}` }}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "none", border: "none", padding: "20px 0", cursor: "pointer", textAlign: "left", color: SW.text, fontFamily: FONT.body }}>
                  <span style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: "-0.01em" }}>{f.q}</span>
                  <span style={{ flex: "none", color: SW.ember, fontSize: 20, lineHeight: 1 }}>{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <div style={{ padding: "0 0 20px", fontSize: 15.5, lineHeight: 1.6, color: SW.t55, maxWidth: "56ch" }}>{f.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section style={{ borderTop: `1px solid ${SW.line}`, padding: "clamp(56px, 9vw, 110px) clamp(16px, 4vw, 40px)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/swell-studio-logo.png" alt="Swell Studio" style={{ height: 40, width: "auto", display: "block" }} />
          <h2 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(34px, 10vw, 56px)", lineHeight: 0.93, letterSpacing: "-0.04em", margin: 0 }}>{t.finalCta.h2a}<br />{t.finalCta.h2b}<span style={{ color: SW.ember }}>.</span></h2>
          <button onClick={openLead} className="swl-cta" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: EMBER_GRAD, color: "#0A0908", border: "none", borderRadius: 4, padding: "20px 28px", fontFamily: FONT.body, fontSize: 17, fontWeight: 800, letterSpacing: "-0.015em", cursor: "pointer", boxShadow: "0 16px 50px rgba(224,116,47,0.26)" }}>
            {t.finalCta.cta}<Arrow />
          </button>
          <div style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: "0.18em", color: SW.t42 }}>{t.finalCta.sub}</div>
          <a href="mailto:contato@swellfilmes.com.br" style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.16em", color: SW.t35, marginTop: 10, textDecoration: "none" }}>CONTATO@SWELLFILMES.COM.BR</a>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ borderTop: `1px solid ${SW.line}`, padding: "24px clamp(16px, 4vw, 40px)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.16em", color: SW.t35 }}>
        <span>SWELL STUDIO · UMA MARCA SWELL FILMES</span>
        <span>SALVADOR · BAHIA</span>
      </footer>

      {/* espaço pra barra fixa não cobrir o rodapé no celular */}
      <div className="swl-stickypad" style={{ height: 76 }} aria-hidden />

      {/* ============ BARRA FIXA (mobile) — só depois que o herói sai da tela ============ */}
      {showSticky && (
        <div className="swl-sticky" style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 70, padding: "8px 14px calc(8px + env(safe-area-inset-bottom))", background: "rgba(10,9,8,0.94)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderTop: `1px solid ${SW.line2}` }}>
          <button onClick={openLead} className="swl-cta" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: EMBER_GRAD, color: "#0A0908", border: "none", borderRadius: 4, padding: "13px 18px", fontFamily: FONT.body, fontSize: 14.5, fontWeight: 800, letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "0 -6px 30px rgba(224,116,47,0.28)" }}>
            {t.sticky}<Arrow size={16} />
          </button>
        </div>
      )}

      {/* ============ MODAL DE LEAD ============ */}
      {showLead && (
        <div onClick={() => setShowLead(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,9,8,0.88)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: SW.surface, border: "1px solid rgba(224,116,47,0.35)", borderRadius: 4, padding: "clamp(24px, 5vw, 34px)", position: "relative", boxShadow: "0 40px 120px rgba(0,0,0,0.7)" }}>
            <button onClick={() => setShowLead(false)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: SW.t40, cursor: "pointer", padding: 6, lineHeight: 0 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            {leadStatus === "idle" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.22em", color: SW.ember }}>{t.modal.kicker}</div>
                <h3 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: "clamp(26px, 7vw, 34px)", lineHeight: 0.95, letterSpacing: "-0.035em", margin: 0 }}>{t.modal.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: SW.t55, margin: 0 }}>{t.modal.body}</p>
                <input value={leadEmail} onChange={(e) => { setLeadEmail(e.target.value); if (leadError) setLeadError(""); }} onKeyDown={(e) => { if (e.key === "Enter") submitLead(); }} type="email" autoComplete="email" placeholder={t.modal.placeholder} autoFocus
                  style={{ width: "100%", background: SW.bg, border: `1px solid ${leadError ? "rgba(232,131,111,0.7)" : "rgba(244,239,230,0.16)"}`, borderRadius: 3, padding: "15px 16px", color: SW.text, fontFamily: FONT.body, fontSize: 16, outline: "none" }} />
                {leadError && <div style={{ color: "#E8836F", fontSize: 12.5, lineHeight: 1.4, marginTop: -6 }}>{leadError}</div>}
                <button onClick={submitLead} className="swl-cta" style={{ width: "100%", background: EMBER_GRAD, color: "#0A0908", border: "none", borderRadius: 3, padding: 17, fontFamily: FONT.body, fontSize: 16, fontWeight: 800, cursor: "pointer" }}>{t.modal.cta}</button>
                <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.14em", color: SW.t35, textAlign: "center" }}>{t.modal.nospam}</div>
              </div>
            ) : leadStatus === "sent" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center", padding: "12px 0" }}>
                <div style={{ width: 52, height: 52, borderRadius: 999, background: "rgba(224,116,47,0.12)", border: "1px solid rgba(224,116,47,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={SW.ember} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22 6 12 13 2 6" /></svg>
                </div>
                <h3 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: 26, letterSpacing: "-0.03em", margin: 0 }}>{t.sent.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: SW.t55, margin: 0 }}>{t.sent.body(leadEmail)}</p>
                <div style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: "0.14em", color: SW.t35 }}>{t.sent.spam}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center", padding: "12px 0" }}>
                <div style={{ width: 52, height: 52, borderRadius: 999, background: "rgba(244,239,230,0.06)", border: `1px solid ${SW.line2}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={SW.ember} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <h3 style={{ fontFamily: FONT.archivo, fontWeight: 900, fontSize: 24, letterSpacing: "-0.03em", margin: 0 }}>{t.blocked.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.55, color: SW.t55, margin: 0 }}>{leadMsg}</p>
                <a href="#planos" onClick={() => setShowLead(false)} className="swl-cta" style={{ width: "100%", textAlign: "center", background: EMBER_GRAD, color: "#0A0908", borderRadius: 3, padding: 15, fontFamily: FONT.body, fontSize: 15, fontWeight: 800, textDecoration: "none", marginTop: 4 }}>{t.blocked.seePlans}</a>
                <a href="/entrar" style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.14em", color: SW.t45, textDecoration: "none" }}>{t.blocked.alreadyHave}</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
