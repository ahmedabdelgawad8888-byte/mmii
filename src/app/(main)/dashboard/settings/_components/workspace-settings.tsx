"use client";

import { type ChangeEvent, useRef, useState } from "react";

import Link from "next/link";

import { ArrowUpRight, Download, RotateCcw, ShieldAlert, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useCompanies } from "../../companies/_components/companies-provider";
import type { Currency, OperatingScope } from "../../companies/_components/types";

const WORKSPACE_KEY = "trygc:companies-workspace:v1";

const currencies: Currency[] = ["SAR", "AED", "KWD", "EGP", "QAR", "BHD"];
const scopes: OperatingScope[] = ["Group", "Saudi Arabia", "Egypt", "UAE", "Kuwait", "Qatar", "Bahrain"];

const workflowRules = [
  {
    key: "requireManagementApproval" as const,
    label: "Management approval",
    description: "A quotation must pass management review before it reaches finance.",
  },
  {
    key: "requireFinanceApproval" as const,
    label: "Finance approval",
    description: "Finance must approve before a quotation can be released to the client.",
  },
  {
    key: "autoInvoiceOnClientApproval" as const,
    label: "Invoice on client approval",
    description: "Raise a draft invoice automatically when a client approves.",
  },
  {
    key: "enforceRoleAccess" as const,
    label: "Role gating",
    description: "Only Management, Finance, or Admin may take their own approval action.",
  },
];

