"use client";

import { Button } from "@/components/ui/button";

import { quotationTotals } from "./commercial-model";
import { useCompanies } from "./companies-provider";

export function QuotationDocument({ quotationId }: { quotationId: string }) {
  const { campaigns, companies, brands, rules } = useCompanies();
  const quotation = campaigns.find((item) => item.id === quotationId);
  if (!quotation?.pdfReady || !quotation.pricing)
    return <p>This document becomes available after a priced quotation is released.</p>;
  const company = companies.find((item) => item.id === quotation.companyId);
  const totals = quotationTotals(quotation.requestedInfluencers, quotation.pricing);
  const money = (value: number) =>
    new Intl.NumberFormat("en", { style: "currency", currency: quotation.currency }).format(value);
  return (
    <>
      <style>{`@media print { body * { visibility: hidden; } #quotation-document, #quotation-document * { visibility: visible; } #quotation-document { position: absolute; inset: 0; width: 100%; margin: 0; padding: 20mm; border: 0; } .document-controls { display: none; } @page { size: A4; margin: 0; } }`}</style>
      <div className="document-controls mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">Demo document · use your browser’s Save as PDF option.</p>
        <Button onClick={() => window.print()}>Print / Save as PDF</Button>
      </div>
      <article
        id="quotation-document"
        className="mx-auto flex max-w-3xl flex-col gap-8 rounded-xl border bg-background p-6 sm:p-12"
      >
        <header className="flex justify-between gap-4 border-b pb-8">
          <div>
            <p className="font-semibold text-3xl tracking-tight">TryGC</p>
            <p className="text-muted-foreground text-sm">Commercial quotation · Demo</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">{quotation.id}</p>
            <p>{new Date(quotation.updatedAt).toLocaleDateString()}</p>
          </div>
        </header>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-widest">Prepared for</p>
            <h1 className="mt-2 font-semibold text-2xl">{company?.name}</h1>
            <p>{company?.contactPerson}</p>
            <p className="text-sm">{company?.email}</p>
            <p className="text-sm">{brands.find((item) => item.id === quotation.brandId)?.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-widest">Scope</p>
            <h2 className="mt-2 font-medium">{quotation.name}</h2>
            <p>{quotation.branch}</p>
            <p className="text-sm">Prepared by {quotation.owner}</p>
          </div>
        </div>
        <dl className="flex flex-col gap-4 border-y py-6">
          {[
            [`${quotation.requestedInfluencers} creators × ${money(quotation.pricing.unitPrice)}`, totals.base],
            ["Discount", -quotation.pricing.discount],
            ["Service fee", quotation.pricing.serviceFee],
            [`VAT (${quotation.pricing.vatPercent}%)`, totals.tax],
            ["Credit", -quotation.pricing.credit],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt>{label}</dt>
              <dd className="tabular-nums">{money(Number(value))}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t pt-4 font-semibold text-xl">
            <dt>Total</dt>
            <dd>{money(totals.total)}</dd>
          </div>
        </dl>
        <p>
          {quotation.pricing.freeCreators} complimentary creators ·{" "}
          {quotation.requestedInfluencers + quotation.pricing.freeCreators} total creators
        </p>
        <footer className="text-muted-foreground text-sm">
          Valid for {rules.quotationValidityDays} days from release. This is a demo quotation, not a tax invoice. Tax
          rates and commercial terms are entered by the demo operator.
        </footer>
      </article>
    </>
  );
}
