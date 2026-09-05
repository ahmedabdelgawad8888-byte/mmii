"use client";

import { type FormEvent, type ReactNode, useState } from "react";

import Link from "next/link";

import {
  ArrowRight,
  Building2,
  CalendarPlus,
  Check,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  ListTodo,
  Megaphone,
  PackagePlus,
  Paperclip,
  Phone,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  StickyNote,
  Tags,
  Undo2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

import { approvalAge, creatorBalance, invoiceStatus, reportingAmount } from "./commercial-model";
import { useCompanies } from "./companies-provider";
import { ClientDecision, QuotationCommercial } from "./quotation-commercial";
import type { Branch, Campaign, RecordStatus } from "./types";

export type CompaniesView = "directory" | "brands" | "campaigns" | "approvals";

const branches: Branch[] = ["Saudi Arabia", "Egypt", "UAE", "Kuwait", "Qatar", "Bahrain"];
const statuses: RecordStatus[] = ["Active", "Prospect", "Inactive"];

function StatusBadge({ value }: { value: string }) {
  const positive = ["Active", "Approved", "Client Approved", "Released"].includes(value);
  const attention = value.startsWith("Pending") || value.includes("Review") || value === "Prospect";
  let variant: "default" | "secondary" | "outline" = "outline";
  if (positive) variant = "default";
  else if (attention) variant = "secondary";
  return <Badge variant={variant}>{value}</Badge>;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Building2;
  label: string;
  value: string | number;
  description: string;
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
        <p className="text-muted-foreground text-xs">{description}</p>
      </CardContent>
    </Card>
  );
}

