import { Resend } from "resend";

const FROM = "Swell <acesso@swellai.studio>";
const REPLY_TO = "contato@swellfilmes.com.br";

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY não configurada.");
  return new Resend(key);
}

export async function sendMagicLink(params: {
  email: string;
  link: string;
  name?: string | null;
}) {
  const { email, link, name } = params;
  const greet = name ? `Oi, ${name.split(" ")[0]}!` : "Oi!";

  const html = `
<!doctype html>
<html><body style="margin:0;padding:0;background:#0b0b0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e5e5e5">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#151515;border:1px solid #262626;border-radius:14px;padding:32px">
        <tr><td style="font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#8a8a8a;padding-bottom:8px">
          Swell Filmes
        </td></tr>
        <tr><td style="font-size:22px;font-weight:700;color:#fff;padding-bottom:12px;line-height:1.3">
          ${greet} Seu acesso ao estúdio.
        </td></tr>
        <tr><td style="font-size:14px;line-height:1.6;color:#b5b5b5;padding-bottom:24px">
          Clique no botão abaixo pra entrar. O link vale por <strong style="color:#e5e5e5">15 minutos</strong> e só funciona uma vez.
        </td></tr>
        <tr><td style="padding-bottom:20px">
          <a href="${link}" style="display:inline-block;background:#c48a5c;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:8px">Entrar no estúdio →</a>
        </td></tr>
        <tr><td style="font-size:12px;color:#7a7a7a;line-height:1.6;padding-bottom:20px">
          Se o botão não funcionar, copie e cole este endereço no navegador:<br />
          <span style="color:#9a9a9a;word-break:break-all">${link}</span>
        </td></tr>
        <tr><td style="border-top:1px solid #262626;padding-top:16px;font-size:11px;color:#7a7a7a;line-height:1.6">
          Não pediu esse acesso? Pode ignorar este e-mail — sem esse link ninguém entra.
        </td></tr>
      </table>
      <div style="font-size:11px;color:#5a5a5a;margin-top:16px">
        Swell Filmes · <a href="mailto:${REPLY_TO}" style="color:#7a7a7a">${REPLY_TO}</a>
      </div>
    </td></tr>
  </table>
</body></html>`;

  const text = `${greet}\n\nSeu link de acesso ao estúdio Swell (vale 15 minutos, só funciona uma vez):\n\n${link}\n\nSe não pediu esse acesso, ignore este e-mail.\n\nSwell Filmes`;

  const resend = client();
  const result = await resend.emails.send({
    from: FROM,
    to: email,
    replyTo: REPLY_TO,
    subject: "Seu link de acesso ao estúdio Swell",
    html,
    text,
  });

  if (result.error) {
    throw new Error(`Resend: ${result.error.message}`);
  }
}
