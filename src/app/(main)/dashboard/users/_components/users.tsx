"use client";
import * as React from "react";

import {
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type PaginationState,
  type SortingState,
  useTable,
} from "@tanstack/react-table";
import { Cog, Download, Grid, Mail, Plus, Rows3, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Kbd } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dataTableFeatures } from "@/lib/data-table-features";
import { getInitials } from "@/lib/utils";

import { filters, type UserRow, type UserStatus, type UserTeam } from "./data";
import { usersColumns } from "./users-columns";
import { UsersTable } from "./users-table";

function getUserBadgeVariant(status: UserStatus): "default" | "outline" | "secondary" {
  if (status === "Active") return "default";
  if (status === "Pending invite") return "outline";
  return "secondary";
}

export function Users({ users }: { users: UserRow[] }) {
  const [userList, setUserList] = React.useState<UserRow[]>(users);
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "joinedDate", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({
    search: false,
    team: false,
  });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");
  const [showFilters, setShowFilters] = React.useState(true);

  // Invite user dialog state
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [newRole, setNewRole] = React.useState("Member");
  const [newTeam, setNewTeam] = React.useState<UserTeam>("Platform");

  const table = useTable({
    features: dataTableFeatures,
    data: userList,
    columns: usersColumns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.email,
    autoResetPageIndex: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });

  const searchQuery = (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";
  const roleFilter = (table.getColumn("role")?.getFilterValue() as string | undefined) ?? filters.role[0];
  const teamFilter = (table.getColumn("team")?.getFilterValue() as string | undefined) ?? filters.team[0];
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? filters.status[0];
  const workspaceFilter =
    (table.getColumn("workspace")?.getFilterValue() as string | undefined) ?? filters.workspace[0];
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  function setColumnSelectFilter(columnId: string, value: string) {
    table.getColumn(columnId)?.setFilterValue(value === "All" ? undefined : value);
    table.setPageIndex(0);
  }

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim()) {
      toast.error("Please provide both name and email");
      return;
    }

    const newUser: UserRow = {
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      team: newTeam,
      workspace: ["Default"],
      status: "Pending invite",
      joinedDate: "Just now",
      lastActive: 0,
    };

    setUserList((prev) => [newUser, ...prev]);
    setIsInviteOpen(false);
    setNewName("");
    setNewEmail("");
    toast.success(`Invitation sent to ${newUser.email}`);
  };

  const handleExport = () => {
    toast.success(`Exporting ${userList.length} users to CSV format`);
  };

  const filteredUsersForGrid = React.useMemo(() => {
    return userList.filter((u) => {
      const matchesSearch =
        !searchQuery.trim() ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      const matchesTeam = teamFilter === "All" || u.team === teamFilter;
      const matchesStatus = statusFilter === "All" || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesTeam && matchesStatus;
    });
  }, [userList, searchQuery, roleFilter, teamFilter, statusFilter]);

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Users</CardTitle>
        <CardDescription className="max-w-sm leading-snug">
          Manage your organization members and their access.
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <InputGroup className="h-7 w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(event) => {
                table.getColumn("search")?.setFilterValue(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
            <InputGroupAddon align="inline-end">
              <Kbd className="h-4 text-[10px]">⌘K</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <SlidersHorizontal /> {showFilters ? "Filters" : "Show Filters"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Customizing table columns and sorting preferences")}
          >
            <Cog /> Customize
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download /> Export
          </Button>
          <Button size="sm" onClick={() => setIsInviteOpen(true)}>
            <Plus /> Add User
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        {showFilters && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={roleFilter} onValueChange={(value) => setColumnSelectFilter("role", value)}>
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">Role:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectGroup>
                    {filters.role.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={teamFilter} onValueChange={(value) => setColumnSelectFilter("team", value)}>
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">Team:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectGroup>
                    {filters.team.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value) => setColumnSelectFilter("status", value)}>
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">Status:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectGroup>
                    {filters.status.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Select value={workspaceFilter} onValueChange={(value) => setColumnSelectFilter("workspace", value)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Workspace:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                <SelectGroup>
                  {filters.workspace.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 px-4">
          <div className="text-muted-foreground text-sm tabular-nums">
            {selectedCount} selected • {filteredUsersForGrid.length} total users
          </div>

          <Tabs value={viewMode} onValueChange={(val) => setViewMode(val as "list" | "grid")}>
            <TabsList>
              <TabsTrigger value="list" aria-label="List view">
                <Rows3 />
              </TabsTrigger>
              <TabsTrigger value="grid" aria-label="Grid view">
                <Grid />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {viewMode === "list" ? (
          <UsersTable table={table} />
        ) : (
          <div className="grid gap-4 px-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {filteredUsersForGrid.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                No users matched the criteria.
              </div>
            ) : (
              filteredUsersForGrid.map((user) => (
                <div key={user.email} className="flex flex-col justify-between rounded-xl border bg-card p-4 shadow-xs">
                  <div>
                    <div className="flex items-start justify-between">
                      <Avatar className="size-10">
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <Badge variant={getUserBadgeVariant(user.status)} className="text-xs">
                        {user.status}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-semibold text-sm leading-none">{user.name}</h3>
                    <p className="mt-1 line-clamp-1 text-muted-foreground text-xs">{user.email}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-[11px]">{user.role}</span>
                      <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {user.team}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-3 text-muted-foreground text-xs">
                    <span>Joined {user.joinedDate}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => toast.info(`Viewing details for ${user.name}`)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>

      {/* Invite User Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>Send an invitation email to add a teammate to your workspace.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteUser} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="usr-name">Full Name</Label>
              <Input
                id="usr-name"
                placeholder="e.g. Jordan Hayes"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="usr-email">Email Address</Label>
              <Input
                id="usr-email"
                type="email"
                placeholder="jordan@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="usr-role">Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger id="usr-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                    <SelectItem value="Guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="usr-team">Team</Label>
                <Select value={newTeam} onValueChange={(val) => setNewTeam(val as UserTeam)}>
                  <SelectTrigger id="usr-team">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Platform">Platform</SelectItem>
                    <SelectItem value="Growth">Growth</SelectItem>
                    <SelectItem value="Revenue">Revenue</SelectItem>
                    <SelectItem value="Customer Ops">Customer Ops</SelectItem>
                    <SelectItem value="Internal Tools">Internal Tools</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="People Ops">People Ops</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Mail className="size-4" data-icon="inline-start" />
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
