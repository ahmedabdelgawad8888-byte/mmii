"use client";

import { type FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { CostBudgetChart } from "../../companies/_components/commercial-charts";
import { invoiceBalance, quotationTotals } from "../../companies/_components/commercial-model";
import { useCompanies } from "../../companies/_components/companies-provider";
import type { FinanceExpense } from "../../companies/_components/types";

export function FinancePlanning() {
  const { expenses, campaigns, financeInvoices, fxToSar, rules, addFinanceExpense, settleFinanceExpense } =
    useCompanies();
  const [quotationId, setQuotationId] = useState(campaigns[0]?.id ?? "");
  const [category, setCategory] = useState<FinanceExpense["category"]>("Influencer");
  const quotation = campaigns.find((item) => item.id === quotationId);
  const money = (value: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency: rules.baseCurrency, maximumFractionDigits: 0 }).format(
      value,
    );
  const convert = (amount: number, currency: keyof typeof fxToSar) =>
    (amount * fxToSar[currency]) / fxToSar[rules.baseCurrency];
  const unpaid = expenses.filter((item) => !item.paid);
  const expectedReceipts = financeInvoices.filter(
    (item) => !["Draft", "Pending Approval", "Approved", "Cancelled"].includes(item.status),
  );
  const receivable = expectedReceipts.reduce((sum, item) => sum + convert(invoiceBalance(item), item.currency), 0);
  const liabilities = unpaid.reduce((sum, item) => sum + convert(item.amount, item.currency), 0);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quotation) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (
      addFinanceExpense({
        quotationId,
        companyId: quotation.companyId,
        category,
        currency: quotation.currency,
        supplier: String(data.get("supplier")),
        amount: Number(data.get("amount")),
        dueDate: String(data.get("dueDate")),
        reference: String(data.get("reference")),
      })
    )
      form.reset();
  }
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-muted-foreground text-xs uppercase tracking-widest">Finance · Planning & control</p>
        <h1 className="mt-2 font-semibold text-3xl tracking-tight">From revenue to margin.</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Supplier liabilities, campaign costs, and expected cash movement from recorded commitments.
        </p>
      </header>
      <div className="grid gap-5 border-y py-5 sm:grid-cols-3">
        {[
          ["Expected receipts", receivable],
          ["Unpaid liabilities", liabilities],
          ["Net committed cash movement", receivable - liabilities],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-2 font-semibold text-2xl tabular-nums">{money(Number(value))}</p>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        Cash movement excludes opening bank balances and unrecorded commitments. Consolidated planning uses current
        workspace FX rates.
      </p>
      <CostBudgetChart />
      <div className="grid items-start gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Record a cost commitment</CardTitle>
            <CardDescription>Costs stay linked to the quotation in its original currency.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5" onSubmit={submit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="cost-quote">Quotation</FieldLabel>
                  <Select value={quotationId} onValueChange={setQuotationId}>
                    <SelectTrigger id="cost-quote">
                      <SelectValue placeholder="Choose quotation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {campaigns.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="cost-category">Cost category</FieldLabel>
                  <Select value={category} onValueChange={(value) => setCategory(value as FinanceExpense["category"])}>
                    <SelectTrigger id="cost-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {["Influencer", "Execution", "Operations"].map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="cost-supplier">Supplier / influencer</FieldLabel>
                  <Input id="cost-supplier" name="supplier" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="cost-amount">Amount ({quotation?.currency ?? "local currency"})</FieldLabel>
                  <Input id="cost-amount" name="amount" type="number" min="0.001" step="0.001" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="cost-due">Payment due</FieldLabel>
                  <Input id="cost-due" name="dueDate" type="date" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="cost-reference">PO / expense reference</FieldLabel>
                  <Input id="cost-reference" name="reference" required />
                </Field>
              </FieldGroup>
              <Button disabled={!quotation} type="submit">
                Record liability
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Expected vs recorded costs</CardTitle>
            <CardDescription>
              Margin excludes VAT. Recorded margin remains provisional until every campaign cost is entered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation</TableHead>
                    <TableHead>Expected cost</TableHead>
                    <TableHead>Recorded cost</TableHead>
                    <TableHead>Cost variance</TableHead>
                    <TableHead>Provisional margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns
                    .filter((item) => item.pricing)
                    .map((item) => {
                      if (!item.pricing) return null;
                      const totals = quotationTotals(item.requestedInfluencers, item.pricing);
                      const actual = expenses
                        .filter((expense) => expense.quotationId === item.id)
                        .reduce((sum, expense) => sum + expense.amount, 0);
                      const local = (value: number) =>
                        `${item.currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 3 })}`;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="max-w-48 whitespace-normal font-medium">{item.name}</TableCell>
                          <TableCell>{local(totals.cost)}</TableCell>
                          <TableCell>{local(actual)}</TableCell>
                          <TableCell>{local(totals.cost - actual)}</TableCell>
                          <TableCell>{local(totals.subtotal - item.pricing.credit - actual)}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
            {!campaigns.some((item) => item.pricing) && (
              <p className="py-8 text-muted-foreground text-sm">
                Save quotation pricing to compare planned costs and recorded commitments.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Supplier & influencer liabilities</CardTitle>
          <CardDescription>Payment actions are recorded in the local demo audit trail.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.reference}</TableCell>
                    <TableCell>{item.dueDate}</TableCell>
                    <TableCell>
                      {item.currency} {item.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {item.paid ? (
                        <Badge variant="secondary">Paid</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => settleFinanceExpense(item.id)}>
                          Record payment
                        </Button>
                      )}
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
