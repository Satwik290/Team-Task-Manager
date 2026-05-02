import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  
  // If we have the secret, use it.
  if (secret) return new TextEncoder().encode(secret);

  // Detection for build phase (Next.js build, CI, or lack of JWT_SECRET in production build)
  const isBuildStep = 
    process.env.NEXT_PHASE === 'phase-production-build' || 
    process.env.CI === 'true' ||
    process.env.NODE_ENV === 'production'; // Allow it to pass during build, we will throw at runtime if still missing
  
  if (process.env.NODE_ENV === 'production' && !secret && !isBuildStep) {
    throw new Error('🚨 JWT_SECRET environment variable is required. Set it in your deployment platform.');
  }

  // Fallback for development and build-time analysis
  return new TextEncoder().encode("temp-secret-for-build-and-dev");
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
