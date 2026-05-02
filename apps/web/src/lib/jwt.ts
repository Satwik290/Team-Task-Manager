import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('🚨 JWT_SECRET environment variable is required. Set it in your deployment platform.');
  }
  return new TextEncoder().encode(jwtSecret);
}

export async function signJWT(payload: { userId: string; email: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret());
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { userId: string; email: string; role: string };
  } catch (error) {
    return null;
  }
}
