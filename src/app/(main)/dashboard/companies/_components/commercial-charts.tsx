"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

import { creatorBalance, invoiceBalance, quotationTotals, reportingAmount } from "./commercial-model";
import { useCompanies } from "./companies-provider";

const commercialConfig = {
  pipeline: { label: "Open pipeline", color: "var(--chart-1)" },
  won: { label: "Client approved", color: "var(--chart-2)" },
  collected: { label: "Collected", color: "var(--chart-3)" },
  value: { label: "Quotation value", color: "var(--chart-1)" },
} satisfies ChartConfig;
const deliveryConfig = {
  target: { label: "Target", color: "var(--chart-3)" },
  approved: { label: "Client approved", color: "var(--chart-1)" },
  completed: { label: "Completed", color: "var(--chart-2)" },
} satisfies ChartConfig;
const cashConfig = {
  receipts: { label: "Expected receipts", color: "var(--chart-1)" },
  payments: { label: "Supplier payments", color: "var(--chart-3)" },
} satisfies ChartConfig;
const costConfig = {
  expected: { label: "Budgeted cost", color: "var(--chart-3)" },
  recorded: { label: "Recorded cost", color: "var(--chart-1)" },
} satisfies ChartConfig;
const quantityConfig = {
  available: { label: "Available", color: "var(--chart-1)" },
  reserved: { label: "Reserved", color: "var(--chart-3)" },
  consumed: { label: "Consumed", color: "var(--chart-2)" },
  expired: { label: "Expired", color: "var(--chart-4)" },
} satisfies ChartConfig;

