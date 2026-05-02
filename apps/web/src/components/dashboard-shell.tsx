"use client";

import { useMemo, useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { format, isPast, parseISO } from "date-fns";
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  Plus,
  TimerReset,
  TrendingUp,
  LayoutGrid,
  Calendar as CalendarIcon,
  Trash2
} from "lucide-react";
import { Priority, Role, Status, type User } from "@repo/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CalendarView } from "./calendar-view";
import { TaskEditModal } from "./task-edit-modal";

type SerializedUser = Omit<User, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type SerializedProject = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: SerializedUser;
  tasks: SerializedTask[];
};

type SerializedTask = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  dueDate: string;
  projectId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  project?: Omit<SerializedProject, "tasks" | "owner">;
  assignee: SerializedUser | null;
  projectName?: string;
};

export type DashboardPayload = {
  metrics: {
    total: number;
    pending: number;
    overdue: number;
    done: number;
  };
  upcoming: SerializedTask[];
  projects: SerializedProject[];
  users: SerializedUser[];
};

type DashboardShellProps = {
  data: DashboardPayload;
  currentUser: SerializedUser;
};

const statuses = [Status.TODO, Status.IN_PROGRESS, Status.DONE];
const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH];

const statusLabels: Record<Status, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done"
};

const priorityLabels: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High"
};

function isAdmin(user: Pick<User, "role">) {
  return user.role === Role.ADMIN;
}

async function requestJson(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error ?? "Request failed.");
  }

  return response.json();
}

function metricCards(data: DashboardPayload) {
  return [
    {
      label: "Total Tasks",
      value: data.metrics.total,
      icon: TrendingUp,
      note: "Across visible projects"
    },
    {
      label: "Pending Tasks",
      value: data.metrics.pending,
      icon: TimerReset,
      note: "Todo and in progress"
    },
    {
      label: "Overdue Tasks",
      value: data.metrics.overdue,
      icon: CalendarClock,
      note: "Past due and not done"
    },
    {
      label: "Done Tasks",
      value: data.metrics.done,
      icon: CheckCircle2,
      note: "Completed work"
    }
  ];
}

