"use client";

import * as React from "react";

import { CheckSquare, FileText, Focus, Orbit, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

export function QuickActions() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogTitle, setDialogTitle] = React.useState("");
  const [dialogInput, setDialogInput] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleActionClick = (action: string) => {
    if (action === "Upload") {
      fileInputRef.current?.click();
      return;
    }
    setDialogTitle(action);
    setDialogInput("");
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`Uploaded "${file.name}"`, {
        description: `Size: ${(file.size / 1024).toFixed(1)} KB · Added to workspace`,
      });
    }
  };

  const handleDialogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogInput.trim()) return;

    toast.success(`Created ${dialogTitle}: "${dialogInput.trim()}"`, {
      description: "Successfully added to your workspace productivity tracker.",
    });
    setDialogOpen(false);
  };

  const quickActions = [
    { label: "New Note", icon: FileText },
    { label: "New Task", icon: CheckSquare },
    { label: "New Project", icon: Orbit },
    { label: "New Goal", icon: Focus },
    { label: "Upload", icon: Upload },
  ] as const;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl tracking-tight">Quick Actions</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="cursor-pointer justify-start transition-all hover:bg-muted"
            onClick={() => handleActionClick(action.label)}
          >
            <action.icon data-icon="inline-start" />
            {action.label}
          </Button>
        ))}
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleDialogSubmit}>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>Quickly add a new item to your productivity dashboard.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item-title">Title</Label>
                <Input
                  id="item-title"
                  placeholder={`Enter ${dialogTitle.toLowerCase()} title...`}
                  value={dialogInput}
                  onChange={(e) => setDialogInput(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!dialogInput.trim()}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