export function WorkspaceSettings() {
  const workspace = useCompanies();
  const { rules, team, fxToSar, entities, updateRules, updateFx, setCurrentUser } = workspace;
  const [confirmingReset, setConfirmingReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const actor = team.find((member) => member.id === rules.currentUserId);

  const exportConfiguration = () => {
    const configuration = {
      exportedAt: new Date().toISOString(),
      rules,
      fxToSar,
      team,
      entities,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(configuration, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `trygc-configuration-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Configuration exported.");
  };

  const importConfiguration = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as {
        rules?: Partial<typeof rules>;
        fxToSar?: Partial<Record<Currency, number>>;
      };
      // Records are left alone: only behaviour and rates are portable.
      if (parsed.rules) updateRules(parsed.rules);
      if (parsed.fxToSar) {
        for (const [currency, rate] of Object.entries(parsed.fxToSar)) {
          if (typeof rate === "number" && rate > 0) updateFx(currency as Currency, rate);
        }
      }
      toast.success("Configuration imported. Records were not changed.");
    } catch {
      toast.error("That file is not a valid configuration export.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-muted-foreground text-sm">GOVERNANCE · CONFIGURATION</p>
          <h1 className="font-semibold text-2xl tracking-tight">Workspace settings</h1>
          <p className="text-muted-foreground text-sm">
            Identity, reporting, approval rules, and conversion rates. Changes take effect across every screen at once.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/agent/settings">
            <Sparkles aria-hidden="true" /> Agent settings
          </Link>
        </Button>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <div className="flex flex-col gap-6 xl:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle>Reporting</CardTitle>
              <CardDescription>
                Transactions keep their market currency. These settings control the consolidated view only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="setting-scope">Default operating scope</FieldLabel>
                  <Select
                    value={rules.activeScope}
                    onValueChange={(value) => updateRules({ activeScope: value as OperatingScope })}
                  >
                    <SelectTrigger id="setting-scope">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scopes.map((scope) => (
                        <SelectItem key={scope} value={scope}>
                          {scope === "Group" ? "Group · consolidated" : scope}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="setting-currency">Reporting currency</FieldLabel>
                  <Select
                    value={rules.baseCurrency}
                    onValueChange={(value) => updateRules({ baseCurrency: value as Currency })}
                  >
                    <SelectTrigger id="setting-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    Every consolidated figure is converted into this currency at the rates below.
                  </p>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval workflow</CardTitle>
              <CardDescription>How a quotation moves from draft to a released document.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {workflowRules.map((rule) => (
                <div key={rule.key} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{rule.label}</p>
                    <p className="text-muted-foreground text-xs">{rule.description}</p>
                  </div>
                  <Switch
                    checked={rules[rule.key]}
                    onCheckedChange={(checked) => updateRules({ [rule.key]: checked })}
                    aria-label={rule.label}
                  />
                </div>
              ))}
              <Separator />
              <FieldGroup className="sm:grid sm:grid-cols-2 sm:gap-4">
                <Field>
                  <FieldLabel htmlFor="setting-followup">Follow-up after (days)</FieldLabel>
                  <Input
                    id="setting-followup"
                    type="number"
                    min="1"
                    max="60"
                    value={rules.followUpDays}
                    onChange={(event) => updateRules({ followUpDays: Number(event.target.value) || 1 })}
                  />
                  <p className="text-muted-foreground text-xs">Sets the follow-up date when a quotation is sent.</p>
                </Field>
                <Field>
                  <FieldLabel htmlFor="setting-validity">Quotation validity (days)</FieldLabel>
                  <Input
                    id="setting-validity"
                    type="number"
                    min="1"
                    max="180"
                    value={rules.quotationValidityDays}
                    onChange={(event) => updateRules({ quotationValidityDays: Number(event.target.value) || 1 })}
                  />
                  <p className="text-muted-foreground text-xs">Printed on the quotation document.</p>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Markets &amp; conversion</CardTitle>
              <CardDescription>
                Rates used for consolidated reporting. Quotations store the rate that applied when they were priced, so
                a change here does not rewrite history.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Currency</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Rate to SAR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((currency) => {
                    const entity = entities.find((item) => item.currency === currency);
                    return (
                      <TableRow key={currency}>
                        <TableCell className="font-medium">{currency}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {entity ? `${entity.name} · ${entity.status}` : "No entity"}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            className="h-8 w-32"
                            value={fxToSar[currency]}
                            onChange={(event) => updateFx(currency, Number(event.target.value) || 0)}
                            aria-label={`${currency} rate to SAR`}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 xl:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Acting identity</CardTitle>
              <CardDescription>
                Every action is stamped with this person, and role gating is evaluated against their role.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor="setting-actor">Working as</FieldLabel>
                <Select value={rules.currentUserId} onValueChange={setCurrentUser}>
                  <SelectTrigger id="setting-actor">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {team
                        .filter((member) => member.active)
                        .map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} · {member.role}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                <p className="text-sm">
                  Acting as another person is a demo convenience. In production this belongs to Super Admin only, and
                  each switch should write an immutable audit entry.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {team.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <Avatar>
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{member.name}</p>
                      <p className="truncate text-muted-foreground text-xs">
                        {member.email} · {member.branch}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge variant="outline">{member.role}</Badge>
                      {member.id === rules.currentUserId && <Badge>Active</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current configuration</CardTitle>
              <CardDescription>What every screen is using right now.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <dt className="text-muted-foreground text-xs">Scope</dt>
                  <dd className="font-medium text-sm">{rules.activeScope}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Reporting currency</dt>
                  <dd className="font-medium text-sm">{rules.baseCurrency}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Acting as</dt>
                  <dd className="font-medium text-sm">{actor ? `${actor.name} · ${actor.role}` : "Unknown"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Role gating</dt>
                  <dd className="font-medium text-sm">{rules.enforceRoleAccess ? "Enforced" : "Relaxed"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Active entities</dt>
                  <dd className="font-medium text-sm">
                    {entities.filter((entity) => entity.status === "Active").length} of {entities.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Records</dt>
                  <dd className="font-medium text-sm">
                    {workspace.campaigns.length} quotations · {workspace.financeInvoices.length} invoices
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuration &amp; data</CardTitle>
              <CardDescription>
                This workspace is a demo. Everything lives in this browser and no external service is connected.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={exportConfiguration}>
                  <Download aria-hidden="true" /> Export configuration
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload aria-hidden="true" /> Import
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(event) => void importConfiguration(event)}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                An export carries rules, conversion rates, team and entities. Records are never included, and an import
                never overwrites them.
              </p>

              <Separator />

              {confirmingReset ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm">Discard every record and restore the demo dataset?</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      window.localStorage.removeItem(WORKSPACE_KEY);
                      window.location.reload();
                    }}
                  >
                    Reset workspace
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmingReset(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setConfirmingReset(true)}>
                  <RotateCcw aria-hidden="true" /> Reset demo workspace
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Theme, layout and sidebar controls live in the dashboard header.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Use the controls beside the workspace badge, top right, to change theme preset, light and dark mode,
                content width, and sidebar style. Those preferences follow your account rather than this workspace.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operating agent</CardTitle>
              <CardDescription>Model provider, credentials and what the agent may change on its own.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/dashboard/agent/settings">
                  Open agent settings <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
