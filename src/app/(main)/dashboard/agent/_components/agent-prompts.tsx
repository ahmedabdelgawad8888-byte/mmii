"use client";

import { type FormEvent, useState } from "react";

import { BookmarkPlus, CalendarClock, Play, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { type ScheduledBrief, useAgentSettings } from "./agent-settings";

export function AgentPromptLibrary({
  onPick,
  compact = false,
}: {
  onPick: (prompt: string) => void;
  compact?: boolean;
}) {
  const settings = useAgentSettings();
  const shown = compact ? settings.savedPrompts.slice(0, 6) : settings.savedPrompts;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((prompt) => (
        <Button key={prompt.id} variant="outline" size="sm" onClick={() => onPick(prompt.prompt)}>
          {prompt.title}
        </Button>
      ))}
      {!compact && <NewPromptDialog />}
    </div>
  );
}

export function AgentPromptManager({ onRun }: { onRun: (prompt: string) => void }) {
  const settings = useAgentSettings();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">Prompt library</p>
          <p className="text-muted-foreground text-xs">Reusable briefs, and the schedules that run them.</p>
        </div>
        <NewPromptDialog />
      </div>
      <div className="divide-y overflow-hidden rounded-lg border">
        {settings.savedPrompts.map((prompt) => {
          const schedule = settings.schedules.find((item) => item.promptId === prompt.id);
          return (
            <div key={prompt.id} className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-sm">{prompt.title}</p>
                <p className="line-clamp-2 text-muted-foreground text-xs">{prompt.prompt}</p>
                {schedule?.enabled && (
                  <p className="mt-1 text-primary text-xs">
                    Runs {schedule.cadence} at {String(schedule.hour).padStart(2, "0")}:00
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRun(prompt.prompt)}
                  aria-label={`Run ${prompt.title}`}
                >
                  <Play aria-hidden="true" />
                </Button>
                <ScheduleDialog promptId={prompt.id} title={prompt.title} existing={schedule} />
                {!prompt.builtIn && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => settings.removePrompt(prompt.id)}
                    aria-label={`Delete ${prompt.title}`}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewPromptDialog() {
  const settings = useAgentSettings();
  const [open, setOpen] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const prompt = String(form.get("prompt") ?? "").trim();
    if (!title || !prompt) return;
    settings.addPrompt(title, prompt);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookmarkPlus aria-hidden="true" /> Save a prompt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save a prompt</DialogTitle>
          <DialogDescription>Keep a brief you run often, then schedule it if it is recurring.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="prompt-title">Title</FieldLabel>
              <Input id="prompt-title" name="title" placeholder="Friday collections review" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="prompt-body">Prompt</FieldLabel>
              <Textarea id="prompt-body" name="prompt" rows={5} placeholder="What should the agent do?" required />
            </Field>
          </FieldGroup>
          <Button type="submit">Save prompt</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleDialog({ promptId, title, existing }: { promptId: string; title: string; existing?: ScheduledBrief }) {
  const settings = useAgentSettings();
  const [open, setOpen] = useState(false);
  const [cadence, setCadence] = useState<ScheduledBrief["cadence"]>(existing?.cadence ?? "daily");
  const [hour, setHour] = useState(String(existing?.hour ?? 8));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={existing?.enabled ? "default" : "ghost"} size="sm" aria-label={`Schedule ${title}`}>
          <CalendarClock aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule “{title}”</DialogTitle>
          <DialogDescription>
            Briefs run while this page is open, at most once per hour window. There is no server scheduler in this demo.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="schedule-cadence">Cadence</FieldLabel>
            <Select value={cadence} onValueChange={(value) => setCadence(value as ScheduledBrief["cadence"])}>
              <SelectTrigger id="schedule-cadence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="schedule-hour">Hour</FieldLabel>
            <Input
              id="schedule-hour"
              type="number"
              min="0"
              max="23"
              value={hour}
              onChange={(event) => setHour(event.target.value)}
            />
          </Field>
        </FieldGroup>
        <Button
          onClick={() => {
            settings.toggleSchedule(promptId, cadence, Number(hour) || 8);
            setOpen(false);
          }}
        >
          {existing?.enabled ? "Pause schedule" : "Enable schedule"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
