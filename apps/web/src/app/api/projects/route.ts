import { NextResponse } from "next/server";
import { createProjectSchema, prisma, Role } from "@repo/db";
import { jsonError, parseJson } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";
import { projectVisibilityWhere } from "@/lib/queries";

export async function GET() {
  try {
    const user = await requireUser();
    const projects = await prisma.project.findMany({
      where: projectVisibilityWhere(user),
      include: {
        owner: true,
        tasks: {
          where: user.role === Role.ADMIN ? {} : { assigneeId: user.id },
          include: { assignee: true },
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ projects });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const payload = createProjectSchema.parse(await parseJson(request));
    const project = await prisma.project.create({
      data: {
        ...payload,
        description: payload.description || null,
        ownerId: user.id
      }
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
