import { NextResponse } from "next/server";
import {
  adminUpdateTaskSchema,
  memberUpdateTaskSchema,
  prisma,
  Role
} from "@repo/db";
import { ApiError, jsonError, parseJson } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await parseJson(request);

    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        assigneeId: true,
        project: {
          select: {
            ownerId: true
          }
        }
      }
    });

    if (!task) {
      throw new ApiError(404, "Task not found.");
    }

    if (user.role !== Role.ADMIN && task.assigneeId !== user.id) {
      throw new ApiError(403, "Members can only update assigned task status.");
    }

    const data =
      user.role === Role.ADMIN
        ? adminUpdateTaskSchema.parse(body)
        : memberUpdateTaskSchema.parse(body);

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        description: "description" in data ? data.description || null : undefined,
        assigneeId: "assigneeId" in data ? data.assigneeId || null : undefined
      },
      include: {
        project: true,
        assignee: true
      }
    });

    return NextResponse.json({ task: updated });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    await prisma.task.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
       return jsonError(new ApiError(404, "Task not found."));
    }
    return jsonError(error);
  }
}
