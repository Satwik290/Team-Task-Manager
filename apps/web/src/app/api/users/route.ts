import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ users });
  } catch (error) {
    return jsonError(error);
  }
}
