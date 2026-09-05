"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type TaskStatus = "Backlog" | "In Progress" | "Review" | "Done";
type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

interface WorkTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  relatedTo: string;
  createdAt: string;
}

const storageKey = "trygc:pmo-tasks:v1";
const statuses: TaskStatus[] = ["Backlog", "In Progress", "Review", "Done"];
const priorities: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];
const assignees = ["Ahmed Abdelgawad", "Sara Al-Otaibi", "Omar Hassan", "Layla Mansour", "Yousef Al-Sabah"];

const starterTasks: WorkTask[] = [
  {
    id: "TSK-1001",
    title: "Confirm campaign replacement shortlist",
    description: "Review the remaining creator gap and confirm alternates with the campaign owner.",
    status: "In Progress",
    priority: "High",
    assignee: "Omar Hassan",
    dueDate: "2026-09-08",
    relatedTo: "Riyadh Seasonal Launch",
    createdAt: "2026-09-04T09:00:00Z",
  },
  {
    id: "TSK-1002",
    title: "Verify received Posting Coverage",
    description: "Check the submitted link and evidence before marking coverage as verified.",
    status: "Review",
    priority: "Urgent",
    assignee: "Sara Al-Otaibi",
    dueDate: "2026-09-05",
    relatedTo: "Riyadh Seasonal Launch",
    createdAt: "2026-09-04T10:30:00Z",
  },
  {
    id: "TSK-1003",
    title: "Follow up on outstanding invoice",
    description: "Record the client response and update the next collection date.",
    status: "Backlog",
    priority: "Medium",
    assignee: "Layla Mansour",
    dueDate: "2026-09-12",
    relatedTo: "Aurora Retail",
    createdAt: "2026-09-04T11:00:00Z",
  },
];

function priorityVariant(priority: TaskPriority) {
  if (priority === "Urgent") return "destructive" as const;
  if (priority === "High") return "secondary" as const;
  return "outline" as const;
}

