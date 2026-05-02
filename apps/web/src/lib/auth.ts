import { cookies } from "next/headers";
import { prisma, type User } from "@repo/db";
import { ApiError } from "@/lib/api";
import bcrypt from "bcryptjs";
import { verifyJWT, signJWT } from "./jwt";

export { signJWT, verifyJWT };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyJWT(token);
}

export async function requireUser(): Promise<User> {
  const session = await getSession();

  if (!session) {
    throw new ApiError(401, "Authentication is required.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    throw new ApiError(401, "User not found.");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    throw new ApiError(403, "Admin privileges are required.");
  }

  return user;
}