export function DashboardShell({ data, currentUser }: DashboardShellProps) {
  const router = useRouter();
  const admin = isAdmin(currentUser);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"board" | "calendar">("board");
  const [editingTask, setEditingTask] = useState<SerializedTask | null>(null);

  const flatTasks = useMemo(() => {
    return data.projects.flatMap((project) =>
      project.tasks.map((task) => ({ ...task, projectName: project.name }))
    );
  }, [data.projects]);

  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    flatTasks,
    (state, updatedTask: { id: string; status: Status }) => {
      return state.map((task) =>
        task.id === updatedTask.id ? { ...task, status: updatedTask.status } : task
      );
    }
  );

  const groupedTasks = useMemo(() => {
    return statuses.map((status) => ({
      status,
      tasks: optimisticTasks.filter((task) => task.status === status)
    }));
  }, [optimisticTasks]);

  function refreshWithMessage(message: string) {
    setSuccess(message);
    setError(null);
    startTransition(() => router.refresh());
  }

  async function handleCreateProject(formData: FormData) {
    setError(null);
    setSuccess(null);

    try {
      await requestJson("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description")
        })
      });
      refreshWithMessage("Project created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create project.");
    }
  }

  async function handleCreateTask(formData: FormData) {
    setError(null);
    setSuccess(null);

    try {
      await requestJson("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          projectId: formData.get("projectId"),
          assigneeId: formData.get("assigneeId"),
          dueDate: formData.get("dueDate"),
          priority: formData.get("priority")
        })
      });
      refreshWithMessage("Task created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create task.");
    }
  }

  async function handleStatusChange(taskId: string, status: Status) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      setOptimisticTasks({ id: taskId, status });
      try {
        await requestJson(`/api/tasks/${taskId}`, {
          method: "PATCH",
          body: JSON.stringify({ status })
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to update task.");
        router.refresh(); // Revert optimistic update
      }
    });
  }

  async function handleUpdateTask(taskId: string, data: Partial<SerializedTask>) {
    setError(null);
    setSuccess(null);
    try {
      await requestJson(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(data)
      });
      refreshWithMessage("Task updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task.");
      throw err;
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await requestJson(`/api/tasks/${taskId}`, { method: "DELETE" });
        refreshWithMessage("Task deleted.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to delete task.");
      }
    });
  }

  async function handleDeleteProject(projectId: string) {
    if (!confirm("Are you sure you want to delete this project? All associated tasks will be removed.")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await requestJson(`/api/projects/${projectId}`, { method: "DELETE" });
        refreshWithMessage("Project deleted.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to delete project.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards(data).map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary glass shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <CardDescription className="text-xs font-medium uppercase tracking-wider">{metric.label}</CardDescription>
                  <CardTitle className="text-2xl font-bold tracking-tight">{metric.value}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{metric.note}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {(error || success || isPending) && (
        <div
          className={cn(
            "rounded-md border px-4 py-3 text-sm glass transition-all animate-in fade-in slide-in-from-top-2",
            error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-primary/30 bg-primary/10 text-primary"
          )}
        >
          {isPending && !error && !success ? "Synchronizing..." : error ?? success}
        </div>
      )}

      {admin && (
        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Create Project</CardTitle>
              <CardDescription>
                Add a managed project owned by your admin account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleCreateProject} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="project-name">Name</Label>
                  <Input id="project-name" name="name" required minLength={2} className="bg-background/50" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea id="project-description" name="description" className="bg-background/50" />
                </div>
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                  {isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Project
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Task</CardTitle>
              <CardDescription>
                Assign work to a project and teammate with a due date.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleCreateTask} className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="task-title">Title</Label>
                  <Input id="task-title" name="title" required minLength={2} className="bg-background/50" />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Textarea id="task-description" name="description" className="bg-background/50" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Project</Label>
                  <Select name="projectId" required>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectGroup>
                        {data.projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Assignee</Label>
                  <Select name="assigneeId">
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectGroup>
                        {data.users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="due-date">Due date</Label>
                  <Input id="due-date" name="dueDate" type="date" required className="bg-background/50" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue={Priority.MEDIUM}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectGroup>
                        {priorities.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priorityLabels[priority]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" disabled={isPending || data.projects.length === 0} className="w-full sm:w-auto">
                    {isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    Add Task
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle>Manage Projects</CardTitle>
              <CardDescription>View and delete existing projects.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {data.projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No projects created yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.projects.map((project) => (
                      <div key={project.id} className="flex flex-col justify-between p-4 border rounded-lg glass gap-4">
                        <div>
                          <p className="text-sm font-semibold">{project.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {project.description || "No description provided."}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">{project.tasks.length} task(s)</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id)}
                            disabled={isPending}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2"
                            title="Delete Project"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <div className="flex items-center justify-between mt-4">
        <h2 className="text-2xl font-semibold tracking-tight">Workspace</h2>
        <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/50 border glass">
          <Button
            variant={view === "board" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("board")}
            className="flex items-center gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Board</span>
          </Button>
          <Button
            variant={view === "calendar" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("calendar")}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <Card>
          <CardContent className="pt-6">
            <CalendarView tasks={optimisticTasks} />
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardDescription>
                Sorted by nearest due date across visible projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.upcoming.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground text-center py-8">
                        No tasks are visible yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.upcoming.map((task) => {
                      const optimisticTask = optimisticTasks.find(t => t.id === task.id) || task;
                      return (
                      <TableRow key={task.id} className="group transition-colors hover:bg-muted/50">
                        <TableCell className="max-w-[200px] truncate">
                          <button
                            onClick={() => setEditingTask(optimisticTask)}
                            className="font-medium group-hover:text-primary transition-colors truncate text-left hover:underline"
                          >
                            {task.title}
                          </button>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {priorityLabels[task.priority]} priority
                          </div>
                        </TableCell>
                        <TableCell>{task.project?.name ?? "Project"}</TableCell>
                        <TableCell>{task.assignee?.name ?? "Unassigned"}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              isPast(parseISO(task.dueDate)) && optimisticTask.status !== Status.DONE
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {format(parseISO(task.dueDate), "MMM d, yyyy")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusSelect
                              value={optimisticTask.status}
                              disabled={isPending}
                              onChange={(status) => handleStatusChange(task.id, status)}
                            />
                            {admin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTask(task.id)}
                                disabled={isPending}
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                title="Delete Task"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )})
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task Board</CardTitle>
              <CardDescription>
                Members can move assigned tasks; admins can move everything.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
              {groupedTasks.map((group) => (
                <div key={group.status} className="rounded-xl border bg-background/50 p-4 glass">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold tracking-tight">{statusLabels[group.status]}</h3>
                    <Badge variant="secondary" className="bg-background">{group.tasks.length}</Badge>
                  </div>
                  <div className="flex flex-col gap-3">
                    {group.tasks.length === 0 ? (
                      <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-muted text-sm text-muted-foreground/50">
                        No tasks
                      </div>
                    ) : (
                      group.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="group relative rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/50 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <button
                                onClick={() => setEditingTask(task)}
                                className="text-sm font-medium leading-tight group-hover:text-primary transition-colors text-left hover:underline"
                              >
                                {task.title}
                              </button>
                              <p className="text-xs text-muted-foreground">
                                {task.projectName}
                              </p>
                            </div>
                            <Badge
                              variant={
                                task.priority === Priority.HIGH
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {priorityLabels[task.priority]}
                            </Badge>
                          </div>
                          
                          <div className="pt-3 border-t flex items-center justify-between gap-2 mt-auto">
                            <div className="text-xs text-muted-foreground font-medium">
                              {format(parseISO(task.dueDate), "MMM d")}
                            </div>
                            <div className="flex items-center gap-1">
                              <StatusSelect
                                value={task.status}
                                disabled={isPending}
                                onChange={(status) => handleStatusChange(task.id, status)}
                              />
                              {admin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteTask(task.id)}
                                  disabled={isPending}
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  title="Delete Task"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      <TaskEditModal
        task={editingTask}
        projects={data.projects}
        users={data.users}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleUpdateTask}
        isAdmin={admin}
      />
    </div>
  );
}

function StatusSelect({
  value,
  disabled,
  onChange
}: {
  value: Status;
  disabled?: boolean;
  onChange: (status: Status) => void;
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => onChange(next as Status)}
    >
      <SelectTrigger className="h-8 min-w-[120px] bg-background/50 text-xs transition-colors hover:bg-background">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="glass">
        <SelectGroup>
          {statuses.map((status) => (
            <SelectItem key={status} value={status} className="text-xs">
              {statusLabels[status]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
