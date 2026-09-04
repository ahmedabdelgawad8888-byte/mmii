"use client";

import * as React from "react";

import { useCalendarController } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import multiMonthPlugin from "@fullcalendar/react/multimonth";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { differenceInCalendarDays, endOfMonth, format, startOfMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, XIcon } from "lucide-react";
import { toast } from "sonner";

import { EventCalendarViews } from "@/components/calendar/event-calendar-views";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { demoEvents } from "./events-data";

type CalendarEvent = {
  id?: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  calendar?: string;
  groupId?: string;
  display?: string;
};

const views = [
  { key: "dayGridMonth", label: "Month" },
  { key: "timeGridWeek", label: "Week" },
  { key: "timeGridDay", label: "Day" },
];

const calendars = [
  { key: "all", label: "All calendars" },
  { key: "work", label: "Work" },
  { key: "personal", label: "Personal" },
  { key: "team", label: "Team" },
  { key: "focus", label: "Focus time" },
];

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin];

export function Calendar() {
  const controller = useCalendarController();
  const [events, setEvents] = React.useState<CalendarEvent[]>(demoEvents);
  const [eventCount, setEventCount] = React.useState(0);
  const [selectedCalendar, setSelectedCalendar] = React.useState(calendars[0].key);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newDate, setNewDate] = React.useState(format(new Date(), "yyyy-MM-dd"));
  const [newTime, setNewTime] = React.useState("10:00");
  const [isAllDay, setIsAllDay] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState("work");

  const [dateInfo, setDateInfo] = React.useState(() => {
    const now = new Date();

    return {
      title: format(now, "MMMM yyyy"),
      days: differenceInCalendarDays(endOfMonth(now), startOfMonth(now)) + 1,
    };
  });
  const title = dateInfo.title;
  const days = dateInfo.days;

  const filteredEvents = React.useMemo(() => {
    if (selectedCalendar === "all") return events;
    return events.filter((event) => event.calendar === selectedCalendar);
  }, [events, selectedCalendar]);

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    const startDateTime = isAllDay ? newDate : new Date(`${newDate}T${newTime}:00`);

    const newEvent = {
      id: `evt-${Date.now()}`,
      title: newTitle.trim(),
      start: startDateTime,
      allDay: isAllDay,
      calendar: newCategory,
    };

    setEvents((prev) => [...prev, newEvent]);
    setIsAddOpen(false);
    setNewTitle("");
    toast.success(`Event "${newEvent.title}" scheduled for ${format(new Date(newEvent.start), "MMM d, yyyy")}`);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-md border">
      <div className="flex flex-col gap-4 border-b bg-sidebar p-4 text-sidebar-foreground lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 shrink-0 flex-col gap-1">
          <div className="font-medium text-lg leading-none">{title}</div>
          <p className="text-muted-foreground text-sm">
            {days} days - {eventCount} events
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedCalendar}
            onValueChange={(val) => {
              setSelectedCalendar(val);
              toast.info(`Switched view to ${calendars.find((c) => c.key === val)?.label}`);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <CalendarIcon />
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                {calendars.map((calendar) => (
                  <SelectItem key={calendar.key} value={calendar.key}>
                    {calendar.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <ButtonGroup>
            <Button size="icon" variant="outline" onClick={() => controller.prev()}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" onClick={() => controller.today()}>
              Today
            </Button>
            <Button size="icon" variant="outline" onClick={() => controller.next()}>
              <ChevronRight />
            </Button>
          </ButtonGroup>
          <Select
            value={controller.view?.type ?? views[0].key}
            onValueChange={(value) => {
              controller.changeView(value);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                {views.map((v) => (
                  <SelectItem key={v.key} value={v.key}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus />
            Add event
          </Button>
        </div>
      </div>

      <EventCalendarViews
        controller={controller}
        initialView={views[0].key}
        plugins={[...plugins]}
        popoverCloseContent={() => <XIcon className="size-5 text-muted-foreground group-hover:text-foreground" />}
        events={filteredEvents}
        nowIndicator
        eventClick={(info) => {
          toast.info(`Event: ${info.event.title}`, {
            description: info.event.start ? format(info.event.start, "EEEE, MMMM d, yyyy h:mm a") : undefined,
          });
        }}
        datesSet={(info) => {
          setDateInfo({
            title: info.view.title,
            days: differenceInCalendarDays(info.view.currentEnd, info.view.currentStart),
          });
          setEventCount(
            filteredEvents.filter((event) => {
              const start = new Date(event.start);
              return start >= info.start && start < info.end;
            }).length,
          );
        }}
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
            <DialogDescription>Schedule a new meeting, reminder, or focus block.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEvent} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="evt-title">Event Title</Label>
              <Input
                id="evt-title"
                placeholder="e.g. Q3 Roadmap Review"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="evt-date">Date</Label>
                <Input
                  id="evt-date"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
              </div>

              {!isAllDay && (
                <div className="space-y-1.5">
                  <Label htmlFor="evt-time">Time</Label>
                  <Input id="evt-time" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="all-day" className="font-medium text-sm">
                  All Day Event
                </Label>
                <p className="text-muted-foreground text-xs">Does not require a specific start or end hour</p>
              </div>
              <Switch id="all-day" checked={isAllDay} onCheckedChange={setIsAllDay} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="evt-category">Calendar</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger id="evt-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="focus">Focus time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
