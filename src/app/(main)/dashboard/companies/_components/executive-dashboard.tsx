"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { ArrowUpRight, Clock3, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

import {
  CampaignDeliveryChart,
  CreatorBalanceChart,
  MarketRevenueChart,
  PipelineValueChart,
} from "./commercial-charts";
import { approvalAge, invoiceBalance, reportingAmount } from "./commercial-model";
import { useCompanies } from "./companies-provider";

const stageOrder = ["Proposal / Price Quote", "Management Review", "Financial Review", "Released", "Sent To Client"];

export function ExecutiveDashboard() {
  const state = useCompanies();
  const { campaigns, companies, leads, financeInvoices, activities, team, rules, fxToSar } = state;
  const [clock, setClock] = useState<number | null>(null);
  useEffect(() => {
    setClock(Date.now());
    const timer = setInterval(() => setClock(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const now = clock ?? 0;
  const money = (value: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: rules.baseCurrency,
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(value);
  const open = campaigns.filter((item) => stageOrder.includes(item.stage));
  const won = campaigns.filter((item) => item.stage === "Client Approved");
  const lost = campaigns.filter((item) => item.stage === "Client Not Approved");
  const pipeline = open.reduce((sum, item) => sum + reportingAmount(item, state), 0);
  const wonValue = won.reduce((sum, item) => sum + reportingAmount(item, state), 0);
  const issued = financeInvoices.filter(
    (item) => !["Draft", "Pending Approval", "Approved", "Cancelled"].includes(item.status),
  );
  const outstanding = issued.reduce(
    (sum, item) =>
      sum + (invoiceBalance(item) * (item.fxSnapshot?.rate ?? fxToSar[item.currency])) / fxToSar[rules.baseCurrency],
    0,
  );
  const pending = open.filter((item) => ["Management Review", "Financial Review"].includes(item.stage));
  const missingInvoices = won.filter(
    (item) => !financeInvoices.some((invoice) => invoice.quotationId === item.id || invoice.id === item.invoiceId),
  );
  const tasks = activities.filter((item) => item.status === "Open" && item.type === "Task");
  const overdue = tasks.filter((item) => item.dueDate && new Date(item.dueDate).getTime() < now);
  const staleLeads = leads.filter(
    (item) =>
      !["Converted", "Junk"].includes(item.status) &&
      now - new Date(item.lastActivityAt ?? item.createdAt).getTime() > 7 * 86_400_000,
  );
  const exceptions = [
    ...pending
      .filter((item) => approvalAge(item, now).hours >= 24)
      .map((item) => ({
        id: item.id,
        title: item.name,
        detail: `${item.stage} · ${Math.floor(approvalAge(item, now).hours)}h waiting`,
        owner: item.stage === "Financial Review" ? "Finance" : "Management",
        href: `/dashboard/companies/quotations/${item.id}`,
        severity: approvalAge(item, now).hours >= 48 ? "Escalate" : "Review",
        rank: approvalAge(item, now).hours >= 48 ? 0 : 1,
      })),
    ...missingInvoices.map((item) => ({
      id: item.id,
      title: item.name,
      detail: "Client approved · invoice missing",
      owner: "Finance",
      href: `/dashboard/companies/quotations/${item.id}`,
      severity: "Invoice",
      rank: 1,
    })),
    ...open
      .filter((item) => item.stage === "Released")
      .map((item) => ({
        id: item.id,
        title: item.name,
        detail: "Released · awaiting client delivery",
        owner: item.owner,
        href: `/dashboard/companies/quotations/${item.id}`,
        severity: "Send",
        rank: 2,
      })),
    ...overdue.map((item) => ({
      id: item.id,
      title: item.title,
      detail: "Task past its due date",
      owner: item.owner ?? "Unassigned",
      href: "/dashboard/companies/tasks",
      severity: "Overdue",
      rank: 0,
    })),
    ...staleLeads.map((item) => ({
      id: item.id,
      title: item.leadName,
      detail: "No activity in the last 7 days",
      owner: item.owner,
      href: "/dashboard/companies/leads",
      severity: "Follow up",
      rank: 2,
    })),
  ].sort((a, b) => a.rank - b.rank);
  const closest = [...open]
    .sort(
      (a, b) =>
        stageOrder.indexOf(b.stage) - stageOrder.indexOf(a.stage) ||
        new Date(a.expectedCloseDate ?? "9999-01-01").getTime() -
          new Date(b.expectedCloseDate ?? "9999-01-01").getTime(),
    )
    .slice(0, 5);
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{rules.activeScope}</Badge>
            <span className="text-muted-foreground text-xs">
              {clock ? new Intl.DateTimeFormat("en", { dateStyle: "full" }).format(clock) : "Executive workspace"}
            </span>
          </div>
          <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">Revenue, with a clear next move.</h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Commercial momentum, decisions waiting, and commitments to deliver.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/dashboard/companies/quotations">
              New quotation
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/companies/leads">Open sales workspace</Link>
          </Button>
        </div>
      </header>
      <section aria-label="Commercial performance" className="grid grid-cols-2 gap-6 border-b pb-6 lg:grid-cols-4">
        {[
          { label: "Open pipeline", value: money(pipeline), detail: `${open.length} active quotations` },
          { label: "Won business", value: money(wonValue), detail: `${won.length} client approvals` },
          { label: "Outstanding receivables", value: money(outstanding), detail: "Issued invoices, net of receipts" },
          {
            label: "Decision win rate",
            value: won.length + lost.length ? `${Math.round((won.length / (won.length + lost.length)) * 100)}%` : "—",
            detail: "Won ÷ won and lost; excludes cancellations",
          },
        ].map((item) => (
          <div key={item.label} className="flex flex-col gap-2">
            <p className="font-medium text-muted-foreground text-xs">{item.label}</p>
            <p className="font-semibold text-3xl tabular-nums tracking-tight">{item.value}</p>
            <p className="text-muted-foreground text-xs">{item.detail}</p>
          </div>
        ))}
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <PipelineValueChart />
        <MarketRevenueChart />
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Decisions & follow-through</CardTitle>
              <Badge variant={exceptions.length ? "secondary" : "outline"}>{exceptions.length} need attention</Badge>
            </div>
            <CardDescription>
              Exceptions ordered by urgency. Each one leads to the record that resolves it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {exceptions.slice(0, 7).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex flex-wrap items-center justify-between gap-3 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium group-hover:text-primary">{item.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.detail} · {item.owner}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={item.rank === 0 ? "destructive" : "outline"}>{item.severity}</Badge>
                    <ArrowUpRight className="size-4" />
                  </div>
                </Link>
              ))}
              {!exceptions.length && (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>No exceptions in this scope</EmptyTitle>
                    <EmptyDescription>
                      New approval delays, missed follow-ups, and invoice gaps will appear here.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="xl:col-span-4">
          <CreatorBalanceChart />
        </div>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <CardHeader>
            <CardTitle>Closest to closing</CardTitle>
            <CardDescription>Later-stage quotations first, then expected close date.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {closest.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/companies/quotations/${item.id}`}
                className="flex items-start justify-between gap-4 py-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {companies.find((company) => company.id === item.companyId)?.name} · {item.owner}
                  </p>
                  <p className="mt-2 text-muted-foreground text-xs">
                    {item.stage} · {item.expectedCloseDate || "Close date not set"}
                  </p>
                </div>
                <p className="shrink-0 font-medium tabular-nums">{money(reportingAmount(item, state))}</p>
              </Link>
            ))}
            {!closest.length && (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Your next opportunity starts here</EmptyTitle>
                  <EmptyDescription>
                    Create a quotation from a company to begin the approval lifecycle.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
        <div className="xl:col-span-5">
          <CampaignDeliveryChart />
        </div>
      </div>
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Owner accountability</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/companies/reports">
              Management reports
              <FileText data-icon="inline-end" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {team
            .filter(
              (person) =>
                person.active &&
                person.role === "Sales" &&
                (rules.activeScope === "Group" || person.branch === rules.activeScope),
            )
            .map((person) => {
              const owned = open.filter((item) => item.owner === person.name);
              return (
                <div key={person.id} className="flex flex-col gap-3 border-primary/30 border-l-2 pl-4">
                  <div>
                    <p className="font-medium">{person.name}</p>
                    <p className="text-muted-foreground text-xs">{person.branch}</p>
                  </div>
                  <p className="font-semibold text-xl tabular-nums">
                    {money(owned.reduce((sum, item) => sum + reportingAmount(item, state), 0))}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {owned.length} open quotes · {overdue.filter((item) => item.owner === person.name).length} overdue
                    tasks
                  </p>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}
