"use client";
import { useRef, useState } from "react";

import { type ColumnFiltersState, type PaginationState, useTable } from "@tanstack/react-table";
import { AlertTriangle, ChevronRight, Download, FileUp, KeyRound, Plus, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dataTableFeatures } from "@/lib/data-table-features";

import { rolesColumns } from "./roles-table/columns";
import type { Role } from "./roles-table/data";
import { RolesTable } from "./roles-table/table";

function getRoleTypeFilter(groupFilter: string) {
  if (groupFilter === "System roles") {
    return "System";
  }

  if (groupFilter === "Custom roles") {
    return "Custom";
  }

  return "All";
}

function getRoleGroupFilterValue(typeFilter: string) {
  if (typeFilter === "System") {
    return "System roles";
  }

  if (typeFilter === "Custom") {
    return "Custom roles";
  }

  return undefined;
}

export function Roles({ roles }: { roles: Role[] }) {
  const [roleList, setRoleList] = useState<Role[]>(roles);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  });

  // Create role dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleType, setNewRoleType] = useState<"Custom" | "System">("Custom");
  const [newRoleOwner, setNewRoleOwner] = useState("Alex Kim");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const table = useTable({
    features: dataTableFeatures,
    data: roleList,
    columns: rolesColumns,
    defaultColumn: {
      size: 140,
      minSize: 80,
      maxSize: 420,
    },
    state: { columnFilters, pagination },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    initialState: {
      columnVisibility: { group: false, search: false },
    },
  });

  const search = (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";
  const groupFilter = (table.getColumn("group")?.getFilterValue() as string | undefined) ?? "";
  const typeFilter = getRoleTypeFilter(groupFilter);
  const ownerFilter = (table.getColumn("owner")?.getFilterValue() as string | undefined) ?? "All";
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "All";

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const importedRole: Role = {
      role: "Compliance Auditor",
      group: "Custom roles",
      accessLevel: "Scoped",
      users: 2,
      permissionSets: ["Audit Logs", "Reports"],
      lastReview: "Just now",
      owner: "System",
      status: "Active",
    };

    setRoleList((prev) => [importedRole, ...prev]);
    toast.success(`Imported role "${importedRole.role}" from ${file.name}`);
    e.target.value = "";
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.error("Role name cannot be empty");
      return;
    }

    const created: Role = {
      role: newRoleName.trim(),
      group: newRoleType === "System" ? "System roles" : "Custom roles",
      accessLevel: "Scoped",
      users: 1,
      permissionSets: ["Users", "Reports"],
      lastReview: "Just now",
      owner: newRoleOwner,
      status: "Active",
    };

    setRoleList((prev) => [created, ...prev]);
    setIsCreateOpen(false);
    setNewRoleName("");
    setNewRoleDesc("");
    toast.success(`Role "${created.role}" created successfully`);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Hidden JSON input */}
      <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleImportJSON} />

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground text-sm">Manage access roles and permissions across your organization.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <FileUp data-icon="inline-start" />
            Import JSON
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            Create role
          </Button>
        </div>
      </div>

      <Tabs className="h-full gap-4" defaultValue="roles">
        <TabsList
          variant="line"
          className="w-full justify-start gap-2 border-b ps-0 *:data-[slot=tabs-trigger]:flex-none"
        >
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permission-sets">Permission sets</TabsTrigger>
          <TabsTrigger value="access-reviews">Access reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <div className="flex flex-col gap-4">
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
              <AlertTriangle className="size-4" />
              <AlertTitle>Review required</AlertTitle>
              <AlertDescription>3 roles have unreviewed permission changes.</AlertDescription>
              <AlertAction>
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => {
                    table.getColumn("status")?.setFilterValue("Needs review");
                    toast.info("Filtered to roles needing review");
                  }}
                >
                  Review changes
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </AlertAction>
            </Alert>

            <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
              <div className="flex flex-col items-stretch gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <InputGroup className="h-7 w-full rounded-md sm:w-82">
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    className="h-7"
                    placeholder="Search roles..."
                    value={search}
                    onChange={(e) => {
                      table.getColumn("search")?.setFilterValue(e.target.value || undefined);
                      table.setPageIndex(0);
                    }}
                  />
                </InputGroup>

                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={typeFilter}
                    onValueChange={(v) => {
                      table.getColumn("group")?.setFilterValue(getRoleGroupFilterValue(v));
                      table.setPageIndex(0);
                    }}
                  >
                    <SelectTrigger size="sm">
                      <span className="text-muted-foreground">Type:</span>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start">
                      <SelectGroup>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="System">System</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select
                    value={ownerFilter}
                    onValueChange={(v) => {
                      table.getColumn("owner")?.setFilterValue(v === "All" ? undefined : v);
                      table.setPageIndex(0);
                    }}
                  >
                    <SelectTrigger size="sm">
                      <span className="text-muted-foreground">Owner:</span>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start">
                      <SelectGroup>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="System">System</SelectItem>
                        <SelectItem value="Jane Doe">Jane Doe</SelectItem>
                        <SelectItem value="Alex Kim">Alex Kim</SelectItem>
                        <SelectItem value="Chris Lee">Chris Lee</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      table.getColumn("status")?.setFilterValue(v === "All" ? undefined : v);
                      table.setPageIndex(0);
                    }}
                  >
                    <SelectTrigger size="sm">
                      <span className="text-muted-foreground">Status:</span>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start">
                      <SelectGroup>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Needs review">Needs review</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <RolesTable table={table} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="permission-sets" className="mt-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Security & IAM Admin",
                desc: "Manage user authentication policies, SSO saml, and audit access logs",
                perms: 18,
                users: 4,
              },
              {
                title: "Financial Controller",
                desc: "Create invoices, reconcile payments, export transaction batches, and modify payout bank accounts",
                perms: 12,
                users: 6,
              },
              {
                title: "Infrastructure Operator",
                desc: "Trigger deployment pipelines, view cluster health, and rotate API secrets",
                perms: 15,
                users: 9,
              },
              {
                title: "Support Escalation Tier 2",
                desc: "Impersonate customer sessions for debugging and issue refunds under $500",
                perms: 8,
                users: 14,
              },
              {
                title: "Read-Only Compliance Auditor",
                desc: "Export read-only system snapshots, compliance evidence, and access registers",
                perms: 5,
                users: 3,
              },
              {
                title: "Product Marketing Specialist",
                desc: "Publish changelogs, manage onboarding tours, and view conversion telemetry",
                perms: 7,
                users: 8,
              },
            ].map((set) => (
              <div key={set.title} className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="size-4 text-primary" />
                      <h3 className="font-semibold text-sm">{set.title}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {set.perms} permissions
                    </Badge>
                  </div>
                  <p className="mt-2 text-muted-foreground text-xs">{set.desc}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-muted-foreground text-xs">
                  <span>{set.users} assigned users</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => toast.success(`Opened permission editor for ${set.title}`)}
                  >
                    Edit Set
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="access-reviews" className="mt-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">Active Access Review Campaigns</h3>
              <p className="text-muted-foreground text-xs">
                Verify continuous privilege compliance across your organization
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.success("Exporting ISO-27001 / SOC-2 audit bundle...")}
            >
              <Download data-icon="inline-start" className="size-4" />
              Download Audit Report
            </Button>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Q3 SOC-2 Privileged Access Audit",
                status: "In Progress",
                due: "5 days remaining",
                flagged: "2 elevated accounts need re-certification",
              },
              {
                title: "Inactive Service Account Cleanup",
                status: "Needs Action",
                due: "Overdue by 2 days",
                flagged: "4 API tokens inactive for >90 days",
              },
              {
                title: "Third-Party OAuth App Permissions Review",
                status: "Completed",
                due: "Completed yesterday",
                flagged: "0 anomalous scopes found",
              },
            ].map((review) => (
              <div
                key={review.title}
                className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <span className="font-medium text-sm">{review.title}</span>
                    <Badge variant={review.status === "Completed" ? "default" : "secondary"}>{review.status}</Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {review.flagged} • {review.due}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast.info(`Viewing details for ${review.title}`)}>
                    Details
                  </Button>
                  <Button size="sm" onClick={() => toast.success(`Audit passed: Certified ${review.title}`)}>
                    Approve Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>Define a custom permission role and assign default policies.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRole} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="e.g. Lead SRE / Cloud Architect"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                placeholder="Role responsibilities and scope..."
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="role-type">Type</Label>
                <Select value={newRoleType} onValueChange={(val) => setNewRoleType(val as "Custom" | "System")}>
                  <SelectTrigger id="role-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Custom">Custom</SelectItem>
                    <SelectItem value="System">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role-owner">Role Owner</Label>
                <Select value={newRoleOwner} onValueChange={setNewRoleOwner}>
                  <SelectTrigger id="role-owner">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alex Kim">Alex Kim</SelectItem>
                    <SelectItem value="Jane Doe">Jane Doe</SelectItem>
                    <SelectItem value="Chris Lee">Chris Lee</SelectItem>
                    <SelectItem value="System">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
