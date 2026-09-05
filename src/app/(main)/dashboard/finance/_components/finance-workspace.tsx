"use client";

import { type FormEvent, useState } from "react";

import Link from "next/link";

import { Check, FilePlus2, ShieldCheck } from "lucide-react";

import { useCompanies } from "@/app/(main)/dashboard/companies/_components/companies-provider";
import type { Branch, ChartAccount } from "@/app/(main)/dashboard/companies/_components/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { CashCommitmentsChart } from "../../companies/_components/commercial-charts";
import { invoiceBalance, invoiceStatus } from "../../companies/_components/commercial-model";

export type FinanceView = "overview" | "entities" | "coa" | "invoices" | "consolidation";
const branches: Branch[] = ["Saudi Arabia", "UAE", "Kuwait", "Egypt", "Qatar", "Bahrain"];

function FinanceNav({ view }: { view: FinanceView }) {
  const links: Array<{ id: FinanceView; label: string; href: string }> = [
    { id: "overview", label: "Command Center", href: "/dashboard/finance" },
    { id: "entities", label: "Entities", href: "/dashboard/finance/entities" },
    { id: "coa", label: "Chart of Accounts", href: "/dashboard/finance/chart-of-accounts" },
    { id: "invoices", label: "Invoices & Collections", href: "/dashboard/finance/invoices" },
    { id: "consolidation", label: "Consolidation", href: "/dashboard/finance/consolidation" },
  ];
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="font-medium text-muted-foreground text-sm">Group Finance</p>
        <h1 className="font-semibold text-2xl tracking-tight">{links.find((item) => item.id === view)?.label}</h1>
        <p className="text-muted-foreground text-sm">
          Local-currency invoices, collections, and consolidated reporting.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {links.map((item) => (
          <Button key={item.id} size="sm" variant={view === item.id ? "default" : "outline"} asChild>
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

function AccountRequestDialog() {
  const { requestAccount, rules, team } = useCompanies();
  const [open, setOpen] = useState(false);
  const [entity, setEntity] = useState<Branch>(rules.activeScope === "Group" ? "Saudi Arabia" : rules.activeScope);
  const [type, setType] = useState<ChartAccount["type"]>("Expense");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    requestAccount({ accountName: String(new FormData(event.currentTarget).get("name")), accountType: type, entity });
    setOpen(false);
  }
  const user = team.find((item) => item.id === rules.currentUserId);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FilePlus2 data-icon="inline-start" />
          Request account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New account request</DialogTitle>
            <DialogDescription>
              Branch users request accounts; Finance reviews before the master COA changes.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <ShieldCheck />
            <AlertTitle>Requester: {user?.name}</AlertTitle>
            <AlertDescription>The request and decision remain in approval history.</AlertDescription>
          </Alert>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="account-name">Account name</FieldLabel>
              <Input id="account-name" name="name" required />
            </Field>
            <Field>
              <FieldLabel>Account type</FieldLabel>
              <Select value={type} onValueChange={(value) => setType(value as ChartAccount["type"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {["Asset", "Liability", "Equity", "Revenue", "Expense"].map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Entity</FieldLabel>
              <Select value={entity} onValueChange={(value) => setEntity(value as Branch)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {branches.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Submit to Finance</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({ invoiceId, remaining }: { invoiceId: string; remaining: number }) {
  const { recordPayment } = useCompanies();
  const [open, setOpen] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(new FormData(event.currentTarget).get("amount"));
    if (amount > 0) {
      recordPayment(invoiceId, amount);
      setOpen(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Add payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Apply a collection to {invoiceId}. Remaining: {remaining.toLocaleString()}.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`payment-${invoiceId}`}>Amount received</FieldLabel>
              <Input
                id={`payment-${invoiceId}`}
                name="amount"
                type="number"
                min="0.01"
                max={remaining}
                step="0.01"
                required
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Record collection</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function FinanceWorkspace({ view }: { view: FinanceView }) {
  const {
    accountRequests,
    chartOfAccounts,
    decideAccountRequest,
    entities,
    financeInvoices,
    fxToSar,
    rules,
    team,
    issueFinanceInvoice,
    updateInvoiceStatus,
  } = useCompanies();
  const currentUser = team.find((item) => item.id === rules.currentUserId);
  const canEditCoa = currentUser?.role === "Finance" || currentUser?.role === "Admin";
  const receivables = financeInvoices.filter(
    (item) => !["Draft", "Pending Approval", "Approved", "Cancelled"].includes(item.status),
  );
  const invoiced = receivables.reduce((sum, item) => sum + item.amount * fxToSar[item.currency], 0);
  const collected = receivables.reduce((sum, item) => sum + item.paidAmount * fxToSar[item.currency], 0);
  const outstanding = receivables.reduce(
    (sum, item) => sum + invoiceBalance(item) * (item.fxSnapshot?.rate ?? fxToSar[item.currency]),
    0,
  );
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <FinanceNav view={view} />
      {view === "overview" && <CashCommitmentsChart />}
      {view === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Group invoiced", invoiced],
              ["Collected", collected],
              ["Outstanding AR", outstanding],
            ].map(([label, value]) => (
              <Card key={String(label)}>
                <CardHeader>
                  <CardDescription>{label}</CardDescription>
                  <CardTitle className="text-2xl">SAR {Math.round(Number(value)).toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-xs">Explicit SAR consolidation</p>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardHeader>
                <CardDescription>COA requests</CardDescription>
                <CardTitle className="text-2xl">
                  {accountRequests.filter((item) => item.status === "Pending Finance").length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">Waiting for Finance</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Entity health</CardTitle>
              <CardDescription>Local receivables and visible SAR conversion.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {entities.map((entity) => {
                const local = financeInvoices
                  .filter((item) => item.entity === entity.country)
                  .reduce((sum, item) => sum + item.amount - item.paidAmount, 0);
                return (
                  <div key={entity.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{entity.country}</p>
                      <Badge variant={entity.status === "Active" ? "default" : "outline"}>{entity.status}</Badge>
                    </div>
                    <p className="mt-3 font-semibold text-2xl">
                      {entity.currency} {local.toLocaleString()}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      FX {fxToSar[entity.currency]} → SAR{" "}
                      {Math.round(local * fxToSar[entity.currency]).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
      {view === "entities" && (
        <Card>
          <CardHeader>
            <CardTitle>Legal entities</CardTitle>
            <CardDescription>Current and future branch architecture.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Local currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Group currency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entities.map((entity) => (
                    <TableRow key={entity.id}>
                      <TableCell className="font-medium">{entity.name}</TableCell>
                      <TableCell>{entity.country}</TableCell>
                      <TableCell>{entity.currency}</TableCell>
                      <TableCell>
                        <Badge variant={entity.status === "Active" ? "default" : "outline"}>{entity.status}</Badge>
                      </TableCell>
                      <TableCell>SAR</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {view === "coa" && (
        <>
          <Alert>
            <ShieldCheck />
            <AlertTitle>Controlled master Chart of Accounts</AlertTitle>
            <AlertDescription>
              {canEditCoa
                ? "Your role can review account requests."
                : "Your role can use assigned accounts but cannot change the master COA."}
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Group Chart of Accounts</CardTitle>
                <CardDescription>One governed account structure with entity applicability.</CardDescription>
              </div>
              <AccountRequestDialog />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Group category</TableHead>
                      <TableHead>Entities</TableHead>
                      <TableHead>Approved by</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chartOfAccounts.map((account) => (
                      <TableRow key={account.code}>
                        <TableCell className="font-medium">{account.code}</TableCell>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{account.type}</TableCell>
                        <TableCell>{account.groupCategory}</TableCell>
                        <TableCell>{account.entityApplicability.length}</TableCell>
                        <TableCell>{account.approvedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Account request approvals</CardTitle>
              <CardDescription>Finance review queue.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {accountRequests.length ? (
                accountRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{request.accountName}</p>
                      <p className="text-muted-foreground text-xs">
                        {request.accountType} · {request.entity} · {request.requestedBy}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{request.status}</Badge>
                      {request.status === "Pending Finance" && (
                        <>
                          <Button
                            size="sm"
                            disabled={!canEditCoa}
                            onClick={() => decideAccountRequest(request.id, true)}
                          >
                            <Check data-icon="inline-start" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!canEditCoa}
                            onClick={() => decideAccountRequest(request.id, false)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No requests submitted.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
      {view === "invoices" && (
        <Card>
          <CardHeader>
            <CardTitle>Invoices and collections</CardTitle>
            <CardDescription>Linked entity, local currency, received, and outstanding amounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Due / owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Collection</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financeInvoices.map((invoice) => {
                    const remaining = invoiceBalance(invoice);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="max-w-52 truncate font-medium">
                          <Link className="hover:underline" href={`/dashboard/finance/invoices/${invoice.id}`}>
                            {invoice.id}
                          </Link>
                        </TableCell>
                        <TableCell>{invoice.entity}</TableCell>
                        <TableCell>
                          {invoice.currency} {invoice.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {invoice.currency} {invoice.paidAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {invoice.currency} {remaining.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {invoice.dueDate}
                          <p className="text-muted-foreground text-xs">{invoice.collectionsOwner ?? "Unassigned"}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={invoiceStatus(invoice) === "Overdue" ? "destructive" : "secondary"}>
                            {invoiceStatus(invoice)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.status === "Draft" && (
                            <Button
                              size="sm"
                              disabled={!canEditCoa}
                              onClick={() => updateInvoiceStatus(invoice.id, "Submit")}
                            >
                              Submit invoice
                            </Button>
                          )}
                          {invoice.status === "Pending Approval" && (
                            <Button
                              size="sm"
                              disabled={!canEditCoa}
                              onClick={() => updateInvoiceStatus(invoice.id, "Approve")}
                            >
                              Approve invoice
                            </Button>
                          )}
                          {invoice.status === "Approved" && (
                            <Button size="sm" disabled={!canEditCoa} onClick={() => issueFinanceInvoice(invoice.id)}>
                              Issue invoice
                            </Button>
                          )}
                          {invoice.status === "Issued" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canEditCoa}
                              onClick={() => updateInvoiceStatus(invoice.id, "Sent")}
                            >
                              Mark sent
                            </Button>
                          )}
                          {remaining > 0 &&
                            !["Draft", "Pending Approval", "Approved", "Cancelled"].includes(invoice.status) &&
                            canEditCoa && <PaymentDialog invoiceId={invoice.id} remaining={remaining} />}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {view === "consolidation" && (
        <Card>
          <CardHeader>
            <CardTitle>Group consolidation in SAR</CardTitle>
            <CardDescription>Local values, FX rates, and converted SAR values are all visible.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Local currency</TableHead>
                    <TableHead>Local invoiced</TableHead>
                    <TableHead>FX to SAR</TableHead>
                    <TableHead>SAR equivalent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entities.map((entity) => {
                    const local = financeInvoices
                      .filter((item) => item.entity === entity.country)
                      .reduce((sum, item) => sum + item.amount, 0);
                    return (
                      <TableRow key={entity.id}>
                        <TableCell className="font-medium">{entity.country}</TableCell>
                        <TableCell>{entity.currency}</TableCell>
                        <TableCell>
                          {entity.currency} {local.toLocaleString()}
                        </TableCell>
                        <TableCell>{fxToSar[entity.currency]}</TableCell>
                        <TableCell>SAR {Math.round(local * fxToSar[entity.currency]).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
