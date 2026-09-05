"use client";

import Link from "next/link";

import { ArrowUpRight, BriefcaseBusiness, Building2, CheckCircle2, Clock3, Target, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useCompanies } from "../../companies/_components/companies-provider";
import type { Branch } from "../../companies/_components/types";

const branches: Branch[] = ["Saudi Arabia", "UAE", "Kuwait", "Egypt", "Qatar", "Bahrain"];

const audienceConfig = {
  clients: { label: "Clients", color: "var(--chart-1)" },
  campaigns: { label: "Campaigns", color: "var(--chart-2)" },
  influencers: { label: "Influencers", color: "var(--chart-3)" },
} satisfies ChartConfig;

const funnelConfig = {
  value: { label: "Influencers", color: "var(--chart-1)" },
} satisfies ChartConfig;

const engagementConfig = {
  open: { label: "Open", color: "var(--chart-3)" },
  completed: { label: "Completed", color: "var(--chart-2)" },
} satisfies ChartConfig;

const conversionConfig = {
  value: { label: "Quotation value", color: "var(--chart-1)" },
} satisfies ChartConfig;

function ActionLink({ href, children }: { href: string; children: string }) {
  return (
    <Button size="sm" variant="ghost" asChild>
      <Link href={href}>
        {children}
        <ArrowUpRight data-icon="inline-end" />
      </Link>
    </Button>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="mt-2 text-2xl tabular-nums">{value}</CardTitle>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs">{detail}</p>
      </CardContent>
    </Card>
  );
}

