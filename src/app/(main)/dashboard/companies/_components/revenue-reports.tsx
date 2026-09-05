"use client";

import { useState } from "react";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { approvalAge, invoiceBalance, reportingAmount } from "./commercial-model";
import { useCompanies } from "./companies-provider";
import { exportRows } from "./register-tools";

export function RevenueReports() {
  const state = useCompanies();
  const { campaigns, companies, leads, financeInvoices, activities, rules, fxToSar } = state;
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const inRange = (date: string) => (!from || date.slice(0, 10) >= from) && (!to || date.slice(0, 10) <= to);
  const cohort = campaigns.filter((item) => inRange(item.createdAt));
  const leadCohort = leads.filter((item) => inRange(item.createdAt));
  const money = (value: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency: rules.baseCurrency, maximumFractionDigits: 0 }).format(
      value,
    );
  const markets = [...new Set(companies.map((item) => item.branch))].map((market) => {
    const records = cohort.filter((item) => item.branch === market);
    const invoices = financeInvoices.filter(
      (item) =>
        item.entity === market &&
        inRange(item.createdAt) &&
        !["Draft", "Pending Approval", "Approved", "Cancelled"].includes(item.status),
    );
    const sum = (stage: string) =>
      records.filter((item) => item.stage === stage).reduce((total, item) => total + reportingAmount(item, state), 0);
    return {
      Market: market,
      Quotations: records.length,
      "Open pipeline": money(
        records
          .filter((item) => !["Client Approved", "Client Not Approved", "Client Cancelled"].includes(item.stage))
          .reduce((total, item) => total + reportingAmount(item, state), 0),
      ),
      "Won value": money(sum("Client Approved")),
      Invoices: invoices.length,
      Outstanding: money(
        invoices.reduce(
          (total, item) =>
            total +
            (invoiceBalance(item) * (item.fxSnapshot?.rate ?? fxToSar[item.currency])) / fxToSar[rules.baseCurrency],
          0,
        ),
      ),
    };
  });
  const sources = [...new Set(leadCohort.map((item) => item.source))].map((source) => {
    const records = leadCohort.filter((item) => item.source === source);
    const companyIds = new Set(records.map((item) => item.convertedCompanyId).filter(Boolean));
    const won = campaigns.filter((item) => item.stage === "Client Approved" && companyIds.has(item.companyId));
    return {
      Source: source,
      Leads: records.length,
      Converted: records.filter((item) => item.convertedAt).length,
      "Converted share": `${Math.round((records.filter((item) => item.convertedAt).length / records.length) * 100)}%`,
      "Attributed won value": money(won.reduce((total, item) => total + reportingAmount(item, state), 0)),
    };
  });
  const approvals = cohort
    .filter((item) => ["Management Review", "Financial Review"].includes(item.stage))
    .map((item) => ({
      Quotation: item.name,
      Review: item.stage,
      Owner: item.owner,
      "Waiting hours": Math.floor(approvalAge(item).hours),
      SLA: approvalAge(item).label,
    }));
  const owners = [...new Set(cohort.map((item) => item.owner))].map((owner) => ({
    Owner: owner,
    Quotations: cohort.filter((item) => item.owner === owner).length,
    "Won value": money(
      cohort
        .filter((item) => item.owner === owner && item.stage === "Client Approved")
        .reduce((total, item) => total + reportingAmount(item, state), 0),
    ),
    "Open tasks": activities.filter((item) => item.owner === owner && item.status === "Open" && item.type === "Task")
      .length,
  }));
  const losses = cohort
    .filter((item) => item.stage === "Client Not Approved" || item.stage === "Client Cancelled")
    .map((item) => ({
      Quotation: item.name,
      Outcome: item.stage,
      Reason: item.lossReason ?? "Not recorded",
      Context: item.lossNotes ?? "",
      Value: money(reportingAmount(item, state)),
    }));
  const milestones = ["Management Review", "Financial Review", "Released", "Sent To Client", "Client Approved"].map(
    (stage) => {
      const reached = cohort.filter(
        (item) => item.stage === stage || item.history.some((entry) => entry.detail.endsWith(`→ ${stage}`)),
      ).length;
      return {
        Milestone: stage,
        "Unique quotations": reached,
        "Share of cohort": cohort.length ? `${Math.round((reached / cohort.length) * 100)}%` : "—",
      };
    },
  );
  const panels = [
    {
      id: "revenue",
      label: "Revenue",
      title: "Markets & receivables",
      description:
        "Quotations by creation date; invoices by invoice creation date. Quotation and invoice FX snapshots are used when available.",
      rows: markets,
    },
    {
      id: "cohorts",
      label: "Cohorts",
      title: "Recorded quotation milestones",
      description:
        "Unique quotations created in the selected period that have a recorded milestone. Every share uses the same cohort denominator; skipped approvals are not inferred.",
      rows: milestones,
    },
    {
      id: "sources",
      label: "Sources",
      title: "Acquisition source attribution",
      description:
        "Leads created in the period and lifetime won quotations for their converted companies. This is attribution, not marketing ROI; acquisition spend is not recorded.",
      rows: sources,
    },
    {
      id: "owners",
      label: "Owners",
      title: "Commercial ownership",
      description: "Quotation cohort performance with current open task workload.",
      rows: owners,
    },
    {
      id: "approvals",
      label: "Approvals",
      title: "Approval SLA",
      description:
        "Current waiting time for the quotation cohort. Reminders at 24 hours, breach at 48, escalation at 72.",
      rows: approvals,
    },
    {
      id: "losses",
      label: "Losses",
      title: "Why opportunities close",
      description: "Structured reasons preserve the commercial story after a quotation is lost or cancelled.",
      rows: losses,
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-muted-foreground text-xs uppercase tracking-widest">Intelligence · Management reporting</p>
        <h1 className="mt-2 font-semibold text-3xl tracking-tight">The numbers behind the next decision.</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Defined cohorts, explicit currencies, and traceable commercial outcomes.
        </p>
      </header>
      <FieldGroup className="grid max-w-xl gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="report-from">Created from</FieldLabel>
          <Input id="report-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="report-to">Created through</FieldLabel>
          <Input id="report-to" type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} />
        </Field>
      </FieldGroup>
      <Tabs defaultValue="revenue">
        <div className="overflow-x-auto">
          <TabsList>
            {panels.map((panel) => (
              <TabsTrigger key={panel.id} value={panel.id}>
                {panel.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {panels.map((panel) => (
          <TabsContent key={panel.id} value={panel.id}>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>{panel.title}</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportRows(`report-${panel.id}`, panel.rows)}>
                    Export CSV
                  </Button>
                </div>
                <CardDescription>{panel.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {(panel.id === "cohorts" || panel.id === "sources") && panel.rows.length > 0 && (
                  <ChartContainer
                    config={{
                      value: { label: panel.id === "cohorts" ? "Unique quotations" : "Leads", color: "var(--chart-1)" },
                    }}
                    className="mb-6 h-64 w-full"
                  >
                    <BarChart
                      accessibilityLayer
                      data={
                        panel.id === "cohorts"
                          ? milestones.map((item) => ({ name: item.Milestone, value: item["Unique quotations"] }))
                          : sources.map((item) => ({ name: item.Source, value: item.Leads }))
                      }
                      layout="vertical"
                    >
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={130} axisLine={false} tickLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
                {panel.rows.length ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(panel.rows[0]).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {panel.rows.map((row) => (
                          <TableRow key={String(Object.values(row)[0])}>
                            {Object.entries(row).map(([key, value]) => (
                              <TableCell key={key}>{value}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="py-8 text-muted-foreground text-sm">
                    No matching records in this cohort. Adjust the date range or record a commercial outcome.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
