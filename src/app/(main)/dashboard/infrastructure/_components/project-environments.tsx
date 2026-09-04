"use client";

import { cn } from "cn";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bell,
  ChevronDown,
  CircleDashed,
  CircleGauge,
  Clock3,
  Copy,
  EllipsisVertical,
  FileText,
  Plus,
  RefreshCw,
  Settings,
  SquareTerminal,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";

import { SimpleIcon } from "@/components/simple-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { InfrastructureEnvironment, InfrastructureGroup } from "./infrastructure-data";

interface ProjectEnvironmentsProps {
  group: InfrastructureGroup;
  onAddEnvironment?: (groupName: string) => void;
  onRestartRow?: (domain: string) => void;
  sortAsc?: boolean | null;
  onToggleSort?: () => void;
}

export function ProjectEnvironments({
  group,
  onAddEnvironment,
  onRestartRow,
  sortAsc,
  onToggleSort,
}: ProjectEnvironmentsProps) {
  const handleGroupAction = (action: string) => {
    switch (action) {
      case "logs":
        toast.info(`Recent activity for ${group.name}:\n• Deployment succeeded (10m ago)\n• Health checks passing`);
        break;
      case "console":
        toast.info(`Opening web terminal for cluster [${group.name}]... Connected.`);
        break;
      case "settings":
        toast.info(`Opening project settings for ${group.name}...`);
        break;
      case "sync":
        toast.success(`Synchronized ${group.name} with cluster registry`);
        break;
      case "alerts":
        toast.info(`Alert rules active for ${group.name}: 0 triggering, 4 healthy.`);
        break;
      case "copy-id": {
        const id = `prj_${group.name.toLowerCase().replace(/\s+/g, "_")}`;
        navigator.clipboard?.writeText(id);
        toast.success(`Project ID copied: ${id}`);
        break;
      }
    }
  };

  return (
    <Collapsible
      defaultOpen
      className="flex flex-col overflow-hidden rounded-xl border bg-card py-3 text-card-foreground data-[state=open]:gap-3 data-[state=open]:pb-0"
    >
      <div className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="group -ml-2 h-auto w-full justify-start gap-2 px-2 py-1 hover:bg-transparent aria-expanded:bg-transparent sm:flex-1"
          >
            <ChevronDown className="group-data-[state=open]:rotate-180" />
            <div className="flex min-w-0 items-baseline gap-1.5 text-left">
              <span className="shrink-0 font-medium leading-none">{group.organization}</span>
              <span className="min-w-0 truncate text-muted-foreground text-sm">({group.name})</span>
            </div>
          </Button>
        </CollapsibleTrigger>
        <div className="flex w-full items-center justify-between gap-2 sm:ml-auto sm:w-auto sm:justify-end">
          <Button variant="ghost" size="sm" className="-ml-1.5 sm:ml-0" onClick={() => onAddEnvironment?.(group.name)}>
            <Plus data-icon="inline-start" />
            Add Environment
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="Project actions">
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="end">
              <DropdownMenuGroup>
                {group.rows.length > 0 ? (
                  <DropdownMenuItem onSelect={() => handleGroupAction("logs")}>
                    <FileText />
                    Activity Logs
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onSelect={() => handleGroupAction("console")}>
                  <Terminal />
                  Open Console
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleGroupAction("settings")}>
                  <Settings />
                  Project Settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleGroupAction("sync")}>
                  <RefreshCw />
                  Sync Status
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleGroupAction("alerts")}>
                  <Bell />
                  Manage Alerts
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => handleGroupAction("copy-id")}>
                  <Copy />
                  Copy Project ID
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CollapsibleContent>
        {group.rows.length > 0 ? (
          <EnvironmentTable
            rows={group.rows}
            onRestartRow={onRestartRow}
            sortAsc={sortAsc}
            onToggleSort={onToggleSort}
          />
        ) : (
          <EmptyProjectState onAdd={() => onAddEnvironment?.(group.name)} />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function EnvironmentTable({
  rows,
  onRestartRow,
  sortAsc,
  onToggleSort,
}: {
  rows: InfrastructureEnvironment[];
  onRestartRow?: (domain: string) => void;
  sortAsc?: boolean | null;
  onToggleSort?: () => void;
}) {
  const handleRowAction = (action: string, row: InfrastructureEnvironment) => {
    switch (action) {
      case "logs":
        toast.info(`Streaming logs for ${row.domain} [HTTP 200 OK 42ms]`);
        break;
      case "console":
        toast.info(`Opening SSH console on ${row.server} (${row.domain})...`);
        break;
      case "restart":
        onRestartRow?.(row.domain);
        break;
      case "copy-url": {
        const url = `https://${row.domain}`;
        navigator.clipboard?.writeText(url);
        toast.success(`Copied: ${url}`);
        break;
      }
    }
  };

  return (
    <div className="scrollbar-thin overflow-x-auto [scrollbar-color:var(--border)_transparent] **:data-[slot=table-container]:overflow-visible [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1">
      <Table className="min-w-[1700px] table-fixed **:data-[slot='table-cell']:px-5 **:data-[slot='table-head']:px-5">
        <colgroup>
          <col className="w-90" />
          <col className="w-40" />
          <col className="w-42" />
          <col className="w-35" />
          <col className="w-35" />
          <col className="w-38" />
          <col className="w-98" />
          <col className="w-55" />
          <col className="w-18" />
        </colgroup>
        <TableHeader className="bg-muted/50 [&_tr]:border-y">
          <TableRow>
            <TableHead className="font-medium">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                onClick={onToggleSort}
              >
                Domain
                <SortIcon sortAsc={sortAsc} />
              </button>
            </TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Environment</TableHead>
            <TableHead>Health</TableHead>
            <TableHead>Latency</TableHead>
            <TableHead>Uptime</TableHead>
            <TableHead>Resources</TableHead>
            <TableHead>Server</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody className="**:data-[slot='table-row']:hover:bg-muted/40">
          {rows.map((row) => (
            <TableRow key={row.domain}>
              <TableCell>
                <a
                  href={`https://${row.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate font-medium hover:underline"
                  title={row.domain}
                >
                  {row.domain}
                </a>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-2 font-medium text-muted-foreground">
                  <SimpleIcon icon={row.platform.icon} className="size-4 fill-current" />
                  {row.platform.name}
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={row.environment === "Expired" ? "destructive" : "secondary"}
                  className={cn(
                    "rounded-sm px-1.5 py-0.5",
                    row.environment === "Production" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    row.environment === "Staging" && "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                  )}
                >
                  {row.environment}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={row.status === "Online" ? "secondary" : "destructive"}
                  className={cn(
                    "rounded-sm px-1.5 py-0.5",
                    row.status === "Online" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      row.status === "Online" ? "bg-emerald-500" : "bg-destructive",
                    )}
                  />
                  {row.status}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground tabular-nums">
                  <CircleGauge className="size-4" />
                  {row.latency}
                </span>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground tabular-nums">
                  <Clock3 className="size-4" />
                  {row.uptime}
                </span>
              </TableCell>
              <TableCell>
                <div className="grid grid-cols-3 gap-4">
                  <ResourceMeter label="CPU" value={row.resources.cpu} />
                  <ResourceMeter label="RAM" value={row.resources.ram} />
                  <ResourceMeter label="Disk" value={row.resources.disk} />
                </div>
              </TableCell>
              <TableCell>
                <span className="flex flex-col font-medium">
                  {row.server}
                  <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <span
                      aria-hidden="true"
                      className={cn("shrink-0 rounded-xs text-sm ring-1 ring-foreground/10", `flag:${row.countryCode}`)}
                    />
                    {row.countryCode} · {row.plan}
                  </span>
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="-mr-2" aria-label="Actions for environment">
                      <SquareTerminal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40" align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onSelect={() => handleRowAction("logs", row)}>
                        <FileText />
                        View Logs
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleRowAction("console", row)}>
                        <Terminal />
                        Open Console
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleRowAction("restart", row)}>
                        <RefreshCw />
                        Restart
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onSelect={() => handleRowAction("copy-url", row)}>
                        <Copy />
                        Copy URL
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ResourceMeter({ label, value }: { label: string; value: number }) {
  const isCritical = value >= 70;
  const isWarning = value >= 55;

  return (
    <span className="min-w-0 space-y-1">
      <span className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-medium text-emerald-600 tabular-nums dark:text-emerald-400",
            isWarning && "text-amber-600 dark:text-amber-400",
            isCritical && "text-destructive",
          )}
        >
          {value}%
        </span>
      </span>
      <span className="block h-1.5 overflow-hidden rounded-full bg-muted-foreground/20">
        <span
          className={cn(
            "block h-full rounded-full bg-emerald-500",
            isWarning && "bg-amber-500",
            isCritical && "bg-destructive",
          )}
          style={{ width: `${value}%` }}
        />
      </span>
    </span>
  );
}

function EmptyProjectState({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center gap-2 border-t bg-muted/50 p-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <CircleDashed className="size-4" />
        <p className="font-medium text-sm">No environments configured in this project</p>
      </div>
      {onAdd && (
        <Button variant="outline" size="sm" onClick={onAdd} className="mt-1">
          <Plus data-icon="inline-start" />
          Add first environment
        </Button>
      )}
    </div>
  );
}

function SortIcon({ sortAsc }: { sortAsc?: boolean | null }) {
  if (sortAsc === true) {
    return <ArrowUp className="size-4 text-foreground" />;
  }
  if (sortAsc === false) {
    return <ArrowDown className="size-4 text-foreground" />;
  }
  return <ArrowUpDown className="size-4 opacity-50" />;
}