export function AudienceAnalytics() {
  const { activationCampaigns, companies, influencers, rules } = useCompanies();
  const branchData = branches.map((branch) => {
    const branchCampaigns = activationCampaigns.filter((item) => item.branch === branch);
    const campaignIds = new Set(branchCampaigns.map((item) => item.id));
    return {
      branch: branch.replace("Saudi Arabia", "Saudi"),
      clients: companies.filter((item) => item.branch === branch).length,
      campaigns: branchCampaigns.length,
      influencers: influencers.filter((item) => campaignIds.has(item.campaignId)).length,
    };
  });
  const activeMarkets = branchData.filter((item) => item.clients + item.campaigns + item.influencers > 0).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Client records"
          value={companies.length}
          detail={`${rules.activeScope} scope`}
          icon={Building2}
        />
        <StatCard label="Active markets" value={activeMarkets} detail="Markets with connected activity" icon={Target} />
        <StatCard
          label="Campaign audience"
          value={influencers.length}
          detail="Influencers currently tracked"
          icon={Users}
        />
        <StatCard
          label="Approved audience"
          value={
            influencers.filter((item) =>
              [
                "Approved",
                "Scheduled",
                "Visited",
                "Posting Coverage Received",
                "Posting Coverage Verified",
                "Completed",
              ].includes(item.stage),
            ).length
          }
          detail="Progressed beyond client approval"
          icon={CheckCircle2}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Audience footprint by market</CardTitle>
            <CardDescription>
              Client, campaign, and influencer records currently connected to each entity.
            </CardDescription>
            <CardAction>
              <ActionLink href="/dashboard/companies">Open clients</ActionLink>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={audienceConfig} className="h-72 w-full">
              <BarChart accessibilityLayer data={branchData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="branch" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis axisLine={false} allowDecimals={false} tickLine={false} width={28} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="clients" fill="var(--color-clients)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="campaigns" fill="var(--color-campaigns)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="influencers" fill="var(--color-influencers)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Market coverage</CardTitle>
            <CardDescription>Relative record coverage across the Group.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {branchData.map((market) => {
              const total = market.clients + market.campaigns + market.influencers;
              const maximum = Math.max(
                1,
                ...branchData.map((item) => item.clients + item.campaigns + item.influencers),
              );
              const coverage = Math.round((total / maximum) * 100);
              return (
                <div key={market.branch} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{market.branch}</span>
                    <span className="text-muted-foreground">{total} records</span>
                  </div>
                  <Progress value={coverage} aria-label={`${market.branch} coverage ${coverage}%`} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AcquisitionAnalytics() {
  const { activationCampaigns, companies, influencers } = useCompanies();
  const funnel = [
    { stage: "Targeted", value: influencers.length },
    {
      stage: "Contacted",
      value: influencers.filter((item) => item.stage !== "Target" && item.stage !== "Prospected").length,
    },
    {
      stage: "Confirmed",
      value: influencers.filter(
        (item) => !["Target", "Prospected", "Contacted", "Interested", "Confirmation Requested"].includes(item.stage),
      ).length,
    },
    {
      stage: "Approved",
      value: influencers.filter((item) =>
        [
          "Approved",
          "Scheduled",
          "Visited",
          "Posting Coverage Received",
          "Posting Coverage Verified",
          "Completed",
        ].includes(item.stage),
      ).length,
    },
  ];
  const confirmed = funnel[2].value;
  const conversion = influencers.length ? Math.round((confirmed / influencers.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Campaigns acquiring"
          value={activationCampaigns.length}
          detail="Campaign plans in current scope"
          icon={BriefcaseBusiness}
        />
        <StatCard
          label="Clients represented"
          value={companies.length}
          detail="Connected commercial accounts"
          icon={Building2}
        />
        <StatCard
          label="Confirmation rate"
          value={`${conversion}%`}
          detail="Confirmed from tracked audience"
          icon={Target}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <CardHeader>
            <CardTitle>Influencer acquisition funnel</CardTitle>
            <CardDescription>Live progression from target list to client approval.</CardDescription>
            <CardAction>
              <ActionLink href="/dashboard/campaigns">Work the funnel</ActionLink>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={funnelConfig} className="h-72 w-full">
              <BarChart accessibilityLayer data={funnel} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" axisLine={false} allowDecimals={false} tickLine={false} />
                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} width={72} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle>Campaign acquisition health</CardTitle>
            <CardDescription>Target and confirmed volume by campaign.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Confirmed</TableHead>
                  <TableHead>Health</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activationCampaigns.map((campaign) => {
                  const campaignInfluencers = influencers.filter((item) => item.campaignId === campaign.id);
                  const campaignConfirmed = campaignInfluencers.filter(
                    (item) =>
                      !["Target", "Prospected", "Contacted", "Interested", "Confirmation Requested"].includes(
                        item.stage,
                      ),
                  ).length;
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <Link className="font-medium hover:underline" href={`/dashboard/campaigns/${campaign.id}`}>
                          {campaign.name}
                        </Link>
                      </TableCell>
                      <TableCell>{campaign.target}</TableCell>
                      <TableCell>{campaignConfirmed}</TableCell>
                      <TableCell>
                        <Badge variant={campaign.health === "Red" ? "destructive" : "secondary"}>
                          {campaign.health}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function EngagementAnalytics() {
  const { influencers, operationsQueue, team } = useCompanies();
  const teamData = team
    .filter((member) => member.active)
    .map((member) => ({
      owner: member.name.split(" ")[0],
      open: operationsQueue.filter((item) => item.owner === member.name && item.status !== "Completed").length,
      completed: operationsQueue.filter((item) => item.owner === member.name && item.status === "Completed").length,
    }));
  const coverageReceived = influencers.filter((item) =>
    ["Posting Coverage Received", "Posting Coverage Verified", "Completed"].includes(item.stage),
  ).length;
  const coverageVerified = influencers.filter((item) =>
    ["Posting Coverage Verified", "Completed"].includes(item.stage),
  ).length;
  const queueHealth = operationsQueue.length
    ? Math.round((operationsQueue.filter((item) => item.status === "Completed").length / operationsQueue.length) * 100)
    : 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Open operations"
          value={operationsQueue.filter((item) => item.status !== "Completed").length}
          detail="Assigned queue work"
          icon={Clock3}
        />
        <StatCard label="Coverage received" value={coverageReceived} detail="Creator evidence received" icon={Users} />
        <StatCard
          label="Coverage verified"
          value={coverageVerified}
          detail="QA-approved submissions"
          icon={CheckCircle2}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Employee workload and completion</CardTitle>
            <CardDescription>Open and completed operational work by active employee.</CardDescription>
            <CardAction>
              <ActionLink href="/dashboard/operations">Open queue</ActionLink>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={engagementConfig} className="h-72 w-full">
              <AreaChart accessibilityLayer data={teamData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="owner" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis axisLine={false} allowDecimals={false} tickLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  dataKey="open"
                  fill="var(--color-open)"
                  fillOpacity={0.25}
                  stroke="var(--color-open)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="completed"
                  fill="var(--color-completed)"
                  fillOpacity={0.25}
                  stroke="var(--color-completed)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Queue completion</CardTitle>
            <CardDescription>Closed work relative to all generated queue items.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5">
            <ChartContainer config={engagementConfig} className="h-52 w-full">
              <PieChart accessibilityLayer>
                <Pie
                  data={[
                    { name: "Completed", value: queueHealth },
                    { name: "Open", value: 100 - queueHealth },
                  ]}
                  dataKey="value"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={2}
                >
                  <Cell fill="var(--chart-2)" />
                  <Cell fill="var(--muted)" />
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
            <div className="text-center">
              <p className="font-semibold text-3xl">{queueHealth}%</p>
              <p className="text-muted-foreground text-sm">queue completion</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ConversionAnalytics() {
  const { campaigns, companies, financeInvoices, fxToSar } = useCompanies();
  const stages = [
    "Proposal / Price Quote",
    "Management Review",
    "Financial Review",
    "Released",
    "Sent To Client",
    "Client Approved",
  ] as const;
  const stageData = stages.map((stage) => ({
    stage: stage
      .replace("Proposal / Price Quote", "Proposal")
      .replace("Management Review", "Management")
      .replace("Financial Review", "Finance")
      .replace("Sent To Client", "Sent")
      .replace("Client Approved", "Won"),
    value: campaigns
      .filter((item) => item.stage === stage)
      .reduce((sum, item) => sum + item.budget * (item.fxSnapshot?.rate ?? fxToSar[item.currency]), 0),
  }));
  const won = campaigns.filter((item) => item.stage === "Client Approved");
  const closed = campaigns.filter((item) => ["Client Approved", "Client Not Approved"].includes(item.stage));
  const invoicedSar = financeInvoices.reduce((sum, item) => sum + item.amount * fxToSar[item.currency], 0);
  const collectedSar = financeInvoices.reduce((sum, item) => sum + item.paidAmount * fxToSar[item.currency], 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Quotation records"
          value={campaigns.length}
          detail="Commercial opportunities"
          icon={BriefcaseBusiness}
        />
        <StatCard
          label="Won deals"
          value={won.length}
          detail={`${Math.round((won.length / Math.max(1, closed.length)) * 100)}% of final decisions`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Invoiced"
          value={`SAR ${Math.round(invoicedSar).toLocaleString()}`}
          detail="Consolidated value"
          icon={Target}
        />
        <StatCard
          label="Collected"
          value={`SAR ${Math.round(collectedSar).toLocaleString()}`}
          detail="Recorded receipts"
          icon={Building2}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Quotation stage inventory</CardTitle>
            <CardDescription>Quotation value by approval and client-decision stage, normalized to SAR.</CardDescription>
            <CardAction>
              <ActionLink href="/dashboard/companies/quotations">Open quotations</ActionLink>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={conversionConfig} className="h-72 w-full">
              <BarChart accessibilityLayer data={stageData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="stage" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis
                  axisLine={false}
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000)}K`}
                  tickLine={false}
                  width={38}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent formatter={(value) => `SAR ${Number(value).toLocaleString()}`} />}
                />
                <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Quotation outcomes</CardTitle>
            <CardDescription>Every quotation remains connected to its company.</CardDescription>
            <CardAction>
              <ActionLink href="/dashboard/finance/invoices">Open invoices</ActionLink>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {campaigns.map((quotation) => (
              <Link
                key={quotation.id}
                href={`/dashboard/companies/quotations/${quotation.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">{quotation.name}</p>
                  <p className="truncate text-muted-foreground text-xs">
                    {companies.find((item) => item.id === quotation.companyId)?.name ?? "Unlinked"}
                  </p>
                </div>
                <Badge variant="outline">{quotation.stage}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
