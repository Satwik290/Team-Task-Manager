import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || (() => {
    throw new Error('🚨 JWT_SECRET environment variable is required. Set it in your deployment platform.');
  })()
);

export async function signJWT(payload: { userId: string; email: string; role: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string; email: string; role: string };
  } catch (error) {
    return null;
  }
}
