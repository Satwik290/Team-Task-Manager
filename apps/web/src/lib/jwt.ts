import { SignJWT, jwtVerify } from "jose";

function getSecret() {
<<<<<<< HEAD
  const secret = process.env.JWT_SECRET;
  
  // If we have the secret, use it.
  if (secret) return new TextEncoder().encode(secret);

  // If we are in production (Railway) and the secret is missing, we have a problem.
  // HOWEVER, we must allow the 'next build' phase to complete.
  // Next.js sets CI=true or other build-specific env vars.
  const isBuildStep = process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI === 'true';
  
  if (process.env.NODE_ENV === 'production' && !isBuildStep) {
    throw new Error('🚨 JWT_SECRET environment variable is required. Set it in your deployment platform.');
  }

  // Fallback for development and build-time analysis
  return new TextEncoder().encode("temp-secret-for-build-and-dev");
=======
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('🚨 JWT_SECRET environment variable is required. Set it in your deployment platform.');
  }
  return new TextEncoder().encode(jwtSecret);
>>>>>>> 8904e235cfa899c82fec86ccd154b04c8e7fb0a3
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
