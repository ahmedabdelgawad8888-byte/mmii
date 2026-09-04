"use client";

import * as React from "react";

import { siNextdotjs, siNodedotjs, siReact, siRemix } from "simple-icons";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { type InfrastructureEnvironment, type InfrastructureGroup, infrastructureGroups } from "./infrastructure-data";
import { InfrastructureHeader } from "./infrastructure-header";
import { ProjectEnvironments } from "./project-environments";

interface InfrastructureClientProps {
  initialGroups?: InfrastructureGroup[];
}

export function InfrastructureClient({ initialGroups = infrastructureGroups }: InfrastructureClientProps) {
  const [groups, setGroups] = React.useState<InfrastructureGroup[]>(initialGroups);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedOrg, setSelectedOrg] = React.useState<string>("all");
  const [selectedStack, setSelectedStack] = React.useState<string>("all");
  const [selectedCloud, setSelectedCloud] = React.useState<string>("all");
  const [selectedEnv, setSelectedEnv] = React.useState<string>("all");
  const [lastUpdated, setLastUpdated] = React.useState("Just now");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  // Settings State
  const [autoRemediation, setAutoRemediation] = React.useState(true);
  const [sampleRate, setSampleRate] = React.useState("10s");

  // Add Environment Dialog State
  const [addEnvTargetGroup, setAddEnvTargetGroup] = React.useState<string | null>(null);
  const [newEnvDomain, setNewEnvDomain] = React.useState("");
  const [newEnvPlatform, setNewEnvPlatform] = React.useState("Next.js");
  const [newEnvStage, setNewEnvStage] = React.useState<"Production" | "Staging" | "Expired">("Production");
  const [newEnvServer, setNewEnvServer] = React.useState("AWS");
  const [newEnvCountry, setNewEnvCountry] = React.useState("US");

  // Domain Sort
  const [sortAsc, setSortAsc] = React.useState<boolean | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Jitter metrics slightly to simulate live dynamic health check
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          rows: g.rows.map((r) => ({
            ...r,
            latency: `${Math.floor(20 + Math.random() * 90)}ms`,
            resources: {
              ...r.resources,
              cpu: Math.min(95, Math.max(10, r.resources.cpu + Math.floor(Math.random() * 11) - 5)),
            },
          })),
        })),
      );
      setIsRefreshing(false);
      setLastUpdated("Just now");
      toast.success("Infrastructure health checked across all clusters");
    }, 600);
  };

  const handleRestartRow = (domain: string) => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1200)), {
      loading: `Restarting container for ${domain}...`,
      success: `Container for ${domain} restarted and healthy.`,
      error: "Failed to restart container",
    });
  };

  const handleAddEnvironmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvDomain.trim() || !addEnvTargetGroup) {
      toast.error("Please provide a valid domain");
      return;
    }

    const platformIcons: Record<string, typeof siNextdotjs> = {
      "Next.js": siNextdotjs,
      React: siReact,
      Remix: siRemix,
      "Node.js": siNodedotjs,
    };

    const newRow: InfrastructureEnvironment = {
      domain: newEnvDomain.trim(),
      platform: {
        name: newEnvPlatform,
        icon: platformIcons[newEnvPlatform] || siNextdotjs,
      },
      environment: newEnvStage,
      status: "Online",
      latency: "42ms",
      uptime: "1d 0h",
      server: newEnvServer,
      countryCode: newEnvCountry.toUpperCase(),
      plan: `${newEnvServer} Standard`,
      resources: { cpu: 18, ram: 34, disk: 22 },
    };

    setGroups((prev) =>
      prev.map((g) => {
        if (g.name === addEnvTargetGroup) {
          return {
            ...g,
            rows: [newRow, ...g.rows],
          };
        }
        return g;
      }),
    );

    toast.success(`Environment ${newEnvDomain} added to ${addEnvTargetGroup}`);
    setAddEnvTargetGroup(null);
    setNewEnvDomain("");
  };

  // Filter groups and rows
  const filteredGroups = React.useMemo(() => {
    return groups
      .map((group) => {
        // Match org filter
        if (selectedOrg !== "all" && group.organization.toLowerCase() !== selectedOrg.toLowerCase()) {
          return null;
        }

        let rows = group.rows.filter((row) => {
          // Search query
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
              row.domain.toLowerCase().includes(q) ||
              row.server.toLowerCase().includes(q) ||
              group.name.toLowerCase().includes(q) ||
              group.organization.toLowerCase().includes(q);
            if (!matchesSearch) return false;
          }

          // Stack filter
          if (selectedStack !== "all" && row.platform.name.toLowerCase() !== selectedStack.toLowerCase()) {
            return false;
          }

          // Cloud filter
          if (selectedCloud !== "all" && !row.server.toLowerCase().includes(selectedCloud.toLowerCase())) {
            return false;
          }

          // Environment filter
          if (selectedEnv !== "all" && row.environment.toLowerCase() !== selectedEnv.toLowerCase()) {
            return false;
          }

          return true;
        });

        if (sortAsc !== null) {
          rows = [...rows].sort((a, b) => {
            const cmp = a.domain.localeCompare(b.domain);
            return sortAsc ? cmp : -cmp;
          });
        }

        // If search query or filters are active, and group has no matching rows and group name doesn't match, filter it out
        const hasFilters =
          searchQuery.trim() !== "" ||
          selectedOrg !== "all" ||
          selectedStack !== "all" ||
          selectedCloud !== "all" ||
          selectedEnv !== "all";

        if (hasFilters && rows.length === 0) {
          const groupMatches =
            searchQuery.trim() &&
            (group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              group.organization.toLowerCase().includes(searchQuery.toLowerCase()));
          if (!groupMatches) return null;
        }

        return {
          ...group,
          rows,
        };
      })
      .filter((g): g is InfrastructureGroup => g !== null);
  }, [groups, searchQuery, selectedOrg, selectedStack, selectedCloud, selectedEnv, sortAsc]);

  const activeFiltersCount =
    (selectedOrg !== "all" ? 1 : 0) +
    (selectedStack !== "all" ? 1 : 0) +
    (selectedCloud !== "all" ? 1 : 0) +
    (selectedEnv !== "all" ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedOrg("all");
    setSelectedStack("all");
    setSelectedCloud("all");
    setSelectedEnv("all");
    setSearchQuery("");
    toast.info("All filters cleared");
  };

  const handleToggleSort = () => {
    setSortAsc((prev) => {
      if (prev === null) return true;
      if (prev === true) return false;
      return null;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <InfrastructureHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedOrg={selectedOrg}
        onSelectOrg={setSelectedOrg}
        selectedStack={selectedStack}
        onSelectStack={setSelectedStack}
        selectedCloud={selectedCloud}
        onSelectCloud={setSelectedCloud}
        selectedEnv={selectedEnv}
        onSelectEnv={setSelectedEnv}
        activeFiltersCount={activeFiltersCount}
        onResetFilters={handleResetFilters}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex flex-col gap-4">
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group) => (
            <ProjectEnvironments
              key={group.name}
              group={group}
              onAddEnvironment={(groupName) => setAddEnvTargetGroup(groupName)}
              onRestartRow={handleRestartRow}
              sortAsc={sortAsc}
              onToggleSort={handleToggleSort}
            />
          ))
        ) : (
          <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
            <p className="text-base font-medium">No matching projects or environments found</p>
            <p className="text-sm">Try relaxing your search query or filters.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleResetFilters}>
              Reset filters
            </Button>
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Infrastructure Settings</DialogTitle>
            <DialogDescription>
              Configure global monitoring thresholds, metric polling frequency, and alert channels.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Auto-remediation</span>
                <span className="text-xs text-muted-foreground">Automatically reboot unhealthy worker nodes</span>
              </div>
              <Button
                variant={autoRemediation ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRemediation(!autoRemediation)}
              >
                {autoRemediation ? "Enabled" : "Disabled"}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Sample Polling Rate</span>
                <span className="text-xs text-muted-foreground">Edge telemetry collection interval</span>
              </div>
              <Select value={sampleRate} onValueChange={setSampleRate}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5s">5 seconds</SelectItem>
                  <SelectItem value="10s">10 seconds</SelectItem>
                  <SelectItem value="30s">30 seconds</SelectItem>
                  <SelectItem value="60s">1 minute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsSettingsOpen(false);
                toast.success("Infrastructure configuration saved");
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Environment Dialog */}
      <Dialog open={Boolean(addEnvTargetGroup)} onOpenChange={(open) => !open && setAddEnvTargetGroup(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddEnvironmentSubmit}>
            <DialogHeader>
              <DialogTitle>Add Environment</DialogTitle>
              <DialogDescription>
                Deploy a new environment to project <strong>{addEnvTargetGroup}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="env-domain">Domain</Label>
                <Input
                  id="env-domain"
                  placeholder="e.g. preview-pr14.app.domain.com"
                  value={newEnvDomain}
                  onChange={(e) => setNewEnvDomain(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Platform</Label>
                  <Select value={newEnvPlatform} onValueChange={setNewEnvPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Next.js">Next.js</SelectItem>
                      <SelectItem value="React">React</SelectItem>
                      <SelectItem value="Remix">Remix</SelectItem>
                      <SelectItem value="Node.js">Node.js</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Stage</Label>
                  <Select
                    value={newEnvStage}
                    onValueChange={(v) => setNewEnvStage(v as "Production" | "Staging" | "Expired")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Production">Production</SelectItem>
                      <SelectItem value="Staging">Staging</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Cloud Server</Label>
                  <Select value={newEnvServer} onValueChange={setNewEnvServer}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AWS">AWS</SelectItem>
                      <SelectItem value="Azure">Azure</SelectItem>
                      <SelectItem value="Hetzner Cloud">Hetzner Cloud</SelectItem>
                      <SelectItem value="Bare Metal / Custom">Bare Metal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="env-country">Region Country Code</Label>
                  <Input
                    id="env-country"
                    placeholder="US, DE, NL, EE..."
                    maxLength={2}
                    value={newEnvCountry}
                    onChange={(e) => setNewEnvCountry(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddEnvTargetGroup(null)}>
                Cancel
              </Button>
              <Button type="submit">Deploy Environment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
