import { NextResponse } from "next/server";
import { createTaskSchema, prisma } from "@repo/db";
import { ApiError, jsonError, parseJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const payload = createTaskSchema.parse(await parseJson(request));
    const [project, assignee] = await Promise.all([
      prisma.project.findUnique({ where: { id: payload.projectId }, select: { id: true } }),
      payload.assigneeId
        ? prisma.user.findUnique({ where: { id: payload.assigneeId }, select: { id: true } })
        : Promise.resolve(null)
    ]);

    if (!project) {
      throw new ApiError(404, "Project not found.");
    }

    if (payload.assigneeId && !assignee) {
      throw new ApiError(404, "Assignee not found.");
    }

    const task = await prisma.task.create({
      data: {
        title: payload.title,
        description: payload.description || null,
        projectId: payload.projectId,
        assigneeId: payload.assigneeId || null,
        dueDate: payload.dueDate,
        priority: payload.priority,
        status: payload.status
      },
      include: {
        project: true,
        assignee: true
      }
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
