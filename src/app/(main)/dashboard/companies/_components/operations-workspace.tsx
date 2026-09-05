"use client";

import { type FormEvent, type ReactNode, useState } from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckSquare,
  CircleDollarSign,
  Clock3,
  FileText,
  type Gauge,
  PhoneCall,
  Plus,
  Target,
  UserPlus,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useCompanies } from "./companies-provider";
import { MeetingOutcomeForm } from "./meeting-outcome";
import { RegisterTools } from "./register-tools";
import type { Branch, Currency, LeadSource, WorkspaceRules } from "./types";

export type OperationsView =
  | "overview"
  | "leads"
  | "deals"
  | "activities"
  | "meetings"
  | "tasks"
  | "reports"
  | "settings";

const branches: Branch[] = ["Saudi Arabia", "Egypt", "UAE", "Kuwait", "Qatar", "Bahrain"];
const sources: LeadSource[] = ["Website", "Referral", "Cold Call", "Instagram", "LinkedIn", "Event", "Partner"];

function StatusBadge({ value }: { value: string }) {
  const positive = ["Active", "Qualified", "Converted", "Client Approved", "Completed", "Paid"].includes(value);
  const attention = [
    "New",
    "Working",
    "In Progress",
    "Open",
    "Upcoming",
    "Management Review",
    "Financial Review",
  ].includes(value);
  let variant: "default" | "secondary" | "outline" = "outline";
  if (positive) variant = "default";
  else if (attention) variant = "secondary";
  return <Badge variant={variant}>{value}</Badge>;
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Gauge;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs">{detail}</p>
      </CardContent>
    </Card>
  );
}

function Header({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  const { rules, team } = useCompanies();
  const currentUser = team.find((item) => item.id === rules.currentUserId) ?? team[0];
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-1">
        <p className="font-medium text-muted-foreground text-sm">TryGC · Revenue operations</p>
        <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
        <p className="max-w-2xl text-muted-foreground text-sm">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {currentUser && (
          <Badge variant="outline">
            Working as {currentUser.name} · {currentUser.role}
          </Badge>
        )}
        {action}
      </div>
    </div>
  );
}

