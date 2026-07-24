import { SignJWT, jwtVerify } from "jose";

const ISSUER = "swell-lens";
const AUDIENCE = "swell-lens-access";
const TTL_SECONDS = 15 * 60; // 15 min

function secret() {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 24) {
    throw new Error(
      "JWT_SECRET ausente ou fraca (>=24 chars). Gere com `openssl rand -base64 48` e setar na Vercel."
    );
  }
  return new TextEncoder().encode(raw);
}

export async function signAccessToken(email: string): Promise<string> {
  return await new SignJWT({ email: email.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    const email = typeof payload.email === "string" ? payload.email : null;
    return email;
  } catch {
    return null;
  }
}
