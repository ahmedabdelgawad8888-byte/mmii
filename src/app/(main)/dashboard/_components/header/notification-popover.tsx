"use client";

import * as React from "react";

import Link from "next/link";

import { Bell, CheckCheck, FileText, HeartPulse, Package, Receipt, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "invoice" | "task" | "health" | "logistics";
  url: string;
}

const initialNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "New invoice generated",
    description: "Invoice #INV-2024-001 for Acme Corp was sent ($1,250.00)",
    time: "5m ago",
    read: false,
    type: "invoice",
    url: "/dashboard/invoice",
  },
  {
    id: "notif-2",
    title: "Shipment in transit",
    description: "Container #SHP-9921 arrived at San Francisco hub",
    time: "24m ago",
    read: false,
    type: "logistics",
    url: "/dashboard/logistics",
  },
  {
    id: "notif-3",
    title: "Patient telemetry alert",
    description: "Bed 04: Heart rate normalized to 78 bpm",
    time: "1h ago",
    read: false,
    type: "health",
    url: "/dashboard/patient-monitoring",
  },
  {
    id: "notif-4",
    title: "Task completed",
    description: "Sarah finalized 'Q2 Product Roadmap' specifications",
    time: "3h ago",
    read: true,
    type: "task",
    url: "/dashboard/tasks",
  },
];

const typeIcons = {
  invoice: Receipt,
  logistics: Package,
  health: HeartPulse,
  task: FileText,
};

export function NotificationPopover() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(initialNotifications);
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filter === "all" ? notifications : notifications.filter((n) => !n.read);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96" sideOffset={8}>
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0.5 font-normal text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-muted-foreground text-xs hover:text-foreground"
              onClick={markAllAsRead}
            >
              <CheckCheck className="mr-1 size-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="px-4 pb-2">
          <Tabs value={filter} onValueChange={(val) => setFilter(val as "all" | "unread")}>
            <TabsList className="grid h-8 w-full grid-cols-2">
              <TabsTrigger value="all" className="text-xs">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Unread ({unreadCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Separator />

        <ScrollArea className="h-72">
          {filteredNotifications.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center p-4 text-center text-muted-foreground">
              <Bell className="mb-2 size-8 stroke-1 opacity-40" />
              <p className="text-sm">No {filter === "unread" ? "unread " : ""}notifications</p>
              <p className="text-xs">You are all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notif) => {
                const Icon = typeIcons[notif.type];
                return (
                  <Link
                    key={notif.id}
                    href={notif.url}
                    onClick={() => {
                      markAsRead(notif.id);
                      setOpen(false);
                    }}
                    className={`flex items-start gap-3 p-3 transition-colors hover:bg-muted/50 ${
                      !notif.read ? "bg-muted/20" : ""
                    }`}
                  >
                    <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="size-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs ${!notif.read ? "font-semibold text-foreground" : "font-medium"}`}>
                          {notif.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{notif.time}</span>
                      </div>
                      <p className="line-clamp-2 text-muted-foreground text-xs">{notif.description}</p>
                    </div>
                    {!notif.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground text-xs hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="mr-1 size-3.5" />
                Clear all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
