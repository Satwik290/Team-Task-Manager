import { UserNav } from "@/components/user-nav";
import { Role } from "@repo/db";
import { CheckCircle2, Clock3, FolderKanban, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";
import { DashboardShell, type DashboardPayload } from "@/components/dashboard-shell";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

function serializeDashboard(data: Awaited<ReturnType<typeof getDashboardData>>) {
  return {
    metrics: data.metrics,
    upcoming: data.upcoming.map((task) => ({
      ...task,
      dueDate: task.dueDate.toISOString(),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      project: {
        ...task.project,
        createdAt: task.project.createdAt.toISOString(),
        updatedAt: task.project.updatedAt.toISOString()
      },
      assignee: task.assignee
        ? {
            ...task.assignee,
            createdAt: task.assignee.createdAt.toISOString(),
            updatedAt: task.assignee.updatedAt.toISOString()
          }
        : null
    })),
    projects: data.projects.map((project) => ({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      owner: {
        ...project.owner,
        createdAt: project.owner.createdAt.toISOString(),
        updatedAt: project.owner.updatedAt.toISOString()
      },
      tasks: project.tasks.map((task) => ({
        ...task,
        dueDate: task.dueDate.toISOString(),
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        assignee: task.assignee
          ? {
              ...task.assignee,
              createdAt: task.assignee.createdAt.toISOString(),
              updatedAt: task.assignee.updatedAt.toISOString()
            }
          : null
      }))
    })),
    users: data.users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }))
  } satisfies DashboardPayload;
}

export default async function HomePage() {
  const user = await requireUser();
  const dashboard = serializeDashboard(await getDashboardData(user));
  const isAdmin = user.role === Role.ADMIN;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FolderKanban />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-normal">
                Team Task Manager
              </h1>
              <p className="text-sm text-muted-foreground">
                Secure project operations for admins and members.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm sm:flex glass">
              {isAdmin ? <ShieldCheck /> : <CheckCircle2 />}
              <span>{isAdmin ? "Admin" : "Member"}</span>
            </div>
            <ThemeToggle />
            <UserNav user={{ name: user.name, email: user.email, role: user.role }} />
          </div>
        </div>
      </header>

      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-6">
        <div className="flex flex-col gap-1">
          <p className="flex items-center gap-2 text-sm font-semibold tracking-wide text-primary uppercase">
            <Clock3 className="h-4 w-4" />
            Live operational dashboard
          </p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Today&apos;s task load, sorted by urgency.
          </h2>
          <p className="max-w-[700px] mt-1 text-sm text-muted-foreground">
            Admins can create projects and assign work. Members get a focused
            surface for moving their assigned tasks across the delivery flow.
          </p>
        </div>

        <DashboardShell
          data={dashboard}
          currentUser={{
            ...user,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString()
          }}
        />
      </section>
    </main>
  );
}
