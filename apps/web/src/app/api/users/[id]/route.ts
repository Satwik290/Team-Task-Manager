import { NextResponse } from "next/server";
import { prisma, Role } from "@repo/db";
import { jsonError, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await requireAdmin();
    
    // Prevent admin from changing their own role (to prevent accidental lockout)
    if (admin.id === id) {
      return NextResponse.json(
        { error: "You cannot change your own role." },
        { status: 400 }
      );
    }

    const payload = updateRoleSchema.parse(await parseJson(request));

    const user = await prisma.user.update({
      where: { id },
      data: { role: payload.role },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}
