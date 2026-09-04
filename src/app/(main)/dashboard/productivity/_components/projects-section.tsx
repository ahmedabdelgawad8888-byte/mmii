"use client";

import * as React from "react";

import { addDays, format } from "date-fns";
import { ClipboardCheck, Globe, Orbit, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const today = new Date();

interface ProjectItem {
  title: string;
  status: "In Progress" | "Planning" | "Completed";
  description: string;
  progress: number;
  due: string;
  icon: typeof Orbit;
}

const initialProjects: ProjectItem[] = [
  {
    title: "Q2 Roadmap",
    status: "In Progress",
    description: "Ship better, ship smarter.",
    progress: 68,
    due: `Due ${format(addDays(today, 9), "MMM d")}`,
    icon: Orbit,
  },
  {
    title: "Website Redesign",
    status: "Planning",
    description: "Clean, modern, and fast.",
    progress: 42,
    due: `Due ${format(addDays(today, 21), "MMM d")}`,
    icon: Globe,
  },
  {
    title: "Onboarding",
    status: "Planning",
    description: "Trim first-run steps.",
    progress: 31,
    due: `Due ${format(addDays(today, 18), "MMM d")}`,
    icon: ClipboardCheck,
  },
  {
    title: "Security Hardening",
    status: "Completed",
    description: "Passed SOC-2 audit.",
    progress: 100,
    due: "Completed",
    icon: Sparkles,
  },
];

export function ProjectsSection() {
  const [filter, setFilter] = React.useState<string>("all");
  const [projects, setProjects] = React.useState<ProjectItem[]>(initialProjects);

  const [isNewOpen, setIsNewOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [newStatus, setNewStatus] = React.useState<"In Progress" | "Planning" | "Completed">("In Progress");

  const filteredProjects = React.useMemo(() => {
    if (filter === "active") {
      return projects.filter((p) => p.status === "In Progress");
    }
    if (filter === "planning") {
      return projects.filter((p) => p.status === "Planning");
    }
    if (filter === "completed") {
      return projects.filter((p) => p.status === "Completed");
    }
    return projects;
  }, [projects, filter]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let initialProgress = 0;
    if (newStatus === "Completed") {
      initialProgress = 100;
    } else if (newStatus === "In Progress") {
      initialProgress = 15;
    }

    const newProj: ProjectItem = {
      title: newTitle.trim(),
      description: newDesc.trim() || "Project underway",
      status: newStatus,
      progress: initialProgress,
      due: `Due ${format(addDays(today, 14), "MMM d")}`,
      icon: Orbit,
    };

    setProjects((prev) => [newProj, ...prev]);
    setIsNewOpen(false);
    setNewTitle("");
    setNewDesc("");
    toast.success(`Project "${newProj.title}" created successfully`);
  };

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl tracking-tight">Projects</h2>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All ({projects.length})</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setIsNewOpen(true)}>
            <Plus data-icon="inline-start" />
            New
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.title} className="shadow-xs transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>
                <button
                  type="button"
                  className="flex items-center gap-2 hover:underline text-left cursor-pointer"
                  onClick={() =>
                    toast.info(`Project: ${project.title} (${project.status}) - ${project.progress}% completed`)
                  }
                >
                  <project.icon className="size-4 text-muted-foreground" />
                  <span>{project.title}</span>
                </button>
              </CardTitle>
              <CardAction>
                <Badge variant={getProjectBadgeVariant(project.status)}>{project.status}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                <div className="text-sm leading-none">{project.description}</div>
                <div className="flex items-center gap-3">
                  <Progress value={project.progress} className="h-2" />
                  <span className="shrink-0 text-sm">{project.progress}%</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="py-2.5">
              <span className="text-muted-foreground">{project.due}</span>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* New Project Dialog */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateProject}>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Define deliverables and assign team resources.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="proj-title">Project Title</Label>
                <Input
                  id="proj-title"
                  placeholder="e.g. Mobile Checkout V2"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="proj-desc">Summary</Label>
                <Input
                  id="proj-desc"
                  placeholder="Key goals or milestones"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Initial Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={(v) => setNewStatus(v as "In Progress" | "Planning" | "Completed")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function getProjectBadgeVariant(status: ProjectItem["status"]) {
  if (status === "Completed") return "default";
  if (status === "In Progress") return "secondary";
  return "outline";
}
