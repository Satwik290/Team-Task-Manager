import { PrismaClient, Priority, Role, Status } from "@prisma/client";
import { z } from "zod";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { Priority, Role, Status };
export type { Prisma, Project, Task, User } from "@prisma/client";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters."),
  description: z.string().trim().max(500).optional().nullable()
});

export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one project field is required."
  });

export const createTaskSchema = z.object({
  title: z.string().trim().min(2, "Task title must be at least 2 characters."),
  description: z.string().trim().max(1000).optional().nullable(),
  projectId: z.string().uuid("Project is required."),
  assigneeId: z.string().min(1).optional().nullable(),
  dueDate: z.coerce.date(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  status: z.nativeEnum(Status).default(Status.TODO)
});

export const adminUpdateTaskSchema = createTaskSchema
  .partial()
  .extend({
    status: z.nativeEnum(Status).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one task field is required."
  });

export const memberUpdateTaskSchema = z.object({
  status: z.nativeEnum(Status)
});
