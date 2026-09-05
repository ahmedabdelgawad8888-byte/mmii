"use client";

import { type FormEvent, useState } from "react";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { invoiceBalance, invoiceStatus } from "../../companies/_components/commercial-model";
import { useCompanies } from "../../companies/_components/companies-provider";
import { exportRows } from "../../companies/_components/register-tools";

export function InvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const { financeInvoices, companies, saveInvoiceTerms, updateInvoiceStatus, issueFinanceInvoice } = useCompanies();
  const invoice = financeInvoices.find((item) => item.id === invoiceId);
  const [reason, setReason] = useState("");
  const [credit, setCredit] = useState(0);
  if (!invoice)
    return (
      <p>
        Invoice not found in the selected market. <Link href="/dashboard/finance/invoices">Return to invoices</Link>
      </p>
    );
  const company = companies.find((item) => item.id === invoice.companyId);
  const money = (amount: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency: invoice.currency }).format(amount);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    saveInvoiceTerms(invoiceId, {
      dueDate: String(data.get("dueDate")),
      paymentTerms: String(data.get("paymentTerms")),
      poNumber: String(data.get("poNumber")),
      collectionsOwner: String(data.get("owner")),
    });
  }
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link className="text-muted-foreground text-sm hover:underline" href="/dashboard/finance/invoices">
          Invoices & collections
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-semibold text-3xl">{company?.name ?? "Client invoice"}</h1>
          <Badge variant={invoiceStatus(invoice) === "Overdue" ? "destructive" : "secondary"}>
            {invoiceStatus(invoice)}
          </Badge>
        </div>
        <p className="break-all text-muted-foreground text-xs">
          {invoice.id} · {invoice.entity} · Created {new Date(invoice.createdAt).toLocaleDateString()}
        </p>
        <div className="flex flex-wrap gap-2">
          {invoice.status === "Draft" && (
            <Button onClick={() => updateInvoiceStatus(invoiceId, "Submit")}>Submit for approval</Button>
          )}
          {invoice.status === "Pending Approval" && (
            <Button onClick={() => updateInvoiceStatus(invoiceId, "Approve")}>Approve invoice</Button>
          )}
          {invoice.status === "Approved" && (
            <Button onClick={() => issueFinanceInvoice(invoiceId)}>Issue invoice</Button>
          )}
          {invoice.status === "Issued" && (
            <Button onClick={() => updateInvoiceStatus(invoiceId, "Sent")}>Mark sent to client</Button>
          )}
          <Button
            variant="outline"
            onClick={() =>
              exportRows(
                "client-statement",
                financeInvoices
                  .filter((item) => item.companyId === invoice.companyId)
                  .map((item) => ({
                    Invoice: item.id,
                    Currency: item.currency,
                    Total: item.amount,
                    Paid: item.paidAmount,
                    Credit: item.creditAmount ?? 0,
                    Outstanding: invoiceBalance(item),
                    Due: item.dueDate,
                    Status: invoiceStatus(item),
                  })),
              )
            }
          >
            Export client statement
          </Button>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-4 border-y py-5 lg:grid-cols-4">
        {[
          ["Invoice total", invoice.amount],
          ["Received", invoice.paidAmount],
          ["Credit notes", invoice.creditAmount ?? 0],
          ["Outstanding", invoiceBalance(invoice)],
        ].map(([label, amount]) => (
          <div key={label}>
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-2 font-semibold text-2xl tabular-nums">{money(Number(amount))}</p>
          </div>
        ))}
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Billing & collection terms</CardTitle>
            <CardDescription>Terms can be edited while the invoice is a draft.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <FieldGroup>
                {[
                  { name: "dueDate", label: "Due date", value: invoice.dueDate, type: "date" },
                  { name: "paymentTerms", label: "Payment terms", value: invoice.paymentTerms ?? "", type: "text" },
                  { name: "poNumber", label: "Client PO number", value: invoice.poNumber ?? "", type: "text" },
                  { name: "owner", label: "Collections owner", value: invoice.collectionsOwner ?? "", type: "text" },
                ].map((field) => (
                  <Field key={field.name}>
                    <FieldLabel htmlFor={`invoice-${field.name}`}>{field.label}</FieldLabel>
                    <Input
                      id={`invoice-${field.name}`}
                      name={field.name}
                      type={field.type}
                      defaultValue={field.value}
                      required={field.name !== "poNumber"}
                      disabled={invoice.status !== "Draft"}
                    />
                  </Field>
                ))}
              </FieldGroup>
              <Button type="submit" disabled={invoice.status !== "Draft"}>
                Save terms
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tax & receipt history</CardTitle>
            <CardDescription>
              Amounts are carried from the approved quotation; demo tax entries are not a tax filing.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal before tax</span>
              <strong>{invoice.subtotal === undefined ? "Not recorded" : money(invoice.subtotal)}</strong>
            </div>
            <div className="flex justify-between text-sm">
              <span>VAT / tax</span>
              <strong>{invoice.tax === undefined ? "Not recorded" : money(invoice.tax)}</strong>
            </div>
            {(invoice.payments ?? []).map((payment) => (
              <div className="border-t pt-3" key={payment.id}>
                <p className="font-medium">
                  {money(payment.amount)} · {payment.reference}
                </p>
                <p className="text-muted-foreground text-xs">
                  {payment.actor} · {new Date(payment.recordedAt).toLocaleString()}
                </p>
              </div>
            ))}
            {!invoice.payments?.length && (
              <p className="text-muted-foreground text-sm">No itemized receipts recorded for this invoice.</p>
            )}
            {(invoice.creditNotes ?? []).map((note) => (
              <div className="border-t pt-3" key={note.id}>
                <p className="font-medium">
                  Credit {money(note.amount)} · {note.reason}
                </p>
                <p className="text-muted-foreground text-xs">
                  {note.actor} · {new Date(note.issuedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      {invoice.status !== "Cancelled" && (
        <Card>
          <CardHeader>
            <CardTitle>Credit note or void</CardTitle>
            <CardDescription>Credits reduce the outstanding amount. Paid invoices cannot be voided.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="credit-reason">Required explanation</FieldLabel>
                <Input id="credit-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="credit-amount">Credit amount ({invoice.currency})</FieldLabel>
                <Input
                  id="credit-amount"
                  type="number"
                  min="0"
                  step="0.001"
                  value={credit}
                  onChange={(event) => setCredit(Number(event.target.value))}
                />
              </Field>
            </FieldGroup>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => updateInvoiceStatus(invoiceId, "Credit", reason, credit)}>
                Issue credit note
              </Button>
              <Button
                variant="destructive"
                disabled={invoice.paidAmount > 0}
                onClick={() => updateInvoiceStatus(invoiceId, "Void", reason)}
              >
                Void invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
