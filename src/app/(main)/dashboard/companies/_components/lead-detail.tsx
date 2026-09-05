"use client";

import { type FormEvent, useState } from "react";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { useCompanies } from "./companies-provider";

export function LeadDetail({ leadId }: { leadId: string }) {
  const { leads, updateLeadProfile, qualifyLead, convertLead } = useCompanies();
  const lead = leads.find((item) => item.id === leadId);
  const [budgetConfirmed, setBudgetConfirmed] = useState(lead?.budgetConfirmed ?? false);
  const [meetingHeld, setMeetingHeld] = useState(lead?.meetingHeld ?? false);
  if (!lead)
    return (
      <p>
        Lead not found in this scope. <Link href="/dashboard/companies/leads">Return to leads</Link>
      </p>
    );
  const score =
    (lead.budgetConfirmed ? 25 : 0) +
    (lead.meetingHeld ? 25 : 0) +
    ((lead.expectedCreators ?? 0) > 0 ? 25 : 0) +
    ((lead.opportunityValue ?? 0) > 0 ? 25 : 0);
  let next = "Confirm fit, budget, and the next conversation";
  if (lead.status === "Qualified") next = "Convert to company and create a quotation";
  if (lead.status === "Converted") next = "Continue in the company workspace";
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    updateLeadProfile(leadId, {
      budgetConfirmed,
      meetingHeld,
      expectedCreators: Number(data.get("creators")),
      opportunityValue: Number(data.get("value")),
      notes: String(data.get("notes")),
      nextActivityAt: String(data.get("nextDate")) || null,
    });
  }
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href="/dashboard/companies/leads" className="text-muted-foreground text-sm">
          Sales / Leads
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-semibold text-3xl tracking-tight">{lead.leadName}</h1>
          <Badge variant="outline">{lead.status}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {lead.companyName} · {lead.branch} · {lead.owner} · {lead.source}
        </p>
      </header>
      <section className="flex flex-wrap items-center justify-between gap-4 border-y py-5">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest">Next required action</p>
          <p className="mt-2 font-medium">{next}</p>
        </div>
        {!["Qualified", "Converted", "Junk"].includes(lead.status) && (
          <Button onClick={() => qualifyLead(leadId)}>Qualify lead</Button>
        )}
        {lead.status === "Qualified" && <Button onClick={() => convertLead(leadId, true)}>Convert + quotation</Button>}
        {lead.convertedCompanyId && (
          <Button asChild>
            <Link href={`/dashboard/companies/${lead.convertedCompanyId}`}>Open company</Link>
          </Button>
        )}
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact & qualification</CardTitle>
            <CardDescription>Signals captured by the sales owner.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="break-all text-sm">
              {lead.email || "No email"}
              <br />
              {lead.phone || "No phone"}
            </p>
            <div>
              <p className="text-muted-foreground text-xs">Qualification completeness</p>
              <p className="mt-2 font-semibold text-4xl">
                {score}
                <span className="text-muted-foreground text-sm"> / 100</span>
              </p>
            </div>
            <p className="text-muted-foreground text-xs">
              25 points each for a held meeting, confirmed budget, defined creator demand, and recorded opportunity
              value. This is a transparent demo score, not a predicted win probability.
            </p>
            <p className="text-muted-foreground text-xs">
              Created {new Date(lead.createdAt).toLocaleDateString()} · Last activity{" "}
              {lead.lastActivityAt ? new Date(lead.lastActivityAt).toLocaleDateString() : "not recorded"}
            </p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Discovery & follow-up</CardTitle>
            <CardDescription>Save the latest conversation and the next date to keep the lead active.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-5">
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="lead-budget-confirmed">Budget confirmed</FieldLabel>
                  <Switch id="lead-budget-confirmed" checked={budgetConfirmed} onCheckedChange={setBudgetConfirmed} />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="lead-meeting-held">Meeting held</FieldLabel>
                  <Switch id="lead-meeting-held" checked={meetingHeld} onCheckedChange={setMeetingHeld} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lead-creators">Expected creators</FieldLabel>
                  <Input
                    id="lead-creators"
                    name="creators"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={lead.expectedCreators ?? 0}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lead-value">Opportunity value (market currency)</FieldLabel>
                  <Input
                    id="lead-value"
                    name="value"
                    type="number"
                    min="0"
                    step="0.001"
                    defaultValue={lead.opportunityValue ?? 0}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lead-next-date">Next activity date</FieldLabel>
                  <Input
                    id="lead-next-date"
                    name="nextDate"
                    type="date"
                    defaultValue={lead.nextActivityAt?.slice(0, 10) ?? ""}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lead-notes">Latest conversation notes</FieldLabel>
                  <Input id="lead-notes" name="notes" defaultValue={lead.notes} required />
                </Field>
              </FieldGroup>
              <Button type="submit">Save discovery notes</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lead timeline</CardTitle>
          <CardDescription>Qualification and follow-up updates.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {(lead.history ?? []).map((entry) => (
            <div key={entry.id} className="py-3">
              <p className="font-medium">{entry.title}</p>
              <p className="text-muted-foreground text-sm">{entry.detail}</p>
              <p className="mt-1 text-muted-foreground text-xs">{new Date(entry.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
