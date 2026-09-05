"use client";

import { type FormEvent, useState } from "react";

import { FileText, LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { emptyPricing, quotationTotals } from "./commercial-model";
import { useCompanies } from "./companies-provider";
import { type Campaign, type LossReason, lossReasons, type QuotationPricing } from "./types";

const pricingFields: { key: keyof QuotationPricing; label: string }[] = [
  { key: "unitPrice", label: "Price per paid creator" },
  { key: "freeCreators", label: "Free creators" },
  { key: "discount", label: "Discount" },
  { key: "serviceFee", label: "Service fee" },
  { key: "vatPercent", label: "VAT (%)" },
  { key: "credit", label: "Credit" },
  { key: "influencerCost", label: "Expected influencer cost" },
  { key: "executionCost", label: "Expected execution cost" },
  { key: "operationsCost", label: "Expected operations cost" },
];

export function QuotationCommercial({ quotation }: { quotation: Campaign }) {
  const { saveQuotationPricing, createQuotationInvoice, financeInvoices } = useCompanies();
  const [pricing, setPricing] = useState(
    quotation.pricing ?? {
      ...emptyPricing,
      unitPrice: quotation.requestedInfluencers ? quotation.budget / quotation.requestedInfluencers : 0,
    },
  );
  const [quantity, setQuantity] = useState(quotation.requestedInfluencers);
  const [closeDate, setCloseDate] = useState(quotation.expectedCloseDate ?? "");
  const locked = quotation.stage !== "Proposal / Price Quote";
  const totals = quotationTotals(quantity, pricing);
  const money = (value: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency: quotation.currency }).format(value);
  const hasInvoice = financeInvoices.some(
    (item) => item.quotationId === quotation.id || item.id === quotation.invoiceId,
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveQuotationPricing(quotation.id, pricing, quantity, closeDate);
  }
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Pricing & margin review</CardTitle>
          <CardDescription>
            {locked
              ? "Approved terms are locked. Request a revision to change commercial values."
              : "Every adjustment is explicit. Save the breakdown before submitting for approval."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="paid-creators">Paid creators</FieldLabel>
                <Input
                  id="paid-creators"
                  type="number"
                  min="1"
                  step="1"
                  required
                  disabled={locked}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                />
              </Field>
              {pricingFields.map(({ key, label }) => (
                <Field key={key}>
                  <FieldLabel htmlFor={`pricing-${key}`}>{label}</FieldLabel>
                  <Input
                    id={`pricing-${key}`}
                    type="number"
                    min="0"
                    step={key === "freeCreators" ? "1" : "0.001"}
                    max={key === "vatPercent" ? 100 : undefined}
                    required
                    disabled={locked}
                    value={pricing[key]}
                    onChange={(event) => setPricing({ ...pricing, [key]: Number(event.target.value) })}
                  />
                </Field>
              ))}
              <Field>
                <FieldLabel htmlFor="expected-close">Expected close</FieldLabel>
                <Input
                  id="expected-close"
                  type="date"
                  disabled={locked}
                  value={closeDate}
                  onChange={(event) => setCloseDate(event.target.value)}
                />
              </Field>
            </FieldGroup>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={locked}>
                {locked && <LockKeyhole data-icon="inline-start" />}
                {locked ? "Terms locked" : "Save commercial terms"}
              </Button>
              {!quotation.pricing && <Badge variant="outline">Breakdown requires confirmation</Badge>}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Commercial summary</CardTitle>
          <CardDescription>{quotation.currency} · local transaction currency</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="flex flex-col gap-3 text-sm">
            {[
              ["Base value", totals.base],
              ["Discount", -pricing.discount],
              ["Service fee", pricing.serviceFee],
              ["VAT", totals.tax],
              ["Credit", -pricing.credit],
              ["Final quotation", totals.total],
              ["Expected costs", totals.cost],
              ["Expected gross margin", totals.margin],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium tabular-nums">{money(Number(value))}</dd>
              </div>
            ))}
          </dl>
          <Badge variant={totals.margin < 0 ? "destructive" : "secondary"}>
            {totals.marginPercent.toFixed(1)}% expected margin
          </Badge>
          <p className="text-muted-foreground text-xs">
            Margin excludes VAT. Cost fields are estimates; final campaign costs must be reconciled separately.
          </p>
          {quotation.fxSnapshot && (
            <p className="text-muted-foreground text-xs">
              FX captured: 1 {quotation.currency} = {quotation.fxSnapshot.rate} SAR ·{" "}
              {new Date(quotation.fxSnapshot.effectiveAt).toLocaleDateString()} · {quotation.fxSnapshot.source}
            </p>
          )}
          {quotation.stage === "Client Approved" && !hasInvoice && (
            <Button variant="outline" onClick={() => createQuotationInvoice(quotation.id)}>
              Create draft invoice
            </Button>
          )}
          {quotation.pdfReady && (
            <Button variant="outline" asChild>
              <a href={`/dashboard/companies/quotations/${quotation.id}/print`} target="_blank" rel="noreferrer">
                <FileText data-icon="inline-start" />
                Open print / PDF document
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ClientDecision({ quotation }: { quotation: Campaign }) {
  const { closeQuotation } = useCompanies();
  const [reason, setReason] = useState<LossReason>("Budget");
  const [notes, setNotes] = useState("");
  if (quotation.stage !== "Sent To Client") return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record a lost or cancelled opportunity</CardTitle>
        <CardDescription>A structured reason keeps the outcome useful for future analysis.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="loss-reason">Loss reason</FieldLabel>
            <Select value={reason} onValueChange={(value) => setReason(value as LossReason)}>
              <SelectTrigger id="loss-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {lossReasons.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="loss-notes">Context {reason === "Other" ? "(required)" : "(optional)"}</FieldLabel>
            <Input id="loss-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
        </FieldGroup>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => closeQuotation(quotation.id, "Client Not Approved", reason, notes)}>
            Client declined
          </Button>
          <Button variant="ghost" onClick={() => closeQuotation(quotation.id, "Client Cancelled", reason, notes)}>
            Client cancelled
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
