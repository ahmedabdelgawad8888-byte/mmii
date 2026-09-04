"use client";

import * as React from "react";

import { BookOpenCheck, Megaphone, Plus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function AcademyToolbar() {
  const [announcementOpen, setAnnouncementOpen] = React.useState(false);
  const [assignmentOpen, setAssignmentOpen] = React.useState(false);
  const [announcementTitle, setAnnouncementTitle] = React.useState("");
  const [announcementClass, setAnnouncementClass] = React.useState("all");
  const [announcementText, setAnnouncementText] = React.useState("");

  const [assignmentTitle, setAssignmentTitle] = React.useState("");
  const [assignmentClass, setAssignmentClass] = React.useState("G11A");
  const [assignmentPoints, setAssignmentPoints] = React.useState("100");

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim()) return;
    toast.success(`Announcement posted: "${announcementTitle.trim()}"`, {
      description: `Sent to ${announcementClass === "all" ? "All Grades" : announcementClass}`,
    });
    setAnnouncementTitle("");
    setAnnouncementText("");
    setAnnouncementOpen(false);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTitle.trim()) return;
    toast.success(`Assignment created: "${assignmentTitle.trim()}"`, {
      description: `Assigned to ${assignmentClass} · ${assignmentPoints} points`,
    });
    setAssignmentTitle("");
    setAssignmentOpen(false);
  };

  const handleOpenGradebook = () => {
    toast.info("Opened Master Gradebook", {
      description: "Displaying Q2 grades for Grades 11A–11E across all subjects.",
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 lg:w-fit">
        <Button size="sm" onClick={() => setAnnouncementOpen(true)} className="cursor-pointer">
          <Megaphone data-icon="inline-start" />
          New Announcement
        </Button>
        <Button size="sm" variant="outline" onClick={handleOpenGradebook} className="cursor-pointer">
          <BookOpenCheck data-icon="inline-start" />
          Gradebook
        </Button>
        <Button size="sm" variant="outline" onClick={() => setAssignmentOpen(true)} className="cursor-pointer">
          <Plus data-icon="inline-start" />
          Add Assignment
        </Button>
      </div>

      {/* New Announcement Dialog */}
      <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handlePostAnnouncement}>
            <DialogHeader>
              <DialogTitle>Post New Announcement</DialogTitle>
              <DialogDescription>Broadcast an update to students and guardians.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ann-title">Headline</Label>
                <Input
                  id="ann-title"
                  placeholder="e.g. Science Fair Submission Deadline"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ann-class">Audience</Label>
                <Select value={announcementClass} onValueChange={setAnnouncementClass}>
                  <SelectTrigger id="ann-class">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes & Faculty</SelectItem>
                    <SelectItem value="G11A">Grade 11A</SelectItem>
                    <SelectItem value="G11B">Grade 11B</SelectItem>
                    <SelectItem value="G11C">Grade 11C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ann-body">Message</Label>
                <Textarea
                  id="ann-body"
                  placeholder="Write announcement details..."
                  rows={3}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAnnouncementOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!announcementTitle.trim()}>
                Post Announcement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Assignment Dialog */}
      <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateAssignment}>
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
              <DialogDescription>Assign homework, project milestones, or lab reports.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="assign-title">Assignment Title</Label>
                <Input
                  id="assign-title"
                  placeholder="e.g. Calculus Problem Set #4"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assign-class">Class</Label>
                  <Select value={assignmentClass} onValueChange={setAssignmentClass}>
                    <SelectTrigger id="assign-class">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="G11A">Grade 11A (Pure Math)</SelectItem>
                      <SelectItem value="G11B">Grade 11B (Literature)</SelectItem>
                      <SelectItem value="G11C">Grade 11C (Physics)</SelectItem>
                      <SelectItem value="G11D">Grade 11D (History)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assign-points">Max Points</Label>
                  <Input
                    id="assign-points"
                    type="number"
                    value={assignmentPoints}
                    onChange={(e) => setAssignmentPoints(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignmentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!assignmentTitle.trim()}>
                Publish Assignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
