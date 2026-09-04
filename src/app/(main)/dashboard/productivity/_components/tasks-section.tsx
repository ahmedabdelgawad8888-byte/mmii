"use client";

import * as React from "react";

import { Calendar1, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Task = {
  id: string;
  title: string;
  tag: string;
  time: string;
  checked: boolean;
  period: "today" | "tomorrow" | "this-week";
};

const initialTasks: Task[] = [
  { id: "1", title: "Finalize Q2 roadmap", tag: "Work", time: "10:00 AM", checked: false, period: "today" },
  { id: "2", title: "Review design system updates", tag: "Design", time: "11:30 AM", checked: true, period: "today" },
  { id: "3", title: "Reply to important emails", tag: "Admin", time: "2:00 PM", checked: false, period: "today" },
  {
    id: "4",
    title: "Plan creator content for this week",
    tag: "Content",
    time: "4:30 PM",
    checked: false,
    period: "tomorrow",
  },
  {
    id: "5",
    title: "Prepare weekly team sync notes",
    tag: "Planning",
    time: "6:00 PM",
    checked: false,
    period: "this-week",
  },
];

export function TasksSection() {
  const [items, setItems] = React.useState<Task[]>(initialTasks);
  const [selectedPeriod, setSelectedPeriod] = React.useState<"today" | "tomorrow" | "this-week">("today");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newTag, setNewTag] = React.useState("Work");
  const [newTime, setNewTime] = React.useState("12:00 PM");

  const filteredTasks = items.filter((item) => item.period === selectedPeriod);

  const handleToggle = (taskId: string, checked: boolean) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id === taskId) {
          if (checked) {
            toast.success(`Task completed: "${item.title}"`);
          }
          return { ...item, checked };
        }
        return item;
      }),
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: String(Date.now()),
      title: newTitle.trim(),
      tag: newTag || "General",
      time: newTime || "Anytime",
      checked: false,
      period: selectedPeriod,
    };

    setItems((prev) => [newTask, ...prev]);
    toast.success(`Added task "${newTask.title}" for ${selectedPeriod}`);
    setNewTitle("");
    setDialogOpen(false);
  };

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl tracking-tight">Tasks</h2>
        <div className="flex items-center gap-2">
          <Select
            value={selectedPeriod}
            onValueChange={(val) => setSelectedPeriod(val as "today" | "tomorrow" | "this-week")}
          >
            <SelectTrigger className="w-30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)} className="cursor-pointer">
            <Plus data-icon="inline-start" />
            New Task
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
        {filteredTasks.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center p-4 text-center text-muted-foreground text-sm">
            No tasks scheduled for {selectedPeriod}. Click &quot;New Task&quot; to add one!
          </div>
        ) : (
          <div className="divide-y">
            {filteredTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 p-4 transition-colors hover:bg-muted/25">
                <Checkbox
                  checked={task.checked}
                  aria-label={task.title}
                  onCheckedChange={(checked) => handleToggle(task.id, checked === true)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
                      <span className={`truncate text-sm ${task.checked ? "text-muted-foreground line-through" : ""}`}>
                        {task.title}
                      </span>
                      <Badge variant="outline" className="px-3 py-1 font-normal">
                        {task.tag}
                      </Badge>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-muted-foreground text-sm">
                      <span>{task.time}</span>
                      <Calendar1 className="size-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddTask}>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>Create a task for {selectedPeriod}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  placeholder="e.g., Update customer retention funnel"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-tag">Category / Tag</Label>
                  <Input
                    id="task-tag"
                    placeholder="e.g., Work, Planning"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-time">Time</Label>
                  <Input
                    id="task-time"
                    placeholder="e.g., 2:30 PM"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newTitle.trim()}>
                Add Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
