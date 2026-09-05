"use client";

import { type FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { creatorBalance } from "./commercial-model";
import { useCompanies } from "./companies-provider";
import type { CreatorLedgerEntry } from "./types";

export function CreatorLedger() {
  const { companies, brands, creatorLedger, postCreatorEntry } = useCompanies();
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const [brandId, setBrandId] = useState("company");
  const [kind, setKind] = useState<CreatorLedgerEntry["kind"]>("Reserved");
  const [search, setSearch] = useState("");
  const entries = creatorLedger.filter((item) => item.companyId === companyId);
  const balance = creatorBalance(entries);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (
      postCreatorEntry({
        companyId,
        brandId: brandId === "company" ? null : brandId,
        kind,
        quantity: Number(data.get("quantity")),
        note: String(data.get("note")),
      })
    )
      form.reset();
  }
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-widest">Delivery · Entitlements</p>
        <h1 className="font-semibold text-3xl tracking-tight">Every creator, accounted for.</h1>
        <p className="max-w-2xl text-muted-foreground text-sm">
          Purchased + bonus + adjustments − reserved − consumed − expired = available.
        </p>
      </header>
      <Field className="max-w-sm">
        <FieldLabel htmlFor="ledger-company">Company account</FieldLabel>
        <Select
          value={companyId}
          onValueChange={(value) => {
            setCompanyId(value);
            setBrandId("company");
          }}
        >
          <SelectTrigger id="ledger-company">
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {companies.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-5 border-y py-5 sm:grid-cols-4">
        {[
          ["Entitlement", balance.purchased + balance.bonus + balance.adjusted],
          ["Reserved", balance.reserved],
          ["Consumed", balance.consumed],
          ["Available", balance.available],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="mt-2 font-semibold text-3xl tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Post a ledger entry</CardTitle>
            <CardDescription>
              Release reserved creators before consuming them. Opening balances are held at company level.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-5">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="ledger-brand">Allocation</FieldLabel>
                  <Select value={brandId} onValueChange={setBrandId}>
                    <SelectTrigger id="ledger-brand">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="company">Company / unallocated</SelectItem>
                        {brands
                          .filter((item) => item.companyId === companyId)
                          .map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="ledger-kind">Transaction</FieldLabel>
                  <Select value={kind} onValueChange={(value) => setKind(value as CreatorLedgerEntry["kind"])}>
                    <SelectTrigger id="ledger-kind">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {["Purchased", "Bonus", "Reserved", "Released", "Consumed", "Expired", "Adjusted"].map(
                          (item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ),
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="ledger-quantity">Quantity</FieldLabel>
                  <Input
                    id="ledger-quantity"
                    name="quantity"
                    type="number"
                    step="1"
                    min={kind === "Adjusted" ? undefined : 1}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ledger-note">Reason / reference</FieldLabel>
                  <Input id="ledger-note" name="note" required />
                </Field>
              </FieldGroup>
              <Button type="submit" disabled={!companyId}>
                Post entry
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Transaction history</CardTitle>
            <CardDescription>
              {entries.length} entries · company and brand allocations share the same ledger.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              aria-label="Search ledger"
              placeholder="Search reason, transaction, or actor…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Allocation & reason</TableHead>
                    <TableHead>Recorded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...entries]
                    .reverse()
                    .filter((item) =>
                      `${item.kind} ${item.note} ${item.actor}`.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline">{item.kind}</Badge>
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">{item.quantity}</TableCell>
                        <TableCell>
                          <p>{brands.find((brand) => brand.id === item.brandId)?.name ?? "Company / unallocated"}</p>
                          <p className="max-w-xs whitespace-normal text-muted-foreground text-xs">{item.note}</p>
                        </TableCell>
                        <TableCell>
                          <p>{new Date(item.createdAt).toLocaleDateString()}</p>
                          <p className="text-muted-foreground text-xs">{item.actor}</p>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