export function TaskWorkspace() {
  const [tasks, setTasks] = useState<WorkTask[]>(starterTasks);
  const [hydrated, setHydrated] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WorkTask | null>(null);
  const [query, setQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [status, setStatus] = useState<TaskStatus>("Backlog");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [assignee, setAssignee] = useState(assignees[0]);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        setTasks(JSON.parse(saved) as WorkTask[]);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    if (new URLSearchParams(window.location.search).get("create") === "task") {
      setEditing(null);
      setDialogOpen(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(storageKey, JSON.stringify(tasks));
  }, [hydrated, tasks]);

  const visibleTasks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tasks.filter(
      (task) =>
        (assigneeFilter === "All" || task.assignee === assigneeFilter) &&
        (!normalized || `${task.title} ${task.description} ${task.relatedTo}`.toLowerCase().includes(normalized)),
    );
  }, [assigneeFilter, query, tasks]);

  function openNewTask() {
    setEditing(null);
    setStatus("Backlog");
    setPriority("Medium");
    setAssignee(assignees[0]);
    setDialogOpen(true);
  }

  function openTask(task: WorkTask) {
    setEditing(task);
    setStatus(task.status);
    setPriority(task.priority);
    setAssignee(task.assignee);
    setDialogOpen(true);
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const task: WorkTask = {
      id: editing?.id ?? `TSK-${Date.now().toString(36).toUpperCase()}`,
      title: String(data.get("title")),
      description: String(data.get("description")),
      status,
      priority,
      assignee,
      dueDate: String(data.get("dueDate")),
      relatedTo: String(data.get("relatedTo")),
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    setTasks((current) =>
      editing ? current.map((item) => (item.id === editing.id ? task : item)) : [task, ...current],
    );
    setDialogOpen(false);
    toast.success(editing ? "Task updated" : "Task created");
  }

  function moveTask(task: WorkTask, direction: -1 | 1) {
    const nextIndex = Math.max(0, Math.min(statuses.length - 1, statuses.indexOf(task.status) + direction));
    const nextStatus = statuses[nextIndex];
    if (nextStatus === task.status) return;
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)));
    toast.success(`Task moved to ${nextStatus}`);
  }

  function removeTask(task: WorkTask) {
    setTasks((current) => current.filter((item) => item.id !== task.id));
    setDialogOpen(false);
    toast.success("Task deleted");
  }

  const done = tasks.filter((task) => task.status === "Done").length;
  const overdue = tasks.filter(
    (task) => task.status !== "Done" && task.dueDate && new Date(`${task.dueDate}T23:59:59`).getTime() < Date.now(),
  ).length;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-medium text-muted-foreground text-sm">Tasks & PMO</p>
          <h1 className="font-semibold text-3xl tracking-tight">Team Task Board</h1>
          <p className="mt-1 text-muted-foreground text-sm">Create, assign, edit, move, and complete connected work.</p>
        </div>
        <Button onClick={openNewTask}>
          <Plus data-icon="inline-start" />
          Add task
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total tasks</CardDescription>
            <CardTitle className="text-2xl">{tasks.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl">{done}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-2xl">{overdue}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 md:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              placeholder="Search tasks, clients, or campaigns"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="All">All assignees</SelectItem>
                {assignees.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-4">
        {statuses.map((column) => {
          const columnTasks = visibleTasks.filter((task) => task.status === column);
          return (
            <section key={column} className="rounded-xl border bg-muted/20 p-3" aria-labelledby={`column-${column}`}>
              <div className="mb-3 flex items-center justify-between">
                <h2 id={`column-${column}`} className="font-medium text-sm">
                  {column}
                </h2>
                <Badge variant="outline">{columnTasks.length}</Badge>
              </div>
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <Card key={task.id} className="gap-3 py-4 transition-shadow hover:shadow-sm">
                    <CardHeader className="gap-3 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${task.title}`}
                          onClick={() => openTask(task)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </div>
                      <button type="button" className="text-left" onClick={() => openTask(task)}>
                        <CardTitle className="text-base leading-snug hover:underline">{task.title}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{task.description}</CardDescription>
                      </button>
                    </CardHeader>
                    <CardContent className="space-y-3 px-4">
                      <div className="space-y-2 text-muted-foreground text-xs">
                        <p className="flex items-center gap-2">
                          <UserRound className="size-3.5" aria-hidden="true" />
                          {task.assignee}
                        </p>
                        <p className="flex items-center gap-2">
                          <CalendarDays className="size-3.5" aria-hidden="true" />
                          {task.dueDate || "No due date"}
                        </p>
                        <p className="flex items-center gap-2">
                          <CircleAlert className="size-3.5" aria-hidden="true" />
                          {task.relatedTo || "Internal"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t pt-3">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          disabled={task.status === statuses[0]}
                          aria-label={`Move ${task.title} backward`}
                          onClick={() => moveTask(task, -1)}
                        >
                          <ArrowLeft className="size-4" />
                        </Button>
                        {task.status === "Done" ? (
                          <Badge variant="default">
                            <Check data-icon="inline-start" />
                            Complete
                          </Badge>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => moveTask(task, 1)}>
                            Move forward
                            <ArrowRight data-icon="inline-end" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {columnTasks.length === 0 && (
                  <button
                    type="button"
                    className="w-full rounded-lg border border-dashed p-6 text-muted-foreground text-sm transition-colors hover:bg-muted/50"
                    onClick={openNewTask}
                  >
                    <Plus className="mx-auto mb-2 size-4" />
                    Add task
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form className="flex flex-col gap-5" onSubmit={saveTask}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit task" : "Add task"}</DialogTitle>
              <DialogDescription>Keep ownership, deadline, status, and related work clear.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="task-title">Title</FieldLabel>
                <Input id="task-title" name="title" defaultValue={editing?.title} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="task-description">Description</FieldLabel>
                <Textarea id="task-description" name="description" defaultValue={editing?.description} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {statuses.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Priority</FieldLabel>
                  <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {priorities.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Assignee</FieldLabel>
                  <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {assignees.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="task-due">Due date</FieldLabel>
                  <Input id="task-due" name="dueDate" type="date" defaultValue={editing?.dueDate} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="task-related">Related client, campaign, or project</FieldLabel>
                <Input
                  id="task-related"
                  name="relatedTo"
                  defaultValue={editing?.relatedTo}
                  placeholder="e.g. Aurora Retail"
                />
              </Field>
            </FieldGroup>
            <DialogFooter className="sm:justify-between">
              <div>
                {editing && (
                  <Button type="button" variant="ghost" onClick={() => removeTask(editing)}>
                    <Trash2 data-icon="inline-start" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">{editing ? "Save changes" : "Create task"}</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
