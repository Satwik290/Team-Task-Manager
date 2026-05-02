"use client";

import { useState } from "react";
import { Priority, Status } from "@repo/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type User = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  dueDate: string;
  projectId: string;
  assigneeId: string | null;
};

type TaskEditModalProps = {
  task: Task | null;
  projects: Project[];
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, data: Partial<Task>) => Promise<void>;
  isAdmin: boolean;
};

export function TaskEditModal({
  task,
  projects,
  users,
  isOpen,
  onClose,
  onSave,
  isAdmin,
}: TaskEditModalProps) {
  const [isPending, setIsPending] = useState(false);

  if (!task) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    
    const assigneeId = formData.get("assigneeId") as string;
    
    const data: Partial<Task> = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      projectId: formData.get("projectId") as string,
      assigneeId: assigneeId === "unassigned" ? null : assigneeId,
      dueDate: formData.get("dueDate") as string,
      priority: formData.get("priority") as Priority,
      status: formData.get("status") as Status,
    };

    if (!task) return;

    try {
      await onSave(task.id, data);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update the task details below. {isAdmin ? "Full editing enabled." : "Status-only editing for members."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={task.title}
              disabled={!isAdmin || isPending}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={task.description || ""}
              disabled={!isAdmin || isPending}
              className="min-h-[100px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Project</Label>
              <Select name="projectId" defaultValue={task.projectId} disabled={!isAdmin || isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Assignee</Label>
              <Select name="assigneeId" defaultValue={task.assigneeId || "unassigned"} disabled={!isAdmin || isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-due-date">Due Date</Label>
              <Input
                id="edit-due-date"
                name="dueDate"
                type="date"
                defaultValue={task.dueDate.split("T")[0]}
                disabled={!isAdmin || isPending}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select name="priority" defaultValue={task.priority} disabled={!isAdmin || isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {Object.values(Priority).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select name="status" defaultValue={task.status} disabled={isPending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.values(Status).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
