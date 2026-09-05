"use client";

import { AlertTriangle, Check, Clock3 } from "lucide-react";

import { useCompanies } from "@/app/(main)/dashboard/companies/_components/companies-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Page() {
  const { activationCampaigns, companies, completeWork, influencers, operationsQueue, reassignWork, team } =
    useCompanies();
  const open = operationsQueue.filter((item) => item.status !== "Completed");
  const overdue = open.filter((item) => new Date(item.deadline).getTime() < Date.now());
  const owners = team.filter((item) => item.active);
  const workload = owners.map((owner) => ({ owner, count: open.filter((item) => item.owner === owner.name).length }));
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <p className="font-medium text-muted-foreground text-sm">Operations</p>
        <h1 className="font-semibold text-2xl tracking-tight">Queue Command Center</h1>
        <p className="text-muted-foreground text-sm">
          Assign, rebalance, escalate, and complete execution work by SLA.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Open queue</CardDescription>
            <CardTitle className="text-2xl">{open.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              Across onboarding, coordination, WhatsApp, visits, Posting Coverage, and QA
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Overdue</CardDescription>
            <CardTitle className="text-2xl">{overdue.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Past deadline and requires escalation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Blocked</CardDescription>
            <CardTitle className="text-2xl">{open.filter((item) => item.status === "Blocked").length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">Waiting on a dependency</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Operations queue</CardTitle>
            <CardDescription>
              Every item shows its relationship, owner, age, SLA, deadline, and next action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Queue / priority</TableHead>
                    <TableHead>Client / campaign</TableHead>
                    <TableHead>Influencer</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Age / SLA</TableHead>
                    <TableHead>Next action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Complete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operationsQueue.map((item) => {
                    const age = Math.max(0, Math.round((Date.now() - new Date(item.createdAt).getTime()) / 3600000));
                    const isOverdue = new Date(item.deadline).getTime() < Date.now() && item.status !== "Completed";
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{item.queue}</span>
                            <Badge
                              variant={
                                item.priority === "Critical" || item.priority === "High" ? "destructive" : "outline"
                              }
                            >
                              {item.priority}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p>{companies.find((entry) => entry.id === item.companyId)?.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {activationCampaigns.find((entry) => entry.id === item.campaignId)?.name}
                          </p>
                        </TableCell>
                        <TableCell>
                          {influencers.find((entry) => entry.id === item.influencerId)?.handle ?? "Campaign level"}
                        </TableCell>
                        <TableCell>
                          <Select value={item.owner} onValueChange={(value) => reassignWork(item.id, value)}>
                            <SelectTrigger className="w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {owners.map((owner) => (
                                  <SelectItem key={owner.id} value={owner.name}>
                                    {owner.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>
                              {age}h / {item.slaHours}h
                            </span>
                            {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{item.nextAction}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "Completed" ? "default" : "secondary"}>{item.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.status !== "Completed" && (
                            <Button size="sm" variant="outline" onClick={() => completeWork(item.id)}>
                              <Check data-icon="inline-start" />
                              Done
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team capacity</CardTitle>
            <CardDescription>Open work by employee.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {workload.map(({ owner, count }) => (
              <div key={owner.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-sm">{owner.name}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
                <Progress value={Math.min(100, count * 20)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      {overdue.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 text-muted-foreground" />
            <div>
              <CardTitle>Escalations required</CardTitle>
              <CardDescription>
                {overdue.length} queue items breached their deadline. Reassign or complete them from the queue above.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex gap-2 text-muted-foreground text-sm">
            <Clock3 className="size-4" />
            Sorted operationally by deadline and SLA.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
