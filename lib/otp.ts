import { SignJWT, jwtVerify } from "jose";
import { createHash, randomInt } from "crypto";

// Código de 6 dígitos guardado num TOKEN ASSINADO (sem banco). O token carrega só
// o HASH do código — quem intercepta o token não descobre o código (tem que vir do
// e-mail). Vale 10 minutos.
const ISSUER = "swell-lens";
const AUDIENCE = "swell-lens-otp";
const TTL_SECONDS = 10 * 60;

function secret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 24) {
    throw new Error("JWT_SECRET ausente ou fraca (>=24 chars).");
  }
  return new TextEncoder().encode(raw);
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashCode(email: string, code: string): string {
  return createHash("sha256").update(`${email.toLowerCase()}:${code}:${process.env.JWT_SECRET}`).digest("hex");
}

export async function signOtpToken(params: { email: string; name: string | null; codeHash: string }): Promise<string> {
  return await new SignJWT({ email: params.email.toLowerCase(), name: params.name, ch: params.codeHash })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyOtpToken(token: string): Promise<{ email: string; name: string | null; codeHash: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER, audience: AUDIENCE });
    if (typeof payload.email !== "string" || typeof payload.ch !== "string") return null;
    return {
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
      codeHash: payload.ch,
    };
  } catch {
    return null;
  }
}
