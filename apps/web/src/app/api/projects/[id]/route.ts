import { NextResponse } from "next/server";
import { prisma, updateProjectSchema } from "@repo/db";
import { ApiError, jsonError, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await parseJson(request);

    const data = updateProjectSchema.parse(body);

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...data,
        description: "description" in data ? data.description || null : undefined,
      }
    });

    return NextResponse.json({ project });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
       return jsonError(new ApiError(404, "Project not found."));
    }
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    await prisma.project.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
       return jsonError(new ApiError(404, "Project not found."));
    }
    return jsonError(error);
  }
}