function LeadDialog() {
  const { addLead, team } = useCompanies();
  const sales = team.filter((item) => item.role === "Sales" && item.active);
  const [open, setOpen] = useState(false);
  const [branch, setBranch] = useState<Branch>("Saudi Arabia");
  const [owner, setOwner] = useState(sales[0]?.name ?? "Unassigned");
  const [source, setSource] = useState<LeadSource>("Website");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = addLead({
      firstName: String(data.get("firstName")),
      lastName: String(data.get("lastName")),
      companyName: String(data.get("companyName")),
      phone: String(data.get("phone")),
      email: String(data.get("email")),
      branch,
      owner,
      source,
    });
    if (id) setOpen(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          New lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New lead</DialogTitle>
            <DialogDescription>Capture and assign the lead so the sales owner has a clear next step.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="lead-first">First name</FieldLabel>
                <Input id="lead-first" name="firstName" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="lead-last">Last name</FieldLabel>
                <Input id="lead-last" name="lastName" required />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="lead-company">Company</FieldLabel>
              <Input id="lead-company" name="companyName" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="lead-phone">Phone</FieldLabel>
                <Input id="lead-phone" name="phone" />
              </Field>
              <Field>
                <FieldLabel htmlFor="lead-email">Email</FieldLabel>
                <Input id="lead-email" name="email" type="email" />
              </Field>
              <Field>
                <FieldLabel>Branch</FieldLabel>
                <Select value={branch} onValueChange={(value) => setBranch(value as Branch)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {branches.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Owner</FieldLabel>
                <Select value={owner} onValueChange={setOwner}>
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
                <FieldLabel>Source</FieldLabel>
                <Select value={source} onValueChange={(value) => setSource(value as LeadSource)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {sources.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create lead</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileText />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

function Overview() {
  const { activities, brands, campaigns, companies, leads } = useCompanies();
  const openCampaigns = campaigns.filter(
    (item) => !["Client Approved", "Client Not Approved", "Client Cancelled"].includes(item.stage),
  );
  const pending = campaigns.filter((item) => item.stage === "Management Review" || item.stage === "Financial Review");
  const won = campaigns.filter((item) => item.stage === "Client Approved");
  const openActivities = activities.filter((item) => item.status === "Open");
  const stages = [
    "Proposal / Price Quote",
    "Management Review",
    "Financial Review",
    "Released",
    "Sent To Client",
    "Client Approved",
  ] as const;
  return (
    <>
      <Header
        title="Operations overview"
        description="The live working view for sales, management, finance, and execution—not a process presentation."
        action={
          <Button asChild>
            <Link href="/dashboard/companies/quotations">
              Open quotations
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={UserPlus}
          label="Leads"
          value={leads.length}
          detail={`${leads.filter((item) => item.status === "Qualified").length} qualified`}
        />
        <Metric
          icon={Building2}
          label="Companies"
          value={companies.length}
          detail={`${brands.length} connected brands`}
        />
        <Metric
          icon={FileText}
          label="Open quotations"
          value={openCampaigns.length}
          detail={`${pending.length} waiting for approval`}
        />
        <Metric
          icon={BriefcaseBusiness}
          label="Won deals"
          value={won.length}
          detail={`${openActivities.length} open employee activities`}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Sales pipeline</CardTitle>
            <CardDescription>Each stage opens the records employees must work on next.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stages.map((stage) => {
              const rows = campaigns.filter((item) => item.stage === stage);
              const value = rows.reduce((sum, item) => sum + item.budget, 0);
              return (
                <Button key={stage} variant="outline" className="h-auto items-start justify-between p-4" asChild>
                  <Link href="/dashboard/companies/quotations">
                    <span className="flex flex-col items-start gap-1">
                      <span className="font-medium text-sm">{stage}</span>
                      <span className="text-muted-foreground text-xs">
                        {rows.length} records · {value.toLocaleString()}
                      </span>
                    </span>
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>Work currently blocking progress.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pending.length === 0 && openActivities.length === 0 ? (
              <p className="text-muted-foreground text-sm">No blocked items.</p>
            ) : (
              <>
                {pending.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href="/dashboard/companies/approvals"
                    className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <AlertTriangle className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.stage} · {item.owner}
                      </p>
                    </div>
                  </Link>
                ))}
                {openActivities.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href="/dashboard/companies/activities"
                    className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <Clock3 className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-muted-foreground text-xs">{item.type} · Open</p>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Leads() {
  const { convertLead, junkLead, leads, qualifyLead } = useCompanies();
  const [search, setSearch] = useState("");
  const filtered = leads.filter((lead) =>
    `${lead.leadName} ${lead.companyName} ${lead.email} ${lead.phone} ${lead.owner} ${lead.status} ${lead.branch}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <Header
        title="Leads"
        description="Qualify real opportunities, remove noise, and convert winners into connected company and quotation records."
        action={<LeadDialog />}
      />
      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <Metric icon={UserPlus} label="Total" value={leads.length} detail="All captured leads" />
        <Metric
          icon={Target}
          label="Qualified"
          value={leads.filter((item) => item.status === "Qualified").length}
          detail="Ready to convert"
        />
        <Metric
          icon={Clock3}
          label="Working"
          value={leads.filter((item) => item.status === "Working").length}
          detail="In active follow-up"
        />
        <Metric
          icon={Building2}
          label="Converted"
          value={leads.filter((item) => item.status === "Converted").length}
          detail="Company records created"
        />
        <Metric
          icon={AlertTriangle}
          label="Junk"
          value={leads.filter((item) => item.status === "Junk").length}
          detail="Removed from pipeline"
        />
        <Metric
          icon={Users}
          label="Owners"
          value={new Set(leads.map((item) => item.owner)).size}
          detail="Assigned sales employees"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lead workspace</CardTitle>
          <CardDescription>Every lead has an owner and explicit outcome.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterTools
            name="leads"
            search={search}
            onSearch={setSearch}
            rows={filtered.map((lead) => ({
              Name: lead.leadName,
              Company: lead.companyName,
              Email: lead.email,
              Phone: lead.phone,
              Market: lead.branch,
              Owner: lead.owner,
              Status: lead.status,
              Source: lead.source,
            }))}
          />
          {leads.length === 0 ? (
            <EmptyState
              title="No leads yet"
              description="Add the first lead and assign it to a sales owner."
              action={<LeadDialog />}
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Link className="font-medium hover:underline" href={`/dashboard/companies/leads/${lead.id}`}>
                            {lead.leadName}
                          </Link>
                          <span className="text-muted-foreground text-xs">{lead.email || lead.phone || lead.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>{lead.companyName}</TableCell>
                      <TableCell>{lead.owner}</TableCell>
                      <TableCell>{lead.branch}</TableCell>
                      <TableCell>{lead.source}</TableCell>
                      <TableCell>
                        <StatusBadge value={lead.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {!["Qualified", "Converted", "Junk"].includes(lead.status) && (
                            <Button size="sm" variant="outline" onClick={() => qualifyLead(lead.id)}>
                              Qualify
                            </Button>
                          )}
                          {lead.status === "Qualified" && (
                            <Button size="sm" onClick={() => convertLead(lead.id, true)}>
                              Convert + quotation
                            </Button>
                          )}
                          {lead.status !== "Converted" && lead.status !== "Junk" && (
                            <Button size="sm" variant="ghost" onClick={() => junkLead(lead.id)}>
                              Junk
                            </Button>
                          )}
                          {lead.convertedCompanyId && (
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/dashboard/companies/${lead.convertedCompanyId}`}>Open company</Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Deals() {
  const { campaigns, companies, fxToSar, rules } = useCompanies();
  const rows = campaigns.filter((item) =>
    ["Client Approved", "Client Not Approved", "Client Cancelled"].includes(item.stage),
  );
  const won = rows.filter((item) => item.stage === "Client Approved");
  return (
    <>
      <Header title="Deals" description="Final client decisions and their resulting revenue outcome." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={Check} label="Won" value={won.length} detail="Client approved" />
        <Metric
          icon={CircleDollarSign}
          label="Won value"
          value={`${rules.baseCurrency} ${won.reduce((sum, item) => sum + (item.budget * (item.fxSnapshot?.rate ?? fxToSar[item.currency])) / fxToSar[rules.baseCurrency], 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          detail="Converted to reporting currency"
        />
        <Metric
          icon={Target}
          label="Win rate"
          value={`${Math.round((won.length / Math.max(1, rows.filter((item) => item.stage !== "Client Cancelled").length)) * 100)}%`}
          detail="Won ÷ won and lost; cancellations excluded"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Deal register</CardTitle>
          <CardDescription>Closed outcomes generated from quotation decisions.</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{companies.find((company) => company.id === item.companyId)?.name}</TableCell>
                      <TableCell>{item.owner}</TableCell>
                      <TableCell>
                        {item.currency} {item.budget.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={item.stage} />
                      </TableCell>
                      <TableCell>{item.invoiceId ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title="No closed deals"
              description="Client-approved, declined, and cancelled quotations will appear here."
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ActivityRegister({ view }: { view: "activities" | "meetings" | "tasks" }) {
  const { activities, companies, completeActivity } = useCompanies();
  const [search, setSearch] = useState("");
  const rows = activities
    .filter((item) => `${item.title} ${item.owner ?? ""} ${item.status}`.toLowerCase().includes(search.toLowerCase()))
    .filter((item) => view === "activities" || (view === "meetings" ? item.type === "Meeting" : item.type === "Task"));
  let title = "Activities";
  let Icon = PhoneCall;
  if (view === "meetings") {
    title = "Meetings";
    Icon = CalendarDays;
  } else if (view === "tasks") {
    title = "Tasks";
    Icon = CheckSquare;
  }
  return (
    <>
      <Header
        title={title}
        description={
          view === "activities"
            ? "One register for every meeting, call, task, and note across company work."
            : `Employee ${title.toLowerCase()} connected to their company records.`
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={Icon} label={title} value={rows.length} detail="In this demo workspace" />
        <Metric
          icon={Clock3}
          label="Open"
          value={rows.filter((item) => item.status === "Open").length}
          detail="Requires employee action"
        />
        <Metric
          icon={Check}
          label="Completed"
          value={rows.filter((item) => item.status === "Completed").length}
          detail="Finished work"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{title} register</CardTitle>
          <CardDescription>Ownership stays visible through the related company.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterTools
            name={view}
            search={search}
            onSearch={setSearch}
            rows={rows.map((item) => ({
              Title: item.title,
              Type: item.type,
              Owner: item.owner ?? "",
              Due: item.dueDate ?? "",
              Status: item.status,
            }))}
          />
          {rows.length ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Owner / due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((item) => {
                    const company = companies.find((entry) => entry.id === item.companyId);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          {company ? (
                            <Link className="hover:underline" href={`/dashboard/companies/${company.id}`}>
                              {company.name}
                            </Link>
                          ) : (
                            "Unknown"
                          )}
                        </TableCell>
                        <TableCell>
                          {item.owner ?? company?.owner ?? "Unassigned"}
                          <p className="text-muted-foreground text-xs">
                            {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "No deadline"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={item.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {item.type === "Meeting" && <MeetingOutcomeForm activity={item} />}
                          {item.status === "Open" && item.type !== "Meeting" && (
                            <Button size="sm" variant="outline" onClick={() => completeActivity(item.id)}>
                              Complete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title={`No ${title.toLowerCase()}`}
              description="Create work from a company record so the relationship stays connected."
              action={
                <Button asChild>
                  <Link href="/dashboard/companies">Open companies</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Reports() {
  const { campaigns, companies, fxToSar, team } = useCompanies();
  const branchRows = branches.map((branch) => {
    const branchCompanies = companies.filter((item) => item.branch === branch);
    const branchCampaigns = campaigns.filter((item) => item.branch === branch);
    return {
      branch,
      companies: branchCompanies.length,
      quotations: branchCampaigns.length,
      approvals: branchCampaigns.filter((item) => item.stage.includes("Review")).length,
      won: branchCampaigns.filter((item) => item.stage === "Client Approved").length,
      value: branchCampaigns.reduce(
        (sum, item) => sum + item.budget * (item.fxSnapshot?.rate ?? fxToSar[item.currency]),
        0,
      ),
    };
  });
  const consolidated = campaigns.reduce(
    (sum, item) => sum + item.budget * (item.fxSnapshot?.rate ?? fxToSar[item.currency]),
    0,
  );
  return (
    <>
      <Header
        title="Reports"
        description="Operational reporting derived from the same records employees update throughout the workflow."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={Building2} label="Branches" value={branches.length} detail="Shared operating model" />
        <Metric
          icon={Users}
          label="Active employees"
          value={team.filter((item) => item.active).length}
          detail="Across sales and approvals"
        />
        <Metric
          icon={CircleDollarSign}
          label="Consolidated value"
          value={`SAR ${Math.round(consolidated).toLocaleString()}`}
          detail="Converted from local branch currencies"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Branch performance</CardTitle>
          <CardDescription>
            Companies, quotations, approval load, wins, and SAR-equivalent value by branch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Companies</TableHead>
                  <TableHead>Quotations</TableHead>
                  <TableHead>Waiting approval</TableHead>
                  <TableHead>Won</TableHead>
                  <TableHead className="text-right">SAR equivalent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchRows.map((row) => (
                  <TableRow key={row.branch}>
                    <TableCell className="font-medium">{row.branch}</TableCell>
                    <TableCell>{row.companies}</TableCell>
                    <TableCell>{row.quotations}</TableCell>
                    <TableCell>{row.approvals}</TableCell>
                    <TableCell>{row.won}</TableCell>
                    <TableCell className="text-right">SAR {Math.round(row.value).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function SettingsView() {
  const { fxToSar, rules, setCurrentUser, team, updateFx, updateRules } = useCompanies();
  const ruleRows = [
    {
      key: "requireManagementApproval" as const,
      label: "Management approval",
      description: "Sales quotations require management review before finance.",
    },
    {
      key: "requireFinanceApproval" as const,
      label: "Financial approval",
      description: "Finance must approve before a quotation is released.",
    },
    {
      key: "autoInvoiceOnClientApproval" as const,
      label: "Automatic invoice",
      description: "Generate an invoice record when the client approves.",
    },
    {
      key: "enforceRoleAccess" as const,
      label: "Role-based approvals",
      description: "Only Management, Finance, or Admin can take their approval action.",
    },
  ];
  const currencies: Currency[] = ["SAR", "AED", "KWD", "EGP", "QAR", "BHD"];
  return (
    <>
      <Header
        title="Settings"
        description="Assign the active employee and control how work moves between Sales, Management, and Finance."
      />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active employee</CardTitle>
            <CardDescription>
              Switch the current workspace identity to verify ownership and approval permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Working as</FieldLabel>
                <Select value={rules.currentUserId} onValueChange={setCurrentUser}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {team
                        .filter((item) => item.active)
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} · {item.role}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <div className="flex flex-col gap-2">
              {team.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar>
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{member.name}</p>
                    <p className="truncate text-muted-foreground text-xs">
                      {member.email} · {member.branch}
                    </p>
                  </div>
                  <Badge variant={member.role === "Admin" ? "default" : "outline"}>{member.role}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Workflow rules</CardTitle>
            <CardDescription>These rules change the actual quotation handoff behavior.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {ruleRows.map((row) => (
              <Field key={row.key} orientation="horizontal">
                <div className="flex flex-1 flex-col gap-1">
                  <FieldLabel htmlFor={row.key}>{row.label}</FieldLabel>
                  <p className="text-muted-foreground text-xs">{row.description}</p>
                </div>
                <Switch
                  id={row.key}
                  checked={rules[row.key]}
                  onCheckedChange={(checked) => updateRules({ [row.key]: checked } as Partial<WorkspaceRules>)}
                />
              </Field>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>SAR consolidation rates</CardTitle>
            <CardDescription>
              Value of one local currency unit in SAR. New submissions capture these rates. Existing quotation snapshots
              stay unchanged.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {currencies.map((currency) => (
                <Field key={currency}>
                  <FieldLabel htmlFor={`fx-${currency}`}>{currency} to SAR</FieldLabel>
                  <Input
                    id={`fx-${currency}`}
                    type="number"
                    min="0"
                    step="0.001"
                    defaultValue={fxToSar[currency]}
                    disabled={currency === "SAR"}
                    onBlur={(event) => updateFx(currency, Number(event.target.value) || fxToSar[currency])}
                  />
                </Field>
              ))}
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function OperationsWorkspace({ view }: { view: OperationsView }) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {view === "overview" && <Overview />}
      {view === "leads" && <Leads />}
      {view === "deals" && <Deals />}
      {view === "activities" && <ActivityRegister view="activities" />}
      {view === "meetings" && <ActivityRegister view="meetings" />}
      {view === "tasks" && <ActivityRegister view="tasks" />}
      {view === "reports" && <Reports />}
      {view === "settings" && <SettingsView />}
    </div>
  );
}