const compact = (value: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const shorten = (value: string) => (value.length > 20 ? `${value.slice(0, 20)}…` : value);
const marketAbbreviations: Record<string, string> = {
  "Saudi Arabia": "KSA",
  "United Arab Emirates": "UAE",
};
/** Category ticks share the plot width, so long market names are abbreviated rather than clipped. */
const marketTick = (value: string) => marketAbbreviations[value] ?? value;

function NoChartData({ description }: { description: string }) {
  return (
    <Empty className="min-h-64">
      <EmptyHeader>
        <EmptyTitle>No records to chart yet</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function PipelineValueChart() {
  const state = useCompanies();
  const stages = [
    ["Proposal / Price Quote", "Draft"],
    ["Management Review", "Management"],
    ["Financial Review", "Finance"],
    ["Released", "Released"],
    ["Sent To Client", "With client"],
    ["Client Approved", "Won"],
  ];
  const data = stages.map(([stage, label]) => ({
    stage: label,
    value: state.campaigns
      .filter((item) => item.stage === stage)
      .reduce((sum, item) => sum + reportingAmount(item, state), 0),
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Where commercial value sits</CardTitle>
        <CardDescription>
          {state.rules.baseCurrency} equivalent · current stage inventory, not a conversion funnel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.campaigns.length ? (
          <ChartContainer config={commercialConfig} className="h-64 w-full">
            <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 4, right: 16 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickFormatter={compact} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" width={84} axisLine={false} tickLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((item) => (
                  <Cell key={item.stage} fill={item.stage === "Won" ? "var(--chart-2)" : "var(--chart-1)"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <NoChartData description="Quotation values appear as you price and advance opportunities." />
        )}
      </CardContent>
    </Card>
  );
}

export function MarketRevenueChart() {
  const state = useCompanies();
  const markets = [
    ...new Set([...state.companies.map((item) => item.branch), ...state.financeInvoices.map((item) => item.entity)]),
  ];
  const data = markets.map((market) => {
    const quotations = state.campaigns.filter((item) => item.branch === market);
    const invoices = state.financeInvoices.filter(
      (item) => item.entity === market && !["Draft", "Pending Approval", "Approved", "Cancelled"].includes(item.status),
    );
    return {
      market,
      pipeline: quotations
        .filter((item) => !["Client Approved", "Client Not Approved", "Client Cancelled"].includes(item.stage))
        .reduce((sum, item) => sum + reportingAmount(item, state), 0),
      won: quotations
        .filter((item) => item.stage === "Client Approved")
        .reduce((sum, item) => sum + reportingAmount(item, state), 0),
      collected: invoices.reduce(
        (sum, item) =>
          sum +
          (item.paidAmount * (item.fxSnapshot?.rate ?? state.fxToSar[item.currency])) /
            state.fxToSar[state.rules.baseCurrency],
        0,
      ),
    };
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & collections by market</CardTitle>
        <CardDescription>
          {state.rules.baseCurrency} equivalent · pipeline, approved business, and receipts are separate measures.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={commercialConfig} className="h-64 w-full">
            <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="market"
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                interval={0}
                tickFormatter={marketTick}
              />
              <YAxis tickFormatter={compact} axisLine={false} tickLine={false} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="pipeline" fill="var(--color-pipeline)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="won" fill="var(--color-won)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="collected" fill="var(--color-collected)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <NoChartData description="Market comparison appears once companies or invoices exist in a market." />
        )}
      </CardContent>
    </Card>
  );
}

export function CampaignDeliveryChart() {
  const { activationCampaigns, influencers } = useCompanies();
  const approvedStages = [
    "Approved",
    "Scheduled",
    "Visited",
    "Posting Coverage Received",
    "Posting Coverage Verified",
    "Completed",
  ];
  const data = activationCampaigns
    .filter((item) => item.status === "Active" || item.status === "Planning")
    .map((campaign) => ({
      name: shorten(campaign.name),
      target: campaign.target,
      approved: influencers.filter((item) => item.campaignId === campaign.id && approvedStages.includes(item.stage))
        .length,
      completed: influencers.filter((item) => item.campaignId === campaign.id && item.stage === "Completed").length,
    }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Commitment to delivery</CardTitle>
        <CardDescription>
          Creator targets, client approvals, and completed delivery for active and planned campaigns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={deliveryConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 4, right: 12 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={118} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="target" fill="var(--color-target)" radius={[0, 3, 3, 0]} />
              <Bar dataKey="approved" fill="var(--color-approved)" radius={[0, 3, 3, 0]} />
              <Bar dataKey="completed" fill="var(--color-completed)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <NoChartData description="Create an activation campaign to compare commitments and delivery." />
        )}
      </CardContent>
    </Card>
  );
}

export function CreatorBalanceChart() {
  const { creatorLedger } = useCompanies();
  const balance = creatorBalance(creatorLedger);
  const data = ["available", "reserved", "consumed", "expired"].map((key) => ({
    category: key,
    value: balance[key as keyof typeof balance],
    fill: `var(--color-${key})`,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Creator entitlement mix</CardTitle>
        <CardDescription>
          {balance.available} available · {balance.reserved} reserved · {balance.consumed} consumed · {balance.expired}{" "}
          expired.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.some((item) => item.value > 0) ? (
          <ChartContainer config={quantityConfig} className="mx-auto h-72 w-full">
            <PieChart accessibilityLayer>
              <Pie
                data={data}
                dataKey="value"
                nameKey="category"
                innerRadius="52%"
                outerRadius="78%"
                paddingAngle={2}
                strokeWidth={0}
              />
              <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
              <ChartLegend content={<ChartLegendContent nameKey="category" />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <NoChartData description="Approved quotations create entitlement entries in the creator ledger." />
        )}
      </CardContent>
    </Card>
  );
}

export function CashCommitmentsChart() {
  const { expenses, financeInvoices, fxToSar, rules } = useCompanies();
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  const buckets = [
    { label: "Overdue", start: "", end: today },
    ...Array.from({ length: 4 }, (_, index) => ({
      label: `Week ${index + 1}`,
      start: new Date(now + index * 7 * 86_400_000).toISOString().slice(0, 10),
      end: new Date(now + (index + 1) * 7 * 86_400_000).toISOString().slice(0, 10),
    })),
  ];
  const convert = (amount: number, currency: keyof typeof fxToSar) =>
    (amount * fxToSar[currency]) / fxToSar[rules.baseCurrency];
  const data = buckets.map((bucket) => ({
    period: bucket.label,
    receipts: financeInvoices
      .filter(
        (item) =>
          !["Draft", "Pending Approval", "Approved", "Cancelled"].includes(item.status) &&
          item.dueDate.slice(0, 10) >= bucket.start &&
          item.dueDate.slice(0, 10) < bucket.end,
      )
      .reduce((sum, item) => sum + convert(invoiceBalance(item), item.currency), 0),
    payments: expenses
      .filter((item) => !item.paid && item.dueDate >= bucket.start && item.dueDate < bucket.end)
      .reduce((sum, item) => sum + convert(item.amount, item.currency), 0),
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle>The next four weeks of cash commitments</CardTitle>
        <CardDescription>
          {rules.baseCurrency} at current planning FX · invoice due dates and unpaid supplier commitments, excluding
          opening cash.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.some((item) => item.receipts > 0 || item.payments > 0) ? (
          <ChartContainer config={cashConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="period" axisLine={false} tickLine={false} interval={0} />
              <YAxis tickFormatter={compact} axisLine={false} tickLine={false} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="receipts" fill="var(--color-receipts)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="payments" fill="var(--color-payments)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <NoChartData description="Issued invoices and unpaid supplier commitments appear here as due dates approach." />
        )}
      </CardContent>
    </Card>
  );
}

export function CostBudgetChart() {
  const { campaigns, expenses, fxToSar, rules } = useCompanies();
  const ranked = campaigns
    .filter((item) => item.pricing)
    .map((item) => ({
      name: shorten(item.name),
      expected: item.pricing
        ? (quotationTotals(item.requestedInfluencers, item.pricing).cost * fxToSar[item.currency]) /
          fxToSar[rules.baseCurrency]
        : 0,
      recorded: expenses
        .filter((expense) => expense.quotationId === item.id)
        .reduce((sum, expense) => sum + (expense.amount * fxToSar[expense.currency]) / fxToSar[rules.baseCurrency], 0),
    }))
    .sort((a, b) => b.expected - a.expected);
  // Bars become unreadable past roughly eight categories, so the chart ranks by cost and the table carries the rest.
  const data = ranked.slice(0, 8);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost budget vs recorded commitments</CardTitle>
        <CardDescription>
          {rules.baseCurrency} at current planning FX · quotation cost estimates against recorded supplier and execution
          costs
          {ranked.length > data.length ? `, for the ${data.length} highest-cost quotations of ${ranked.length}` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length ? (
          <ChartContainer config={costConfig} className="h-72 w-full">
            <BarChart accessibilityLayer data={data} layout="vertical">
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickFormatter={compact} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={118} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="expected" fill="var(--color-expected)" radius={[0, 3, 3, 0]} />
              <Bar dataKey="recorded" fill="var(--color-recorded)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <NoChartData description="Save cost estimates on a quotation to start the budget comparison." />
        )}
      </CardContent>
    </Card>
  );
}
