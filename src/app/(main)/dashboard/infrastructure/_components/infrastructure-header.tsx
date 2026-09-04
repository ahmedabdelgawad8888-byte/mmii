"use client";

import * as React from "react";

import { cn } from "cn";
import { Box, Check, Container, Filter, PlusCircle, RefreshCw, Search, Server, Settings, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";

interface InfrastructureHeaderProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  selectedOrg?: string;
  onSelectOrg?: (val: string) => void;
  selectedStack?: string;
  onSelectStack?: (val: string) => void;
  selectedCloud?: string;
  onSelectCloud?: (val: string) => void;
  selectedEnv?: string;
  onSelectEnv?: (val: string) => void;
  activeFiltersCount?: number;
  onResetFilters?: () => void;
  lastUpdated?: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onOpenSettings?: () => void;
}

const orgs = ["Weblabs Studio", "Aiy Cap", "Storeframe", "Acme Corp"];
const stacks = ["Next.js", "React", "Remix", "Node.js"];
const clouds = ["AWS", "Azure", "Hetzner Cloud", "Bare Metal"];
const envs = ["Production", "Staging", "Expired"];

export function InfrastructureHeader({
  searchQuery = "",
  onSearchChange,
  selectedOrg = "all",
  onSelectOrg,
  selectedStack = "all",
  onSelectStack,
  selectedCloud = "all",
  onSelectCloud,
  selectedEnv = "all",
  onSelectEnv,
  activeFiltersCount = 0,
  onResetFilters,
  lastUpdated = "30s ago",
  isRefreshing = false,
  onRefresh,
  onOpenSettings,
}: InfrastructureHeaderProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-medium text-2xl leading-tight tracking-tight sm:text-3xl sm:leading-none">
              Infrastructure Overview
            </h1>
            <p className="text-muted-foreground text-sm">
              Monitor environments, server health, uptime, and resource usage across every project.
            </p>
          </div>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <span className="whitespace-nowrap text-muted-foreground text-sm">Last updated: {lastUpdated}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Refresh telemetry"
              >
                <RefreshCw className={cn(isRefreshing && "animate-spin")} />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={onOpenSettings}
                aria-label="Open infrastructure settings"
              >
                <Settings data-icon="inline-start" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <Container />6 Projects
          </Badge>
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <Box />
            16 Environments
          </Badge>
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <Server />
            36 Servers
          </Badge>
          <Badge variant="outline" className="h-auto gap-1 rounded-sm px-1.5 py-0.5">
            <span className="size-2 rounded-full bg-green-600 dark:bg-green-500" />
            99.93% Global Uptime
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row">
        <InputGroup className="flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchInputRef}
            placeholder="Search by name or domain..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange?.("")}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <Kbd>⌘ K</Kbd>
            )}
          </InputGroupAddon>
        </InputGroup>

        <div className="flex flex-wrap gap-2">
          {/* Organization filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedOrg !== "all" ? "secondary" : "outline"}
                className={cn(selectedOrg !== "all" && "border-primary/40 font-medium")}
              >
                <PlusCircle data-icon="inline-start" />
                {selectedOrg !== "all" ? selectedOrg : "Organization"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Select Organization</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onSelectOrg?.("all")}>
                <span className="flex-1">All Organizations</span>
                {selectedOrg === "all" && <Check className="size-4" />}
              </DropdownMenuItem>
              {orgs.map((org) => (
                <DropdownMenuItem key={org} onSelect={() => onSelectOrg?.(org)}>
                  <span className="flex-1">{org}</span>
                  {selectedOrg.toLowerCase() === org.toLowerCase() && <Check className="size-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Stack filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedStack !== "all" ? "secondary" : "outline"}
                className={cn(selectedStack !== "all" && "border-primary/40 font-medium")}
              >
                <PlusCircle data-icon="inline-start" />
                {selectedStack !== "all" ? selectedStack : "Stack"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Select Stack</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onSelectStack?.("all")}>
                <span className="flex-1">All Stacks</span>
                {selectedStack === "all" && <Check className="size-4" />}
              </DropdownMenuItem>
              {stacks.map((stack) => (
                <DropdownMenuItem key={stack} onSelect={() => onSelectStack?.(stack)}>
                  <span className="flex-1">{stack}</span>
                  {selectedStack.toLowerCase() === stack.toLowerCase() && <Check className="size-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cloud provider filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedCloud !== "all" ? "secondary" : "outline"}
                className={cn(selectedCloud !== "all" && "border-primary/40 font-medium")}
              >
                <PlusCircle data-icon="inline-start" />
                {selectedCloud !== "all" ? selectedCloud : "Cloud provider"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Select Cloud Provider</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onSelectCloud?.("all")}>
                <span className="flex-1">All Providers</span>
                {selectedCloud === "all" && <Check className="size-4" />}
              </DropdownMenuItem>
              {clouds.map((cloud) => (
                <DropdownMenuItem key={cloud} onSelect={() => onSelectCloud?.(cloud)}>
                  <span className="flex-1">{cloud}</span>
                  {selectedCloud.toLowerCase() === cloud.toLowerCase() && <Check className="size-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Environment filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={selectedEnv !== "all" ? "secondary" : "outline"}
                className={cn(selectedEnv !== "all" && "border-primary/40 font-medium")}
              >
                <PlusCircle data-icon="inline-start" />
                {selectedEnv !== "all" ? selectedEnv : "Environment"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Select Environment</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onSelectEnv?.("all")}>
                <span className="flex-1">All Environments</span>
                {selectedEnv === "all" && <Check className="size-4" />}
              </DropdownMenuItem>
              {envs.map((env) => (
                <DropdownMenuItem key={env} onSelect={() => onSelectEnv?.(env)}>
                  <span className="flex-1">{env}</span>
                  {selectedEnv.toLowerCase() === env.toLowerCase() && <Check className="size-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Active Filters / Reset */}
          {activeFiltersCount > 0 ? (
            <Button
              variant="outline"
              onClick={onResetFilters}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <X className="size-3.5" />
              Reset ({activeFiltersCount})
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                // cycle quick filter or toast
                onSelectEnv?.(selectedEnv === "all" ? "Production" : "all");
              }}
            >
              <Filter data-icon="inline-start" />
              Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
