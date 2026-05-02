import { prisma, Role, Status, type User } from "@repo/db";

export function projectVisibilityWhere(user: User) {
  if (user.role === Role.ADMIN) {
    return {};
  }

  return {
    OR: [
      { ownerId: user.id },
      {
        tasks: {
          some: {
            assigneeId: user.id
          }
        }
      }
    ]
  };
}

export function taskVisibilityWhere(user: User) {
  if (user.role === Role.ADMIN) {
    return {};
  }

  return {
    OR: [{ assigneeId: user.id }, { project: { ownerId: user.id } }]
  };
}

export async function getDashboardData(user: User) {
  const where = taskVisibilityWhere(user);
  const now = new Date();

  const [total, done, overdue, upcoming, projects, users] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.count({ where: { ...where, status: Status.DONE } }),
    prisma.task.count({
      where: {
        ...where,
        dueDate: { lt: now },
        status: { not: Status.DONE }
      }
    }),
    prisma.task.findMany({
      where,
      include: {
        project: true,
        assignee: true
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 12
    }),
    prisma.project.findMany({
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
    }),
    user.role === Role.ADMIN
      ? prisma.user.findMany({ orderBy: { name: "asc" } })
      : Promise.resolve([])
  ]);

  return {
    metrics: {
      total,
      pending: total - done,
      overdue,
      done
    },
    upcoming,
    projects,
    users
  };
}
