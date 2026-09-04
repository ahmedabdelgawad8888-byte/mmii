"use client";

import Link from "next/link";

import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const scheduleItems = [
  {
    time: "08:00 - 08:45",
    subject: "Pure Mathematics",
    details: "Grade 11A • Room 2.14",
    status: "In Progress",
    statusVariant: "in-progress" as const,
    students: 28,
  },
  {
    time: "09:00 - 09:45",
    subject: "English Literature",
    details: "Grade 11B • Seminar Room 3",
    status: "Upcoming",
    statusVariant: "upcoming" as const,
    students: 24,
  },
  {
    time: "10:00 - 10:45",
    subject: "Physics",
    details: "Grade 11C • Physics Lab",
    status: "Upcoming",
    statusVariant: "upcoming" as const,
    students: 26,
  },
  {
    time: "11:00 - 11:45",
    subject: "Modern European History",
    details: "Grade 11A • Room 1.08",
    status: "Cancelled",
    statusVariant: "cancelled" as const,
    students: 25,
  },
  {
    time: "12:00 - 12:45",
    subject: "Computer Science",
    details: "Grade 11B • Computing Lab",
    status: "Upcoming",
    statusVariant: "upcoming" as const,
    students: 22,
  },
];

export function ClassSchedule() {
  const today = format(new Date(), "EEEE, d MMMM");

  const handleSelectClass = (item: (typeof scheduleItems)[number]) => {
    toast.info(`${item.subject} (${item.time})`, {
      description: `${item.details} · ${item.students} enrolled students · Status: ${item.status}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Class Schedule</CardTitle>
        <CardAction>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
          >
            <Link href="/dashboard/calendar">
              View Full Schedule <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-0">
        <div className="flex flex-col divide-y divide-border">
          {scheduleItems.map((item) => (
            <button
              key={item.time}
              type="button"
              className="grid w-full grid-cols-1 gap-3 bg-card py-3 text-left transition-colors hover:bg-muted/40 sm:grid-cols-[10rem_1fr_auto] sm:items-center"
              onClick={() => handleSelectClass(item)}
            >
              <div className="flex gap-2">
                <div className={`w-1 shrink-0 rounded-md ${getStatusIndicatorColor(item.statusVariant)}`} />
                <div className="text-nowrap text-xs">
                  <div className="font-medium text-foreground">{item.time}</div>
                  <div className="text-muted-foreground">{today}</div>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-1">
                <div className="truncate font-medium text-foreground text-sm leading-none">{item.subject}</div>
                <div className="truncate text-muted-foreground text-xs leading-none">{item.details}</div>
              </div>

              <Badge
                variant="secondary"
                className={`shrink-0 rounded-md px-2.5 py-1 font-medium text-[10px] ${getStatusBadgeStyle(item.statusVariant)}`}
              >
                {item.status}
              </Badge>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusIndicatorColor(variant: string) {
  if (variant === "in-progress") return "bg-green-600 dark:bg-green-400";
  if (variant === "cancelled") return "bg-destructive";
  return "bg-yellow-500 dark:bg-yellow-400";
}

function getStatusBadgeStyle(variant: string) {
  if (variant === "in-progress") {
    return "border-green-600/50 bg-green-50 text-green-600 dark:border-green-800/50 dark:bg-green-500/10 dark:text-green-400";
  }
  if (variant === "cancelled") {
    return "border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/20";
  }
  return "border-yellow-600/50 bg-yellow-50 text-yellow-700 dark:border-yellow-800/50 dark:bg-yellow-500/10 dark:text-yellow-300";
}
