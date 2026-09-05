"use client";

import { ShieldCheck } from "lucide-react";

import { useCompanies } from "@/app/(main)/dashboard/companies/_components/companies-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Page() {
  const { auditLog } = useCompanies();
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <p className="font-medium text-muted-foreground text-sm">Administration</p>
        <h1 className="font-semibold text-2xl tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground text-sm">
          Local demo history for campaign, finance, and approval actions. This browser log is not tamper-proof.
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 text-muted-foreground" />
          <div>
            <CardTitle>System activity</CardTitle>
            <CardDescription>Who changed what, when, and within which entity.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{entry.user}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.module}</Badge>
                    </TableCell>
                    <TableCell>{entry.action}</TableCell>
                    <TableCell>{entry.record}</TableCell>
                    <TableCell>{entry.entity}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{entry.oldValue || "Created"}</span> → {entry.newValue}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