function WorkspaceHeader({ view }: { view: CompaniesView }) {
  const items: Array<{ id: CompaniesView; label: string; href: string }> = [
    { id: "directory", label: "Directory", href: "/dashboard/companies" },
    { id: "brands", label: "Brands", href: "/dashboard/companies/brands" },
    { id: "campaigns", label: "Quotations", href: "/dashboard/companies/quotations" },
    { id: "approvals", label: "Approvals", href: "/dashboard/companies/approvals" },
  ];
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium text-muted-foreground text-sm">Companies workspace</p>
        </div>
        <h1 className="font-semibold text-3xl tracking-tight">
          {
            {
              directory: "Company relationships",
              brands: "Brands & account ownership",
              campaigns: "Quotations & commercial terms",
              approvals: "Decisions that move business forward",
            }[view]
          }
        </h1>
        <p className="max-w-2xl text-muted-foreground text-sm">
          {
            {
              directory: "The legal account behind every brand, quotation, and client commitment.",
              brands: "Distinct contacts, budgets, and creator balances within each company.",
              campaigns: "Price clearly. Review confidently. Keep every handoff accountable.",
              approvals: "Review the value, margin, owner, and time waiting before making a decision.",
            }[view]
          }
        </p>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Companies sections">
        {items.map((item) => (
          <Button key={item.id} variant={view === item.id ? "default" : "outline"} size="sm" asChild>
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </nav>
    </div>
  );
}

function CompanyDialog() {
  const { addCompany } = useCompanies();
  const [open, setOpen] = useState(false);
  const [branch, setBranch] = useState<Branch>("Saudi Arabia");
  const [status, setStatus] = useState<RecordStatus>("Prospect");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addCompany({
      name: String(data.get("name")),
      contactPerson: String(data.get("contactPerson")),
      email: String(data.get("email")),
      phone: String(data.get("phone")),
      industry: String(data.get("industry")),
      owner: String(data.get("owner")),
      branch,
      status,
    });
    setOpen(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Add company
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add company</DialogTitle>
            <DialogDescription>Create the parent record that brands and campaigns will use.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="company-name">Company name</FieldLabel>
                <Input id="company-name" name="name" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="company-industry">Industry</FieldLabel>
                <Input id="company-industry" name="industry" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="company-contact">Contact person</FieldLabel>
                <Input id="company-contact" name="contactPerson" />
              </Field>
              <Field>
                <FieldLabel htmlFor="company-owner">Owner</FieldLabel>
                <Input id="company-owner" name="owner" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="company-email">Email</FieldLabel>
                <Input id="company-email" name="email" type="email" />
              </Field>
              <Field>
                <FieldLabel htmlFor="company-phone">Phone</FieldLabel>
                <Input id="company-phone" name="phone" />
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
                <FieldLabel>Status</FieldLabel>
                <Select value={status} onValueChange={(value) => setStatus(value as RecordStatus)}>
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
            </div>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create company</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BrandDialog({ defaultCompanyId }: { defaultCompanyId?: string }) {
  const { addBrand, companies } = useCompanies();
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? companies[0]?.id ?? "");
  const [status, setStatus] = useState<RecordStatus>("Active");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (
      addBrand({ name: String(data.get("name")), companyId, contactPerson: String(data.get("contactPerson")), status })
    )
      setOpen(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Add brand
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add brand</DialogTitle>
            <DialogDescription>
              Link a brand to one existing company. Ownership and branch follow the company record.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="brand-name">Brand name</FieldLabel>
              <Input id="brand-name" name="name" required />
            </Field>
            <Field>
              <FieldLabel>Company</FieldLabel>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select company" />
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
              <FieldLabel htmlFor="brand-contact">Brand contact</FieldLabel>
              <Input id="brand-contact" name="contactPerson" />
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={status} onValueChange={(value) => setStatus(value as RecordStatus)}>
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
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!companyId}>
              Create brand
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CampaignDialog({ defaultCompanyId }: { defaultCompanyId?: string }) {
  const { addCampaign, brands, companies } = useCompanies();
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? companies[0]?.id ?? "");
  const [brandId, setBrandId] = useState("none");
  const availableBrands = brands.filter((brand) => brand.companyId === companyId);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (
      addCampaign({
        name: String(data.get("name")),
        companyId,
        brandId: brandId === "none" ? null : brandId,
        budget: Number(data.get("budget")),
        requestedInfluencers: Number(data.get("influencers")),
      })
    )
      setOpen(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          New quotation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New quotation</DialogTitle>
            <DialogDescription>
              Start a proposal. Currency, branch, and owner inherit from the selected company.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="campaign-name">Campaign name</FieldLabel>
              <Input id="campaign-name" name="name" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Company</FieldLabel>
                <Select
                  value={companyId}
                  onValueChange={(value) => {
                    setCompanyId(value);
                    setBrandId("none");
                  }}
                >
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
                <FieldLabel>Brand</FieldLabel>
                <Select value={brandId} onValueChange={setBrandId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">Company level</SelectItem>
                      {availableBrands.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="campaign-budget">Budget</FieldLabel>
                <Input id="campaign-budget" name="budget" type="number" min="0" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="campaign-influencers">Influencers requested</FieldLabel>
                <Input id="campaign-influencers" name="influencers" type="number" min="0" required />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!companyId}>
              Create proposal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ActivityDialog({
  companyId,
  type,
  label,
  icon: Icon,
}: {
  companyId: string;
  type: "Meeting" | "Call" | "Task" | "Note";
  label: string;
  icon: typeof CalendarPlus;
}) {
  const { addActivity } = useCompanies();
  const [open, setOpen] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addActivity(companyId, type, String(data.get("title")), String(data.get("dueDate") || ""));
    setOpen(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Icon data-icon="inline-start" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>Add this {type.toLowerCase()} to the company activity timeline.</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`activity-${type}`}>Details</FieldLabel>
              <Input
                id={`activity-${type}`}
                name="title"
                required
                placeholder={`Enter ${type.toLowerCase()} details`}
              />
            </Field>
            {(type === "Task" || type === "Meeting") && (
              <Field>
                <FieldLabel htmlFor={`due-${type}`}>Due / scheduled date</FieldLabel>
                <Input id={`due-${type}`} name="dueDate" type="date" required />
              </Field>
            )}
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save {type.toLowerCase()}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AttachmentDialog({ companyId }: { companyId: string }) {
  const { addAttachment } = useCompanies();
  const [open, setOpen] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("attachment");
    if (!(file instanceof File) || !file.name) return;
    if (file.size > 1024 * 1024) {
      toast.error("Demo attachments are limited to 1 MB per file.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast.error("The file could not be read.");
    reader.onload = () => {
      addAttachment(companyId, {
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl: String(reader.result),
      });
      setOpen(false);
    };
    reader.readAsDataURL(file);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Paperclip data-icon="inline-start" />
          Add attachment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add attachment</DialogTitle>
            <DialogDescription>
              Save a file in this browser with the company. Demo limit: 1 MB per file.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="company-attachment">File</FieldLabel>
              <Input id="company-attachment" name="attachment" type="file" required />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Add file</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmptyRecords({ type, action }: { type: string; action: ReactNode }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackagePlus />
        </EmptyMedia>
        <EmptyTitle>No {type} yet</EmptyTitle>
        <EmptyDescription>Create the first record to activate this part of the workflow.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>{action}</EmptyContent>
    </Empty>
  );
}

function DirectoryView() {
  const { brands, campaigns, companies, activities } = useCompanies();
  const [query, setQuery] = useState("");
  const filtered = companies.filter((company) =>
    `${company.name} ${company.contactPerson} ${company.email} ${company.id}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const active = companies.filter((company) => company.status === "Active").length;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Building2}
          label="Companies"
          value={companies.length}
          description={`${active} active relationships`}
        />
        <KpiCard icon={Tags} label="Brands" value={brands.length} description="Linked to company records" />
        <KpiCard
          icon={Megaphone}
          label="Quotations"
          value={campaigns.length}
          description="Across every workflow stage"
        />
        <KpiCard
          icon={Users}
          label="Open activities"
          value={activities.filter((item) => item.status === "Open").length}
          description="Calls, meetings, tasks, and notes"
        />
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Company directory</CardTitle>
            <CardDescription>Searchable parent records for brands, campaigns, and activities.</CardDescription>
          </div>
          <CompanyDialog />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company, contact, email, or ID"
              aria-label="Search companies"
            />
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Brands</TableHead>
                  <TableHead>Campaigns</TableHead>
                  <TableHead className="text-right">Open record</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Link className="font-medium hover:underline" href={`/dashboard/companies/${company.id}`}>
                          {company.name}
                        </Link>
                        <span className="text-muted-foreground text-xs">
                          {company.id} · {company.industry}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{company.contactPerson || "Not added"}</span>
                        <span className="text-muted-foreground text-xs">
                          {company.email || company.phone || "No contact details"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{company.branch}</TableCell>
                    <TableCell>
                      <StatusBadge value={company.status} />
                    </TableCell>
                    <TableCell>{brands.filter((item) => item.companyId === company.id).length}</TableCell>
                    <TableCell>{campaigns.filter((item) => item.companyId === company.id).length}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/companies/${company.id}`}>
                          View
                          <ArrowRight data-icon="inline-end" />
                        </Link>
                      </Button>
                    </TableCell>
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

function BrandsView() {
  const { brands, campaigns, companies } = useCompanies();
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Brands</CardTitle>
          <CardDescription>
            Brand records inherit ownership, branch, and industry from their parent company.
          </CardDescription>
        </div>
        <BrandDialog />
      </CardHeader>
      <CardContent>
        {brands.length === 0 ? (
          <EmptyRecords type="brands" action={<BrandDialog />} />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Campaigns</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand) => {
                  const company = companies.find((item) => item.id === brand.companyId);
                  return (
                    <TableRow key={brand.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{brand.name}</span>
                          <span className="text-muted-foreground text-xs">{brand.id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {company ? (
                          <Link className="hover:underline" href={`/dashboard/companies/${company.id}`}>
                            {company.name}
                          </Link>
                        ) : (
                          "Missing company"
                        )}
                      </TableCell>
                      <TableCell>{brand.owner}</TableCell>
                      <TableCell>{brand.branch}</TableCell>
                      <TableCell>
                        <StatusBadge value={brand.status} />
                      </TableCell>
                      <TableCell>{campaigns.filter((item) => item.brandId === brand.id).length}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CampaignActions({ campaign }: { campaign: Campaign }) {
  const { progressCampaign } = useCompanies();
  const labels: Partial<Record<Campaign["stage"], string>> = {
    "Proposal / Price Quote": "Submit",
    "Management Review": "Management approve",
    "Financial Review": "Finance approve",
    Released: "Mark sent to client",
    "Sent To Client": "Record client approval",
  };
  const label = labels[campaign.stage];
  if (!label) return null;
  return (
    <Button size="sm" variant="outline" onClick={() => progressCampaign(campaign.id)}>
      {label}
      <ArrowRight data-icon="inline-end" />
    </Button>
  );
}

function CampaignsView() {
  const { brands, campaigns, companies } = useCompanies();
  const state = useCompanies();
  const total = campaigns.reduce((sum, item) => sum + reportingAmount(item, state), 0);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          icon={Megaphone}
          label="Quotations"
          value={campaigns.length}
          description="Company and brand-linked work"
        />
        <KpiCard
          icon={CircleDollarSign}
          label="Proposal value"
          value={`${state.rules.baseCurrency} ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          description="Consolidated quotation value"
        />
        <KpiCard
          icon={FileCheck2}
          label="Approved"
          value={campaigns.filter((item) => item.stage === "Client Approved").length}
          description="Completed client decisions"
        />
      </div>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Quotation pipeline</CardTitle>
            <CardDescription>Proposal, management, finance, release, client send, and client decision.</CardDescription>
          </div>
          <CampaignDialog />
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <EmptyRecords type="quotations" action={<CampaignDialog />} />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Company / brand</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead className="text-right">Next action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const company = companies.find((item) => item.id === campaign.companyId);
                    const brand = brands.find((item) => item.id === campaign.brandId);
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Link
                              className="font-medium hover:underline"
                              href={`/dashboard/companies/quotations/${campaign.id}`}
                            >
                              {campaign.name}
                            </Link>
                            <span className="text-muted-foreground text-xs">
                              {campaign.id} · {campaign.requestedInfluencers} influencers
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{company?.name ?? "Missing company"}</span>
                            <span className="text-muted-foreground text-xs">{brand?.name ?? "Company level"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {campaign.currency} {campaign.budget.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={campaign.stage} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-end gap-2">
                            <StatusBadge value={campaign.approvalStatus} />
                            {["Management Review", "Financial Review"].includes(campaign.stage) && (
                              <Badge variant={approvalAge(campaign).hours >= 48 ? "destructive" : "outline"}>
                                {Math.floor(approvalAge(campaign).hours)}h · {approvalAge(campaign).label}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <CampaignActions campaign={campaign} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ApprovalsView() {
  const { campaigns, canApprove, companies, progressCampaign, rejectCampaign, requestRevision, rules, team } =
    useCompanies();
  const pending = campaigns.filter((item) => item.stage === "Management Review" || item.stage === "Financial Review");
  const currentUser = team.find((item) => item.id === rules.currentUserId) ?? team[0];
  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <ShieldCheck />
        <AlertTitle>
          {currentUser?.name ?? "Employee"} · {currentUser?.role ?? "No role"}
        </AlertTitle>
        <AlertDescription>
          Demo role controls apply to all review actions. Identity is selected in Settings; no secure sign-in is
          connected.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Approval queue</CardTitle>
          <CardDescription>
            Management and Finance only see campaigns currently waiting for their decision.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Check />
                </EmptyMedia>
                <EmptyTitle>Approval queue is clear</EmptyTitle>
                <EmptyDescription>Submit a campaign from the pipeline to begin the review flow.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/companies/quotations">Open quotations</Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {pending.map((campaign) => {
                const company = companies.find((item) => item.id === campaign.companyId);
                return (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle>{campaign.name}</CardTitle>
                          <CardDescription>
                            {company?.name} · {campaign.branch}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <StatusBadge value={campaign.approvalStatus} />
                          {["Management Review", "Financial Review"].includes(campaign.stage) && (
                            <Badge variant={approvalAge(campaign).hours >= 48 ? "destructive" : "outline"}>
                              {Math.floor(approvalAge(campaign).hours)}h · {approvalAge(campaign).label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Value</p>
                          <p className="font-medium">
                            {campaign.currency} {campaign.budget.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Influencers</p>
                          <p className="font-medium">{campaign.requestedInfluencers}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={!canApprove(campaign.stage === "Management Review" ? "Management" : "Finance")}
                          onClick={() => progressCampaign(campaign.id)}
                        >
                          <Check data-icon="inline-start" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canApprove(campaign.stage === "Management Review" ? "Management" : "Finance")}
                          onClick={() => requestRevision(campaign.id)}
                        >
                          <Undo2 data-icon="inline-start" />
                          Request revision
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!canApprove(campaign.stage === "Management Review" ? "Management" : "Finance")}
                          onClick={() => rejectCampaign(campaign.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function CompaniesWorkspace({ view }: { view: CompaniesView }) {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <WorkspaceHeader view={view} />
      {view === "directory" && <DirectoryView />}
      {view === "brands" && <BrandsView />}
      {view === "campaigns" && <CampaignsView />}
      {view === "approvals" && <ApprovalsView />}
    </div>
  );
}

export function CompanyDetail({ companyId }: { companyId: string }) {
  const { activities, attachments, brands, campaigns, companies, financeInvoices, creatorLedger } = useCompanies();
  const company = companies.find((item) => item.id === companyId);
  if (!company)
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Building2 />
          </EmptyMedia>
          <EmptyTitle>Company not found</EmptyTitle>
          <EmptyDescription>This record is not available in the current workspace.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/dashboard/companies">Return to directory</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  const companyBrands = brands.filter((item) => item.companyId === company.id);
  const companyCampaigns = campaigns.filter((item) => item.companyId === company.id);
  const companyActivities = activities.filter((item) => item.companyId === company.id);
  const companyAttachments = attachments.filter((item) => item.companyId === company.id);
  const companyInvoices = financeInvoices.filter((item) => item.companyId === company.id);
  const timeline = [
    ...companyActivities.map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.type,
      date: item.createdAt,
    })),
    ...companyCampaigns.flatMap((campaign) =>
      campaign.history.map((item) => ({
        id: item.id,
        title: item.title,
        detail: `${campaign.name} · ${item.detail}`,
        date: item.createdAt,
      })),
    ),
  ].sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
  const balance = creatorBalance(creatorLedger.filter((entry) => entry.companyId === company.id));
  const remaining = balance.available;
  const utilization =
    company.requestedInfluencers + company.freeInfluencers === 0
      ? 0
      : Math.round((company.usedInfluencers / (company.requestedInfluencers + company.freeInfluencers)) * 100);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <Button variant="link" className="h-auto justify-start p-0 text-muted-foreground" asChild>
            <Link href="/dashboard/companies">Company directory</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-semibold text-2xl tracking-tight">{company.name}</h1>
            <StatusBadge value={company.status} />
            <Badge variant="outline">{company.source}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {company.id} · {company.industry} · {company.branch} · Owner: {company.owner}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActivityDialog companyId={company.id} type="Meeting" label="Schedule meeting" icon={CalendarPlus} />
          <ActivityDialog companyId={company.id} type="Call" label="Log call" icon={Phone} />
          <ActivityDialog companyId={company.id} type="Task" label="Create task" icon={ListTodo} />
          <CampaignDialog defaultCompanyId={company.id} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Requested"
          value={company.requestedInfluencers}
          description={`${company.freeInfluencers} free allocations`}
        />
        <KpiCard
          icon={Check}
          label="Used"
          value={company.usedInfluencers}
          description={`${utilization}% utilization`}
        />
        <KpiCard
          icon={CircleDollarSign}
          label="Remaining"
          value={remaining}
          description="Requested plus free, less used"
        />
        <KpiCard
          icon={Tags}
          label="Brands"
          value={companyBrands.length}
          description={`${companyCampaigns.length} linked campaigns`}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Influencer utilization</CardTitle>
          <CardDescription>Allocation position on the company record.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Progress value={utilization} />
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>{company.usedInfluencers} used</span>
            <span>{remaining} remaining</span>
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue="overview">
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact profile</CardTitle>
                <CardDescription>Primary commercial contact details.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-sm">Contact</p>
                  <p className="font-medium">{company.contactPerson || "Not added"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Email</p>
                  <p className="font-medium">{company.email || "Not added"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Phone</p>
                  <p className="font-medium">{company.phone || "Not added"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Website</p>
                  <p className="font-medium">{company.website || "Not added"}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Relationship summary</CardTitle>
                <CardDescription>Live counts from connected workspace records.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">Brands</p>
                  <p className="font-semibold text-2xl">{companyBrands.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Campaigns</p>
                  <p className="font-semibold text-2xl">{companyCampaigns.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Open activities</p>
                  <p className="font-semibold text-2xl">
                    {companyActivities.filter((item) => item.status === "Open").length}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Client approved</p>
                  <p className="font-semibold text-2xl">
                    {companyCampaigns.filter((item) => item.stage === "Client Approved").length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="brands">
          <Card>
            <CardHeader>
              <CardTitle>Linked brands</CardTitle>
              <CardDescription>Brands explicitly assigned to this company.</CardDescription>
            </CardHeader>
            <CardContent>
              {companyBrands.length ? (
                <div className="flex flex-col gap-2">
                  {companyBrands.map((brand) => (
                    <div key={brand.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{brand.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {brand.id} · {brand.contactPerson || "No contact"}
                        </p>
                      </div>
                      <StatusBadge value={brand.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyRecords type="linked brands" action={<BrandDialog defaultCompanyId={company.id} />} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Company campaigns</CardTitle>
              <CardDescription>Campaigns linked directly or through one of this company’s brands.</CardDescription>
            </CardHeader>
            <CardContent>
              {companyCampaigns.length ? (
                <div className="flex flex-col gap-2">
                  {companyCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <Link
                          className="font-medium hover:underline"
                          href={`/dashboard/companies/quotations/${campaign.id}`}
                        >
                          {campaign.name}
                        </Link>
                        <p className="text-muted-foreground text-xs">
                          {campaign.currency} {campaign.budget.toLocaleString()} · {campaign.requestedInfluencers}{" "}
                          influencers
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge value={campaign.stage} />
                        <CampaignActions campaign={campaign} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyRecords type="company campaigns" action={<CampaignDialog defaultCompanyId={company.id} />} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activities">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Activities</CardTitle>
                <CardDescription>Calls, meetings, tasks, and notes attached to this company.</CardDescription>
              </div>
              <ActivityDialog companyId={company.id} type="Note" label="Add note" icon={StickyNote} />
            </CardHeader>
            <CardContent>
              {companyActivities.length ? (
                <div className="flex flex-col gap-3">
                  {companyActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between gap-4 rounded-lg border p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{activity.type}</Badge>
                          <span className="text-muted-foreground text-xs">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-2 text-sm">{activity.title}</p>
                      </div>
                      <StatusBadge value={activity.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyRecords type="activities" action={null} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>An invoice is generated when a campaign reaches client approval.</CardDescription>
            </CardHeader>
            <CardContent>
              {companyInvoices.length ? (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.id}</TableCell>
                          <TableCell>
                            {companyCampaigns.find((item) => item.id === invoice.quotationId)?.name ??
                              "Company invoice"}
                          </TableCell>
                          <TableCell>
                            {invoice.currency} {invoice.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{invoiceStatus(invoice)}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Empty className="border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ReceiptText />
                    </EmptyMedia>
                    <EmptyTitle>No invoices yet</EmptyTitle>
                    <EmptyDescription>
                      Complete a campaign through client approval to generate its invoice record.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Combined timeline</CardTitle>
              <CardDescription>
                Company activities and campaign workflow events in one chronological view.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.length ? (
                <div className="flex flex-col gap-3">
                  {timeline.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <Clock3 className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
                      <div className="flex flex-col gap-1">
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.detail} · {new Date(item.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyRecords type="timeline events" action={null} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="attachments">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Attachments</CardTitle>
                <CardDescription>File references recorded against this company.</CardDescription>
              </div>
              <AttachmentDialog companyId={company.id} />
            </CardHeader>
            <CardContent>
              {companyAttachments.length ? (
                <div className="flex flex-col gap-2">
                  {companyAttachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Paperclip className="size-4 text-muted-foreground" aria-hidden="true" />
                        <div>
                          <p className="font-medium text-sm">
                            {attachment.dataUrl ? (
                              <a
                                className="underline underline-offset-4"
                                href={attachment.dataUrl}
                                download={attachment.name}
                              >
                                {attachment.name}
                              </a>
                            ) : (
                              attachment.name
                            )}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {attachment.type} · {(attachment.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyRecords type="attachments" action={<AttachmentDialog companyId={company.id} />} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function QuotationDetail({ quotationId }: { quotationId: string }) {
  const { brands, campaigns, companies, requestRevision } = useCompanies();
  const quotation = campaigns.find((item) => item.id === quotationId);
  if (!quotation) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptText />
          </EmptyMedia>
          <EmptyTitle>Quotation not found</EmptyTitle>
          <EmptyDescription>This quotation is not available in the shared workspace.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/dashboard/companies/quotations">Return to quotations</Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }
  const company = companies.find((item) => item.id === quotation.companyId);
  const brand = brands.find((item) => item.id === quotation.brandId);
  const stages = [
    "Proposal / Price Quote",
    "Management Review",
    "Financial Review",
    "Released",
    "Sent To Client",
    "Client Approved",
  ] as const;
  const activeIndex = stages.indexOf(quotation.stage as (typeof stages)[number]);
  const terminal = ["Client Approved", "Client Not Approved", "Client Cancelled"].includes(quotation.stage);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <Button variant="link" className="h-auto justify-start p-0 text-muted-foreground" asChild>
            <Link href="/dashboard/companies/quotations">Quotation pipeline</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-semibold text-2xl tracking-tight">{quotation.name}</h1>
            <StatusBadge value={quotation.stage} />
            <StatusBadge value={quotation.approvalStatus} />
          </div>
          <p className="text-muted-foreground text-sm">
            {quotation.id} · {company?.name ?? "Missing company"} · {brand?.name ?? "Company level"} · Owner:{" "}
            {quotation.owner}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!terminal && <CampaignActions campaign={quotation} />}
          {["Management Review", "Financial Review"].includes(quotation.stage) && (
            <Button variant="outline" onClick={() => requestRevision(quotation.id)}>
              <Undo2 data-icon="inline-start" />
              Request revision
            </Button>
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Workflow handoff</CardTitle>
          <CardDescription>The current stage determines which employee role owns the next action.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            {stages.map((stage, index) => {
              let stageLabel = "Waiting";
              if (index < activeIndex) stageLabel = "Completed";
              else if (index === activeIndex) stageLabel = "Current";
              return (
                <div
                  key={stage}
                  className="flex flex-col gap-2 border-border border-l-2 py-1 pl-3"
                  aria-current={index === activeIndex ? "step" : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">{index + 1}</span>
                    {index < activeIndex || quotation.stage === "Client Approved" ? (
                      <Check className="size-4" />
                    ) : (
                      <Clock3 className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="font-medium text-sm">{stage}</p>
                  <Badge variant={index === activeIndex ? "default" : "outline"}>{stageLabel}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Commercial details</CardTitle>
            <CardDescription>Values inherited from the company and quotation.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm">Branch</p>
              <p className="font-medium">{quotation.branch}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Currency</p>
              <p className="font-medium">{quotation.currency}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Amount</p>
              <p className="font-medium">{quotation.budget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Influencers</p>
              <p className="font-medium">{quotation.requestedInfluencers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Delivery state</CardTitle>
            <CardDescription>Artifacts created by the workflow.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">PDF</span>
              <Badge variant={quotation.pdfReady ? "default" : "outline"}>
                {quotation.pdfReady ? "Print available" : "Awaiting release"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Follow-up</span>
              <span className="font-medium text-sm">
                {quotation.followUpDue ? new Date(quotation.followUpDue).toLocaleDateString() : "Not scheduled"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Invoice</span>
              <span className="font-medium text-sm">{quotation.invoiceId ?? "Not generated"}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Relationship</CardTitle>
            <CardDescription>The records affected by this quotation.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/companies/${quotation.companyId}`}>
                <Building2 data-icon="inline-start" />
                {company?.name ?? "Company"}
              </Link>
            </Button>
            {brand && (
              <div className="rounded-lg border p-3">
                <p className="font-medium text-sm">{brand.name}</p>
                <p className="text-muted-foreground text-xs">Brand · {brand.branch}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <QuotationCommercial key={quotation.id} quotation={quotation} />
      <ClientDecision quotation={quotation} />
      <Card>
        <CardHeader>
          <CardTitle>Stage history</CardTitle>
          <CardDescription>Every handoff made by the team on this quotation.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {quotation.history.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
              <Clock3 className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-muted-foreground text-xs">
                  {item.detail} · {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
