"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DataTableFeatures } from "@/lib/data-table-features";

import type { Role } from "./data";

export const rolesColumns: ColumnDef<DataTableFeatures, Role>[] = [
  {
    id: "group",
    accessorKey: "group",
    filterFn: "equalsString",
    enableHiding: true,
  },
  {
    id: "search",
    accessorFn: (row) => [row.role, row.owner, ...row.permissionSets].join(" "),
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    id: "role",
    accessorKey: "role",
    header: "Role",
    size: 180,
    minSize: 180,
    cell: ({ row }) => <span className="font-medium text-sm">{row.original.role}</span>,
  },
  {
    id: "accessLevel",
    accessorKey: "accessLevel",
    header: "Access level",
    size: 120,
    cell: ({ row }) => (
      <Badge className="rounded-sm" variant="outline">
        {row.original.accessLevel}
      </Badge>
    ),
  },
  {
    id: "users",
    accessorKey: "users",
    header: "Users",
    size: 70,
    cell: ({ row }) => <span className="text-sm">{row.original.users}</span>,
  },
  {
    id: "permissionSets",
    accessorFn: (row) => row.permissionSets.join(" "),
    header: "Permission sets",
    size: 310,
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center justify-start gap-2">
        {row.original.permissionSets.slice(0, 3).map((set) => (
          <Badge className="rounded-sm" variant="outline" key={set}>
            {set}
          </Badge>
        ))}
        {row.original.permissionSets.length > 3 ? (
          <span className="text-sm tabular-nums">+{row.original.permissionSets.length - 3}</span>
        ) : null}
      </div>
    ),
  },
  {
    id: "lastReview",
    accessorKey: "lastReview",
    header: "Last review",
    size: 120,
    cell: ({ row }) => <span className="text-sm">{row.original.lastReview}</span>,
  },
  {
    id: "owner",
    accessorKey: "owner",
    header: "Owner",
    size: 110,
    filterFn: "equalsString",
    cell: ({ row }) => <span className="text-sm">{row.original.owner}</span>,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    size: 130,
    filterFn: "equalsString",
    cell: ({ row }) => (
      <Badge className="rounded-sm" variant="outline">
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "",
    size: 70,
    cell: ({ row }) => {
      const isSystemRole = row.original.group === "System roles";
      const needsReview = row.original.status === "Needs review";

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="end">
            <DropdownMenuGroup>
              {needsReview ? (
                <DropdownMenuItem onClick={() => toast.info(`Reviewing changes for ${row.original.role}`)}>
                  Review changes
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                onClick={() => toast.info(`Role details: ${row.original.role} (${row.original.users} members)`)}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isSystemRole}
                onClick={() => toast.info(`Editing permissions for ${row.original.role}`)}
              >
                Edit role
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isSystemRole}
                onClick={() => toast.success(`Duplicated role "${row.original.role} (Copy)"`)}
              >
                Duplicate role
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => toast.info(`Permission matrix opened for ${row.original.role}`)}>
                Review permissions
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.info(`Managing ${row.original.users} members assigned to ${row.original.role}`)}
              >
                Manage members
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={isSystemRole}
                variant="destructive"
                onClick={() =>
                  toast.success(`Archived role ${row.original.role}`, {
                    action: {
                      label: "Undo",
                      onClick: () => toast.info(`Restored ${row.original.role}`),
                    },
                  })
                }
              >
                Archive role
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableColumnFilter: false,
  },
];
