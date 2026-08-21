import { promises as dnsp } from "dns";

// Validação de e-mail SEM mandar nada: sintaxe + anti-descartável + o domínio existe.
// (A garantia de que é DA pessoa vem do código de 6 dígitos, no fluxo de OTP.)

const DISPOSABLE = new Set([
  "mailinator.com", "tempmail.com", "temp-mail.org", "10minutemail.com", "guerrillamail.com",
  "yopmail.com", "trashmail.com", "getnada.com", "sharklasers.com", "throwawaymail.com",
  "maildrop.cc", "fakeinbox.com", "dispostable.com", "mailnesia.com", "mytemp.email",
  "moakt.com", "tempr.email", "emailondeck.com", "mohmal.com", "mailcatch.com",
  "spam4.me", "grr.la", "guerrillamail.info", "tempmailo.com", "luxusmail.org",
]);

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((res) => setTimeout(() => res(fallback), ms))]);
}

// O domínio consegue RECEBER e-mail? true = tem MX (ou A). false = inexistente.
// Erro transitório (timeout/servfail) → true (fail-open: não bloqueia usuário real).
async function domainCanReceiveMail(domain: string): Promise<boolean> {
  try {
    const mx = await dnsp.resolveMx(domain);
    if (mx && mx.length) return true;
  } catch (e) {
    const code = (e as NodeJS.ErrnoException)?.code;
    if (code !== "ENOTFOUND" && code !== "ENODATA") return true;
  }
  try {
    const a = await dnsp.resolve(domain);
    return !!(a && a.length);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND" || code === "ENODATA") return false;
    return true;
  }
}

export async function validateEmail(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, error: "E-mail inválido." };
  }
  const domain = email.split("@")[1].toLowerCase();
  if (DISPOSABLE.has(domain)) {
    return { ok: false, error: "Use um e-mail pessoal ou da empresa — e-mail temporário não vale." };
  }
  const reachable = await withTimeout(domainCanReceiveMail(domain), 3000, true);
  if (!reachable) {
    return { ok: false, error: "Esse e-mail parece inválido. Confira o endereço e tente de novo." };
  }
  return { ok: true };
}
