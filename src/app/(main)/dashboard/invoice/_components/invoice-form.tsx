"use client";

import { Building2, CreditCard, FileCheck2, Send, ShieldCheck } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ClientSelector } from "./client-selector";
import type { InvoiceFormValues } from "./data";
import { InvoiceAdjustments } from "./invoice-adjustments";
import { InvoiceDetails } from "./invoice-details";
import { InvoiceItems } from "./invoice-items";

export function InvoiceForm() {
  const { register, getValues } = useFormContext<InvoiceFormValues>();

  const handleSaveDraft = () => {
    const values = getValues();
    toast.success(`Draft saved for Invoice ${values.referenceNumber || "FL-0425"}`);
  };

  const handleSendInvoice = () => {
    const values = getValues();
    toast.success(`Invoice ${values.referenceNumber || "FL-0425"} sent successfully to ${values.to?.name || "Client"}`);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <Tabs defaultValue="invoice" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="invoice" className="flex-1">
            Invoice
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex-1">
            Payment
          </TabsTrigger>
          <TabsTrigger value="business" className="flex-1">
            Business
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoice" className="mt-4 flex flex-col gap-4">
          <InvoiceDetails />
          <Separator />
          <ClientSelector />
          <Separator />
          <InvoiceItems />
          <Separator />
          <InvoiceAdjustments />
        </TabsContent>

        <TabsContent value="payment" className="mt-4 flex flex-col gap-4">
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center gap-2 font-medium text-sm">
              <CreditCard className="size-4 text-primary" />
              <span>Payment Details & Settlement Instructions</span>
            </div>
            <p className="mt-1 text-muted-foreground text-xs">
              These details are printed on the invoice for client remittance.
            </p>
          </div>

          <FieldGroup className="gap-3">
            <Field className="gap-1">
              <FieldLabel className="text-xs" htmlFor="account-name">
                Payment Beneficiary / Account Name
              </FieldLabel>
              <Input id="account-name" placeholder="e.g. Acme Studio LLC" {...register("from.paymentAccountName")} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field className="gap-1">
                <FieldLabel className="text-xs" htmlFor="routing-number">
                  Routing / SWIFT / IBAN Number
                </FieldLabel>
                <Input id="routing-number" placeholder="e.g. 123456789" {...register("from.routingNumber")} />
              </Field>

              <Field className="gap-1">
                <FieldLabel className="text-xs" htmlFor="issuer-name">
                  Authorized Signatory
                </FieldLabel>
                <Input id="issuer-name" placeholder="e.g. Alex Morgan" {...register("from.issuerName")} />
              </Field>
            </div>

            <div className="rounded-lg border border-dashed p-3 text-muted-foreground text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                <span>Verified Payment Method</span>
              </div>
              <p className="mt-1">
                Wire instructions and bank transfer tokens are encrypted and verified against ISO 20022 compliance.
              </p>
            </div>
          </FieldGroup>
        </TabsContent>

        <TabsContent value="business" className="mt-4 flex flex-col gap-4">
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center gap-2 font-medium text-sm">
              <Building2 className="size-4 text-primary" />
              <span>Company Information (Sender)</span>
            </div>
            <p className="mt-1 text-muted-foreground text-xs">
              Update company identity information rendered in invoice headers.
            </p>
          </div>

          <FieldGroup className="gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field className="gap-1">
                <FieldLabel className="text-xs" htmlFor="from-name">
                  Company Name
                </FieldLabel>
                <Input id="from-name" placeholder="Studio Admin Inc." {...register("from.name")} />
              </Field>

              <Field className="gap-1">
                <FieldLabel className="text-xs" htmlFor="from-tax">
                  Tax / VAT ID
                </FieldLabel>
                <Input id="from-tax" placeholder="US-TAX-89234" {...register("from.taxId")} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field className="gap-1">
                <FieldLabel className="text-xs" htmlFor="from-email">
                  Billing Email
                </FieldLabel>
                <Input id="from-email" type="email" placeholder="billing@example.com" {...register("from.email")} />
              </Field>

              <Field className="gap-1">
                <FieldLabel className="text-xs" htmlFor="from-phone">
                  Phone Number
                </FieldLabel>
                <Input id="from-phone" placeholder="+1 (555) 019-2834" {...register("from.phone")} />
              </Field>
            </div>

            <Field className="gap-1">
              <FieldLabel className="text-xs" htmlFor="from-website">
                Website
              </FieldLabel>
              <Input id="from-website" placeholder="https://trygc.com" {...register("from.website")} />
            </Field>
          </FieldGroup>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={handleSaveDraft}>
          <FileCheck2 data-icon="inline-start" className="size-4" />
          Save Draft
        </Button>
        <Button type="button" onClick={handleSendInvoice}>
          <Send data-icon="inline-start" className="size-4" />
          Send Invoice
        </Button>
      </div>
    </div>
  );
}
