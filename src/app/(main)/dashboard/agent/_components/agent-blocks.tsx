"use client";

import Link from "next/link";

import { ArrowUpRight, CircleAlert, Clock, Download, TriangleAlert } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { exportTableCsv } from "./agent-export";
import type { RenderPayload } from "./agent-runtime";

const chartConfig = { value: { label: "Value", color: "var(--chart-1)" } } satisfies ChartConfig;
const donutColours = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

const compact = (value: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const severityIcon: Record<string, typeof Clock> = {
  Escalate: TriangleAlert,
  Overdue: CircleAlert,
  "Due soon": Clock,
};

/** Renders a tool result as real interface rather than a wall of JSON. */
export function AgentBlock({ payload }: { payload: RenderPayload }) {
  switch (payload.kind) {
    case "metrics":
      return (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-4">
          {payload.tiles.map((tile) => (
            <div key={tile.label} className="bg-card p-3">
              <p className="text-muted-foreground text-xs">{tile.label}</p>
              <p className="mt-1 font-semibold text-lg tabular-nums">{tile.value}</p>
              {tile.hint && <p className="mt-1 text-muted-foreground text-xs">{tile.hint}</p>}
            </div>
          ))}
        </div>
      );

    case "chart": {
      if (!payload.data.some((point) => point.value > 0)) {
        return <p className="rounded-lg border border-dashed p-4 text-muted-foreground text-sm">No values to chart.</p>;
      }
      return (
        <div className="rounded-lg border p-3">
          <p className="font-medium text-sm">{payload.title}</p>
          <p className="text-muted-foreground text-xs">Measured in {payload.unit}.</p>
          <ChartContainer config={chartConfig} className="mt-3 h-56 w-full">
            {payload.variant === "donut" ? (
              <PieChart accessibilityLayer>
                <Pie data={payload.data} dataKey="value" nameKey="label" innerRadius="52%" outerRadius="78%">
                  {payload.data.map((point, index) => (
                    <Cell key={point.label} fill={donutColours[index % donutColours.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
              </PieChart>
            ) : (
              <BarChart accessibilityLayer data={payload.data} layout="vertical" margin={{ left: 4, right: 16 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickFormatter={compact} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={104} axisLine={false} tickLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
              </BarChart>
            )}
          </ChartContainer>
        </div>
      );
    }

    case "table": {
      if (!payload.rows.length) {
        return (
          <p className="rounded-lg border border-dashed p-4 text-muted-foreground text-sm">No matching records.</p>
        );
      }
      return (
        <div className="rounded-lg border">
          <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
            <p className="text-muted-foreground text-xs">
              {payload.rows.length} {payload.rows.length === 1 ? "record" : "records"}
            </p>
            <Button variant="ghost" size="sm" onClick={() => exportTableCsv(payload)}>
              <Download aria-hidden="true" /> CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {payload.columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payload.rows.map((row, rowIndex) => (
                  <TableRow key={payload.ids[rowIndex] ?? rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={`${payload.columns[cellIndex]}`} className="whitespace-nowrap">
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    case "record":
      return (
        <div className="rounded-lg border p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-sm">{payload.title}</p>
              {payload.subtitle && <p className="text-muted-foreground text-xs">{payload.subtitle}</p>}
            </div>
            {payload.href && (
              <Link
                href={payload.href}
                className="inline-flex shrink-0 items-center gap-1 text-xs underline-offset-4 hover:underline"
              >
                Open <ArrowUpRight className="size-3" aria-hidden="true" />
              </Link>
            )}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {payload.fields.map((field) => (
              <div key={field.label}>
                <dt className="text-muted-foreground text-xs">{field.label}</dt>
                <dd className="font-medium text-sm tabular-nums">{field.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      );

    case "exceptions":
      if (!payload.items.length) {
        return (
          <p className="rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
            Nothing is breaching in this scope.
          </p>
        );
      }
      return (
        <div className="divide-y overflow-hidden rounded-lg border">
          {payload.items.map((item) => {
            const Icon = severityIcon[item.severity] ?? Clock;
            return (
              <Link
                key={`${item.title}-${item.href}-${item.detail}`}
                href={item.href}
                className="flex items-center justify-between gap-3 p-3 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex min-w-0 items-start gap-2">
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{item.title}</p>
                    <p className="truncate text-muted-foreground text-xs">{item.detail}</p>
                  </div>
                </div>
                <Badge variant={item.severity === "Due soon" ? "secondary" : "destructive"}>{item.severity}</Badge>
              </Link>
            );
          })}
        </div>
      );

    case "navigate":
      return (
        <p className="text-muted-foreground text-sm">
          Opened <span className="font-medium text-foreground">{payload.path}</span>.
        </p>
      );

    default:
      return null;
  }
}
