import { Resend } from "resend";

const FROM = "Swell <acesso@swellai.studio>";
const REPLY_TO = "contato@swellfilmes.com.br";

// ── Paleta "Maré" adaptada pra e-mail (clientes não carregam Archivo/CDN) ─────
const C = {
  bg: "#0A0908",
  card: "#151310",
  line: "#2A241D",
  text: "#F4EFE6",
  muted: "#9A938A",
  ember: "#E0742F",
  emberInk: "#0A0908",
};
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "'IBM Plex Mono','SFMono-Regular',Menlo,Consolas,monospace";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY não configurada.");
  return new Resend(key);
}

// Base do site pra CTAs (usada por boas-vindas). Preferimos a env; senão, cai
// no domínio de produção. O caller pode sobrescrever passando `siteUrl`.
export function siteBaseUrl(override?: string): string {
  const raw = override || process.env.NEXT_PUBLIC_SITE_URL || "https://swellai.studio";
  return raw.replace(/\/$/, "");
}

// ── Layout compartilhado — todos os e-mails usam este shell ───────────────────
function renderEmail(opts: {
  preheader: string;      // texto de preview (some no corpo)
  kicker: string;         // rótulo mono em caixa-alta
  heading: string;        // título grande
  bodyHtml: string;       // parágrafos (HTML)
  ctaLabel: string;
  ctaLink: string;
  ctaHint?: string;       // linha abaixo do botão (ex: colar o link)
  footerNote: string;     // aviso do rodapé
}): string {
  const { preheader, kicker, heading, bodyHtml, ctaLabel, ctaLink, ctaHint, footerNote } = opts;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:${FONT};color:${C.text}">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:${C.card};border:1px solid ${C.line};border-radius:16px;padding:36px">
        <tr><td style="padding-bottom:24px">
          <span style="font-size:20px;font-weight:800;letter-spacing:-.02em;color:${C.text}">Swell<span style="color:${C.ember}">.</span></span>
          <span style="font-family:${MONO};font-size:10px;letter-spacing:.22em;color:${C.muted};margin-left:10px">SWELL STUDIO</span>
        </td></tr>
        <tr><td style="font-family:${MONO};font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:${C.ember};padding-bottom:14px">
          ${kicker}
        </td></tr>
        <tr><td style="font-size:26px;font-weight:800;letter-spacing:-.02em;color:${C.text};line-height:1.15;padding-bottom:16px">
          ${heading}
        </td></tr>
        <tr><td style="font-size:15px;line-height:1.65;color:${C.muted};padding-bottom:26px">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding-bottom:${ctaHint ? "16px" : "24px"}">
          <a href="${ctaLink}" style="display:inline-block;background:${C.ember};color:${C.emberInk};text-decoration:none;font-weight:700;font-size:15px;padding:15px 28px;border-radius:12px">${ctaLabel} &rarr;</a>
        </td></tr>
        ${ctaHint ? `<tr><td style="font-size:12px;color:${C.muted};line-height:1.6;padding-bottom:24px">${ctaHint}</td></tr>` : ""}
        <tr><td style="border-top:1px solid ${C.line};padding-top:18px;font-size:12px;color:${C.muted};line-height:1.6">
          ${footerNote}
        </td></tr>
      </table>
      <div style="font-size:11px;color:#6B655C;margin-top:16px;font-family:${FONT}">
        Swell Filmes &middot; <a href="mailto:${REPLY_TO}" style="color:#8A847A">${REPLY_TO}</a>
      </div>
    </td></tr>
  </table>
</body></html>`;
}

async function deliver(opts: { email: string; subject: string; html: string; text: string }) {
  const resend = client();
  const result = await resend.emails.send({
    from: FROM,
    to: opts.email,
    replyTo: REPLY_TO,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  if (result.error) {
    console.error(`[email] Resend REJEITOU (${opts.email}):`, result.error.message);
    throw new Error(`Resend: ${result.error.message}`);
  }
  console.log(`[email] enviado para ${opts.email} — id ${result.data?.id ?? "?"}`);
}

function firstName(name?: string | null): string {
  return name ? name.trim().split(" ")[0] : "";
}

type BuiltEmail = { subject: string; html: string; text: string };

// ── 1) Link mágico de acesso (login sem senha) ───────────────────────────────
export function buildMagicLinkEmail(params: { link: string; name?: string | null }): BuiltEmail {
  const { link, name } = params;
  const fn = firstName(name);
  const greet = fn ? `Oi, ${fn}!` : "Oi!";
  return {
    subject: "Seu link de acesso ao Swell Studio",
    html: renderEmail({
      preheader: "Seu link de acesso ao Swell Studio — vale 15 minutos.",
      kicker: "Acesso ao estúdio",
      heading: `${greet} Seu acesso ao estúdio.`,
      bodyHtml: `Clique no botão abaixo pra entrar. O link vale por <strong style="color:${C.text}">15 minutos</strong> e só funciona uma vez.`,
      ctaLabel: "Entrar no estúdio",
      ctaLink: link,
      ctaHint: `Se o botão não funcionar, copie e cole este endereço no navegador:<br><span style="color:#8A847A;word-break:break-all">${link}</span>`,
      footerNote: "Não pediu esse acesso? Pode ignorar este e-mail — sem esse link ninguém entra.",
    }),
    text: `${greet}\n\nSeu link de acesso ao Swell Studio (vale 15 minutos, só funciona uma vez):\n\n${link}\n\nSe não pediu esse acesso, ignore este e-mail.\n\nSwell Filmes`,
  };
}

export async function sendMagicLink(params: { email: string; link: string; name?: string | null }) {
  await deliver({ email: params.email, ...buildMagicLinkEmail(params) });
}

// ── 2) Boas-vindas ao assinante (após a compra confirmada) ───────────────────
export function buildWelcomeSubscriberEmail(params: { name?: string | null; siteUrl?: string }): BuiltEmail {
  const fn = firstName(params.name);
  const greet = fn ? `Bem-vindo, ${fn}!` : "Bem-vindo!";
  const site = siteBaseUrl(params.siteUrl);
  return {
    subject: "Bem-vindo ao Swell Studio — sua assinatura está ativa",
    html: renderEmail({
      preheader: "Sua assinatura do Swell Studio está ativa. Veja como entrar.",
      kicker: "Assinatura ativa",
      heading: `${greet} Seu estúdio está pronto.`,
      bodyHtml:
        `Sua assinatura do <strong style="color:${C.text}">Swell Studio</strong> está ativa. ` +
        `Pra entrar, é sem senha: acesse o site, clique em <strong style="color:${C.text}">"Já sou assinante"</strong> ` +
        `e informe este mesmo e-mail — a gente te manda um link mágico na hora.<br><br>` +
        `Lá dentro você gera <strong style="color:${C.text}">fotos de produto</strong> e <strong style="color:${C.text}">ensaios de pessoa</strong> com direção de arte Swell, em minutos.`,
      ctaLabel: "Entrar no estúdio",
      ctaLink: `${site}/?next=/studio`,
      footerNote: "Precisa de ajuda? É só responder este e-mail que a gente te atende.",
    }),
    text: `${greet}\n\nSua assinatura do Swell Studio está ativa.\n\nPra entrar (sem senha): acesse ${site}, clique em "Já sou assinante" e informe este e-mail — enviamos um link de acesso na hora.\n\nSwell Filmes`,
  };
}

export async function sendWelcomeSubscriber(params: { email: string; name?: string | null; siteUrl?: string }) {
  await deliver({ email: params.email, ...buildWelcomeSubscriberEmail(params) });
}

// ── 3) Confirmação do teste grátis (captura de lead) ─────────────────────────
export function buildTrialWelcomeEmail(params: { name?: string | null; siteUrl?: string }): BuiltEmail {
  const fn = firstName(params.name);
  const greet = fn ? `Oi, ${fn}!` : "Oi!";
  const site = siteBaseUrl(params.siteUrl);
  return {
    subject: "Seu teste do Swell Studio está liberado",
    html: renderEmail({
      preheader: "Seu teste do Swell Studio está liberado — comece pela foto do produto.",
      kicker: "Teste liberado",
      heading: `${greet} Seu teste está liberado.`,
      bodyHtml:
        `Você já pode experimentar o <strong style="color:${C.text}">Swell Studio</strong>. ` +
        `Suba uma foto (de produto ou sua) e receba fotos com cara de ensaio profissional — sem estúdio, sem fotógrafo.<br><br>` +
        `Guarde este e-mail: é por ele que a gente te avisa das novidades e do lançamento.`,
      ctaLabel: "Abrir o estúdio",
      ctaLink: `${site}/?next=/studio`,
      footerNote: "Recebeu sem querer? Pode ignorar — guardamos só seu e-mail, nada mais.",
    }),
    text: `${greet}\n\nSeu teste do Swell Studio está liberado. Suba uma foto e receba fotos com cara de ensaio profissional.\n\nAbrir o estúdio: ${site}/?next=/studio\n\nSwell Filmes`,
  };
}

export async function sendTrialWelcome(params: { email: string; name?: string | null; siteUrl?: string }) {
  await deliver({ email: params.email, ...buildTrialWelcomeEmail(params) });
}

// ── 4) Link do teste grátis (confirma o e-mail e libera as 5 fotos) ───────────
export function buildTrialAccessEmail(params: { link: string; name?: string | null }): BuiltEmail {
  const { link, name } = params;
  const fn = firstName(name);
  const greet = fn ? `Oi, ${fn}!` : "Oi!";
  return {
    subject: "Libere seu teste grátis do Swell Studio",
    html: renderEmail({
      preheader: "Confirme seu e-mail e libere 5 fotos grátis — o link vale 15 minutos.",
      kicker: "Teste grátis",
      heading: `${greet} Falta um clique.`,
      bodyHtml:
        `Confirme que este e-mail é seu e libere suas <strong style="color:${C.text}">5 fotos grátis</strong>. ` +
        `O link abre o estúdio direto e vale por <strong style="color:${C.text}">15 minutos</strong>.`,
      ctaLabel: "Liberar minhas 5 fotos",
      ctaLink: link,
      ctaHint: `Se o botão não funcionar, copie e cole no navegador:<br><span style="color:#8A847A;word-break:break-all">${link}</span>`,
      footerNote: "Não pediu esse teste? Pode ignorar — sem esse link ninguém entra.",
    }),
    text: `${greet}\n\nConfirme seu e-mail e libere 5 fotos grátis no Swell Studio (o link vale 15 minutos):\n\n${link}\n\nNão pediu? Ignore este e-mail.\n\nSwell Filmes`,
  };
}

export async function sendTrialAccessLink(params: { email: string; link: string; name?: string | null }) {
  await deliver({ email: params.email, ...buildTrialAccessEmail(params) });
}

// ── 5) Código de acesso (OTP de 6 dígitos) ────────────────────────────────────
export async function sendOtpCode(params: { email: string; code: string; name?: string | null }) {
  const { email, code, name } = params;
  const fn = firstName(name);
  const greet = fn ? `Oi, ${fn}!` : "Oi!";
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:${FONT};color:${C.text}">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden">Seu código do Swell Studio: ${code}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:${C.card};border:1px solid ${C.line};border-radius:16px;padding:36px">
        <tr><td style="padding-bottom:24px">
          <span style="font-size:20px;font-weight:800;letter-spacing:-.02em;color:${C.text}">Swell<span style="color:${C.ember}">.</span></span>
          <span style="font-family:${MONO};font-size:10px;letter-spacing:.22em;color:${C.muted};margin-left:10px">SWELL STUDIO</span>
        </td></tr>
        <tr><td style="font-family:${MONO};font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:${C.ember};padding-bottom:14px">Código de acesso</td></tr>
        <tr><td style="font-size:26px;font-weight:800;letter-spacing:-.02em;color:${C.text};line-height:1.15;padding-bottom:16px">${greet} Seu código:</td></tr>
        <tr><td align="center" style="padding:8px 0 22px">
          <div style="display:inline-block;background:${C.bg};border:1px solid ${C.line};border-radius:12px;padding:18px 26px;font-family:${MONO};font-size:38px;font-weight:700;letter-spacing:.34em;color:${C.text}">${code}</div>
        </td></tr>
        <tr><td style="font-size:15px;line-height:1.65;color:${C.muted};padding-bottom:24px">Digite este código na tela pra entrar. Ele vale por <strong style="color:${C.text}">10 minutos</strong>.</td></tr>
        <tr><td style="border-top:1px solid ${C.line};padding-top:18px;font-size:12px;color:${C.muted};line-height:1.6">Não pediu esse código? Pode ignorar este e-mail — sem ele ninguém entra.</td></tr>
      </table>
      <div style="font-size:11px;color:#6B655C;margin-top:16px;font-family:${FONT}">Swell Filmes &middot; <a href="mailto:${REPLY_TO}" style="color:#8A847A">${REPLY_TO}</a></div>
    </td></tr>
  </table>
</body></html>`;
  const text = `${greet}\n\nSeu código de acesso ao Swell Studio: ${code}\n\nVale 10 minutos. Não pediu? Ignore este e-mail.\n\nSwell Filmes`;
  await deliver({ email, subject: `${code} é o seu código do Swell Studio`, html, text });
}
