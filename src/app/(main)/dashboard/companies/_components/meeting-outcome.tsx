"use client";

import { type FormEvent, useState } from "react";

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

import { useCompanies } from "./companies-provider";
import type { Activity } from "./types";

export function MeetingOutcomeForm({ activity }: { activity: Activity }) {
  const { recordMeetingOutcome } = useCompanies();
  const [open, setOpen] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (
      recordMeetingOutcome(activity.id, {
        purpose: String(data.get("purpose")),
        decision: String(data.get("decision")),
        clientRequests: String(data.get("clientRequests")),
        budgetDiscussed: String(data.get("budgetDiscussed")),
        expectedCreators: Number(data.get("expectedCreators")),
        nextAction: String(data.get("nextAction")),
        owner: String(data.get("owner")),
        deadline: String(data.get("deadline")),
        nextMeeting: String(data.get("nextMeeting") ?? ""),
      })
    )
      setOpen(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          {activity.meetingOutcome ? "Meeting outcome" : "Complete with notes"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{activity.title}</DialogTitle>
          <DialogDescription>
            Record the decision and accountable next action. Saving completes the meeting and creates its follow-up
            task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FieldGroup>
            {[
              { key: "purpose", label: "Meeting purpose", type: "text", required: true },
              { key: "decision", label: "Decision / outcome", type: "text", required: true },
              { key: "clientRequests", label: "Client requests", type: "text", required: false },
              { key: "budgetDiscussed", label: "Budget discussed (include currency)", type: "text", required: false },
              { key: "expectedCreators", label: "Expected creators", type: "number", required: true },
              { key: "nextAction", label: "Next required action", type: "text", required: true },
              { key: "owner", label: "Action owner", type: "text", required: true },
              { key: "deadline", label: "Action deadline", type: "date", required: true },
              { key: "nextMeeting", label: "Next meeting (optional)", type: "date", required: false },
            ].map(({ key, label, type, required }) => (
              <Field key={key}>
                <FieldLabel htmlFor={`meeting-${key}`}>{label}</FieldLabel>
                <Input
                  id={`meeting-${key}`}
                  name={key}
                  type={type}
                  required={required}
                  min={type === "number" ? 0 : undefined}
                  defaultValue={
                    activity.meetingOutcome?.[key as keyof NonNullable<Activity["meetingOutcome"]>] ??
                    ({ owner: activity.owner, expectedCreators: 0 } as Record<string, string | number | undefined>)[
                      key
                    ] ??
                    ""
                  }
                />
              </Field>
            ))}
          </FieldGroup>
          <Button type="submit">Save outcome & follow-up</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
