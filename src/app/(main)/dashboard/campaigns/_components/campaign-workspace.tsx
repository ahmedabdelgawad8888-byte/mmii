"use client";

import { type FormEvent, useState } from "react";

import Link from "next/link";

import { AlertTriangle, HeartPulse, Plus, Users } from "lucide-react";

import { useCompanies } from "@/app/(main)/dashboard/companies/_components/companies-provider";
import { branchCurrencies } from "@/app/(main)/dashboard/companies/_components/data";
import type { InfluencerStage } from "@/app/(main)/dashboard/companies/_components/types";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const influencerStages: InfluencerStage[] = [
  "Target",
  "Prospected",
  "Contacted",
  "Interested",
  "Confirmation Requested",
  "Confirmed",
  "Submitted to Client",
  "Approved",
  "Rejected",
  "Replacement Required",
  "Scheduled",
  "Visited",
  "Posting Coverage Received",
  "Posting Coverage Verified",
  "Completed",
];

function HealthBadge({ value }: { value: string }) {
  let variant: "default" | "secondary" | "destructive" = "destructive";
  if (value === "Green") variant = "default";
  else if (value === "Amber") variant = "secondary";
  return <Badge variant={variant}>{value}</Badge>;
}

function CampaignDialog() {
  const { companies, createActivationCampaign, team } = useCompanies();
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const sales = team.filter((item) => item.role === "Sales");
  const [campaignOwner, setCampaignOwner] = useState(sales[0]?.name ?? "Unassigned");
  const [operationsOwner, setOperationsOwner] = useState(team[2]?.name ?? "Unassigned");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const company = companies.find((item) => item.id === companyId);
    if (!company) return;
    createActivationCampaign({
      name: String(data.get("name")),
      companyId,
      branch: company.branch,
      city: String(data.get("city")),
      campaignOwner,
      operationsOwner,
      backupOwner: String(data.get("backupOwner")),
      target: Number(data.get("target")),
      startDate: String(data.get("startDate")),
      endDate: String(data.get("endDate")),
      postingRequirement: String(data.get("postingRequirement")),
      brief: String(data.get("brief")),
      budget: Number(data.get("budget")),
      currency: branchCurrencies[company.branch],
      nextAction: "Start influencer planning",
      eta: String(data.get("startDate")),
    });
    setOpen(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Create campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create campaign</DialogTitle>
            <DialogDescription>
              Connect client ownership, operations ownership, targets, dates, budget, and delivery requirements.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="cpn-name">Campaign</FieldLabel>
                <Input id="cpn-name" name="name" required />
              </Field>
              <Field>
                <FieldLabel>Client</FieldLabel>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {companies.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="cpn-city">City</FieldLabel>
                <Input id="cpn-city" name="city" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="cpn-target">Required influencers</FieldLabel>
                <Input id="cpn-target" name="target" type="number" min="1" required />
              </Field>
              <Field>
                <FieldLabel>Campaign owner</FieldLabel>
                <Select value={campaignOwner} onValueChange={setCampaignOwner}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {sales.map((item) => (
                        <SelectItem key={item.id} value={item.name}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Operations owner</FieldLabel>
                <Select value={operationsOwner} onValueChange={setOperationsOwner}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {team
                        .filter((item) => item.active)
                        .map((item) => (
                          <SelectItem key={item.id} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="cpn-backup">Backup owner</FieldLabel>
                <Input id="cpn-backup" name="backupOwner" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="cpn-budget">Budget</FieldLabel>
                <Input id="cpn-budget" name="budget" type="number" min="0" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="cpn-start">Start date</FieldLabel>
                <Input id="cpn-start" name="startDate" type="date" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="cpn-end">End date</FieldLabel>
                <Input id="cpn-end" name="endDate" type="date" required />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="cpn-posting">Posting Coverage requirement</FieldLabel>
              <Input id="cpn-posting" name="postingRequirement" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="cpn-brief">Brief</FieldLabel>
              <Input id="cpn-brief" name="brief" required />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create and assign</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InfluencerDialog({ campaignId }: { campaignId: string }) {
  const { addInfluencer, team } = useCompanies();
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState(team[1]?.name ?? "Unassigned");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addInfluencer(campaignId, String(data.get("name")), String(data.get("handle")), owner);
    setOpen(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Add influencer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add influencer</DialogTitle>
            <DialogDescription>Add a creator target and assign relationship ownership.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="inf-name">Influencer</FieldLabel>
              <Input id="inf-name" name="name" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="inf-handle">Handle</FieldLabel>
              <Input id="inf-handle" name="handle" required />
            </Field>
            <Field>
              <FieldLabel>Owner</FieldLabel>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {team
                      .filter((item) => item.active)
                      .map((item) => (
                        <SelectItem key={item.id} value={item.name}>
                          {item.name}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Add to plan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CampaignWorkspace() {
  const { activationCampaigns, companies, influencers } = useCompanies();
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-medium text-muted-foreground text-sm">Campaign Operations</p>
          <h1 className="font-semibold text-2xl tracking-tight">Campaign Command Center</h1>
          <p className="text-muted-foreground text-sm">
            Targets, approvals, visits, Posting Coverage, health, and employee ownership in one workflow.
          </p>
        </div>
        <CampaignDialog />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Active campaigns</CardDescription>
            <CardTitle className="text-2xl">
              {activationCampaigns.filter((item) => item.status === "Active").length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Currently executing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>At risk</CardDescription>
            <CardTitle className="text-2xl">
              {activationCampaigns.filter((item) => ["Red", "Critical"].includes(item.health)).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Requires escalation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Required influencers</CardDescription>
            <CardTitle className="text-2xl">
              {activationCampaigns.reduce((sum, item) => sum + item.target, 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Across scoped campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Confirmed</CardDescription>
            <CardTitle className="text-2xl">
              {
                influencers.filter((item) =>
                  [
                    "Confirmed",
                    "Submitted to Client",
                    "Approved",
                    "Scheduled",
                    "Visited",
                    "Posting Coverage Received",
                    "Posting Coverage Verified",
                    "Completed",
                  ].includes(item.stage),
                ).length
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Progressed beyond confirmation</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Campaign portfolio</CardTitle>
          <CardDescription>Open a campaign to work its influencer and execution pipeline.</CardDescription>
        </CardHeader>
        <CardContent>
          {activationCampaigns.length ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Owners</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Next action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activationCampaigns.map((campaign) => {
                    const rows = influencers.filter((item) => item.campaignId === campaign.id);
                    const approved = rows.filter((item) =>
                      [
                        "Approved",
                        "Scheduled",
                        "Visited",
                        "Posting Coverage Received",
                        "Posting Coverage Verified",
                        "Completed",
                      ].includes(item.stage),
                    ).length;
                    const progress = Math.round((approved / Math.max(1, campaign.target)) * 100);
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <Link className="font-medium hover:underline" href={`/dashboard/campaigns/${campaign.id}`}>
                            {campaign.name}
                          </Link>
                          <p className="text-muted-foreground text-xs">
                            {campaign.branch} · {campaign.city}
                          </p>
                        </TableCell>
                        <TableCell>{companies.find((item) => item.id === campaign.companyId)?.name}</TableCell>
                        <TableCell>
                          <p>{campaign.campaignOwner}</p>
                          <p className="text-muted-foreground text-xs">Ops: {campaign.operationsOwner}</p>
                        </TableCell>
                        <TableCell>{campaign.target}</TableCell>
                        <TableCell>
                          <div className="flex min-w-32 flex-col gap-1">
                            <Progress value={progress} />
                            <span className="text-muted-foreground text-xs">
                              {approved} approved · {Math.max(0, campaign.target - approved)} remaining
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <HealthBadge value={campaign.health} />
                        </TableCell>
                        <TableCell>{campaign.nextAction}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HeartPulse />
                </EmptyMedia>
                <EmptyTitle>No campaigns</EmptyTitle>
                <EmptyDescription>Create the first connected campaign.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <CampaignDialog />
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function CampaignDetail({ campaignId }: { campaignId: string }) {
  const { activationCampaigns, advanceInfluencer, companies, influencers } = useCompanies();
  const campaign = activationCampaigns.find((item) => item.id === campaignId);
  if (!campaign)
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Campaign not found</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  const rows = influencers.filter((item) => item.campaignId === campaign.id);
  const approved = rows.filter((item) =>
    [
      "Approved",
      "Scheduled",
      "Visited",
      "Posting Coverage Received",
      "Posting Coverage Verified",
      "Completed",
    ].includes(item.stage),
  ).length;
  const confirmed = rows.filter((item) =>
    [
      "Confirmed",
      "Submitted to Client",
      "Approved",
      "Scheduled",
      "Visited",
      "Posting Coverage Received",
      "Posting Coverage Verified",
      "Completed",
    ].includes(item.stage),
  ).length;
  const coverageMissing = rows.filter((item) => item.stage === "Visited").length;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Button variant="link" className="h-auto p-0" asChild>
            <Link href="/dashboard/campaigns">Campaign Command Center</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-semibold text-2xl tracking-tight">{campaign.name}</h1>
            <HealthBadge value={campaign.health} />
            <Badge variant="outline">{campaign.status}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {companies.find((item) => item.id === campaign.companyId)?.name} · {campaign.branch} · {campaign.city}
          </p>
        </div>
        <InfluencerDialog campaignId={campaign.id} />
      </div>
      {campaign.health !== "Green" && (
        <Card>
          <CardHeader className="flex flex-row items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-muted-foreground" />
            <div>
              <CardTitle>{campaign.rootCause}</CardTitle>
              <CardDescription>Impact: {campaign.impact}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-xs">Owner</p>
              <p className="font-medium text-sm">{campaign.operationsOwner}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Required action</p>
              <p className="font-medium text-sm">{campaign.nextAction}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">ETA</p>
              <p className="font-medium text-sm">{campaign.eta}</p>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Target</CardDescription>
            <CardTitle className="text-2xl">{campaign.target}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Required influencers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Confirmed</CardDescription>
            <CardTitle className="text-2xl">{confirmed}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Relationship confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Client approved</CardDescription>
            <CardTitle className="text-2xl">{approved}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">{Math.max(0, campaign.target - approved)} remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Missing Posting Coverage</CardDescription>
            <CardTitle className="text-2xl">{coverageMissing}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Visited without received coverage</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="influencers">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="influencers">
          <Card>
            <CardHeader>
              <CardTitle>Influencer workflow</CardTitle>
              <CardDescription>
                Move each creator through confirmation, client approval, visit, and verified Posting Coverage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rows.length ? (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Influencer</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Current stage</TableHead>
                        <TableHead>Move to</TableHead>
                        <TableHead>Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((influencer) => (
                        <TableRow key={influencer.id}>
                          <TableCell>
                            <p className="font-medium">{influencer.name}</p>
                            <p className="text-muted-foreground text-xs">{influencer.handle}</p>
                          </TableCell>
                          <TableCell>{influencer.owner}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{influencer.stage}</Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={influencer.stage}
                              onValueChange={(value) => advanceInfluencer(influencer.id, value as InfluencerStage)}
                            >
                              <SelectTrigger className="w-56">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {influencerStages.map((stage) => (
                                    <SelectItem key={stage} value={stage}>
                                      {stage}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{new Date(influencer.updatedAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Users />
                    </EmptyMedia>
                    <EmptyTitle>No influencers</EmptyTitle>
                    <EmptyDescription>Add creators to begin campaign planning.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <InfluencerDialog campaignId={campaign.id} />
                  </EmptyContent>
                </Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Campaign requirements</CardTitle>
              <CardDescription>Commercial and delivery scope.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-xs">Campaign owner</p>
                <p className="font-medium">{campaign.campaignOwner}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Operations owner</p>
                <p className="font-medium">{campaign.operationsOwner}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Budget</p>
                <p className="font-medium">
                  {campaign.currency} {campaign.budget.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Dates</p>
                <p className="font-medium">
                  {campaign.startDate} → {campaign.endDate}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground text-xs">Posting Coverage</p>
                <p className="font-medium">{campaign.postingRequirement}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground text-xs">Brief</p>
                <p className="font-medium">{campaign.brief}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Immutable activity timeline</CardTitle>
              <CardDescription>Actor, timestamp, previous stage, and new stage.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {rows
                .flatMap((item) => item.history.map((history) => ({ ...history, influencer: item.name })))
                .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                .map((history) => (
                  <div key={history.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                    <div>
                      <p className="font-medium text-sm">
                        {history.influencer} → {history.stage}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Previous: {history.previousValue} · Actor: {history.actor}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {new Date(history.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
