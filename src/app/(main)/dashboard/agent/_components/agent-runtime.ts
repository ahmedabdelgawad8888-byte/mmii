import {
  approvalAge,
  creatorBalance,
  invoiceBalance,
  quotationTotals,
  reportingAmount,
} from "../../companies/_components/commercial-model";
import type { CompaniesContextValue } from "../../companies/_components/companies-provider";
import type { AgentEntity } from "./agent-tools";

/**
 * Executes a model tool call against the live workspace.
 *
 * Reads return compact, citation-friendly shapes; writes go through the same
 * provider actions the UI uses, so validation, role gating, and the audit trail
 * all behave identically to a human performing the action.
 */

export interface ToolRunResult {
  ok: boolean;
  /** Rendered by the interface as generative UI when present. */
  render?: RenderPayload;
  data?: unknown;
  message?: string;
  citations?: Citation[];
}

export interface Citation {
  id: string;
  label: string;
  href: string;
}

export type RenderPayload =
  | { kind: "metrics"; tiles: { label: string; value: string; hint?: string }[] }
  | { kind: "table"; columns: string[]; rows: (string | number)[][]; entity: AgentEntity; ids: string[] }
  | { kind: "chart"; variant: "bar" | "donut"; title: string; unit: string; data: { label: string; value: number }[] }
  | { kind: "record"; title: string; subtitle?: string; fields: { label: string; value: string }[]; href?: string }
  | { kind: "exceptions"; items: { title: string; detail: string; severity: string; href: string }[] }
  | { kind: "navigate"; path: string };

type Workspace = CompaniesContextValue;

const money = (value: number, currency: string) =>
  `${currency} ${new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(Math.round(value))}`;

const compact = (value: number, currency: string) =>
  `${currency} ${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;

const openStages = ["Proposal / Price Quote", "Management Review", "Financial Review", "Released", "Sent To Client"];
const liveInvoiceStatuses = ["Issued", "Sent", "Partially Paid", "Overdue"];

function inScope(branch: string, workspace: Workspace) {
  return workspace.rules.activeScope === "Group" || branch === workspace.rules.activeScope;
}

function quotationHref(id: string) {
  return `/dashboard/companies/quotations/${id}`;
}

const entityHref: Record<AgentEntity, (id: string) => string> = {
  leads: (id) => `/dashboard/companies/leads/${id}`,
  companies: (id) => `/dashboard/companies/${id}`,
  brands: () => "/dashboard/companies/brands",
  quotations: quotationHref,
  invoices: (id) => `/dashboard/finance/invoices/${id}`,
  activities: () => "/dashboard/companies/activities",
  expenses: () => "/dashboard/finance/planning",
  creatorLedger: () => "/dashboard/companies/creator-ledger",
  campaigns: (id) => `/dashboard/campaigns/${id}`,
  influencers: () => "/dashboard/campaigns",
  operationsQueue: () => "/dashboard/operations",
  team: () => "/dashboard/companies/settings",
};

// --------------------------------------------------------------------- reads

function metricsResult(workspace: Workspace): ToolRunResult {
  const base = workspace.rules.baseCurrency;
  const scoped = workspace.campaigns.filter((item) => inScope(item.branch, workspace));
  const open = scoped.filter((item) => openStages.includes(item.stage));
  const won = scoped.filter((item) => item.stage === "Client Approved");
  const lost = scoped.filter((item) => item.stage === "Client Not Approved");
  const receivable = workspace.financeInvoices
    .filter((item) => inScope(item.entity, workspace) && liveInvoiceStatuses.includes(item.status))
    .reduce(
      (sum, item) =>
        sum +
        (invoiceBalance(item) * (item.fxSnapshot?.rate ?? workspace.fxToSar[item.currency])) / workspace.fxToSar[base],
      0,
    );
  const decisions = won.length + lost.length;
  const overdue = workspace.activities.filter(
    (item) => item.status === "Open" && item.dueDate && item.dueDate < new Date().toISOString().slice(0, 10),
  ).length;
  const breaches = scoped.filter(
    (item) => ["Management Review", "Financial Review"].includes(item.stage) && approvalAge(item).hours >= 48,
  ).length;

  const sum = (list: typeof scoped) => list.reduce((total, item) => total + reportingAmount(item, workspace), 0);

  return {
    ok: true,
    data: {
      scope: workspace.rules.activeScope,
      baseCurrency: base,
      openPipeline: Math.round(sum(open)),
      wonBusiness: Math.round(sum(won)),
      outstandingReceivables: Math.round(receivable),
      winRatePercent: decisions ? Math.round((won.length / decisions) * 100) : null,
      activeQuotations: open.length,
      overdueTasks: overdue,
      approvalSlaBreaches: breaches,
    },
    render: {
      kind: "metrics",
      tiles: [
        { label: "Open pipeline", value: compact(sum(open), base), hint: `${open.length} active quotations` },
        { label: "Won business", value: compact(sum(won), base), hint: `${won.length} client approvals` },
        { label: "Outstanding AR", value: compact(receivable, base), hint: "Issued, net of receipts" },
        {
          label: "Win rate",
          value: decisions ? `${Math.round((won.length / decisions) * 100)}%` : "—",
          hint: `${overdue} overdue tasks · ${breaches} SLA breaches`,
        },
      ],
    },
  };
}

function matches(haystack: (string | undefined)[], query?: string) {
  if (!query) return true;
  const needle = query.toLowerCase();
  return haystack.some((value) => value?.toLowerCase().includes(needle));
}

function listResult(workspace: Workspace, input: Record<string, unknown>): ToolRunResult {
  const entity = input.entity as AgentEntity;
  const limit = Math.min(Number(input.limit ?? 15) || 15, 50);
  const query = input.query as string | undefined;
  const stage = input.stage as string | undefined;
  const status = input.status as string | undefined;
  const branch = input.branch as string | undefined;
  const owner = input.owner as string | undefined;
  const base = workspace.rules.baseCurrency;

  const companyName = (id: string) => workspace.companies.find((c) => c.id === id)?.name ?? "—";

  switch (entity) {
    case "quotations": {
      const rows = workspace.campaigns
        .filter((item) => inScope(item.branch, workspace))
        .filter((item) => (stage ? item.stage === stage : true))
        .filter((item) => (branch ? item.branch === branch : true))
        .filter((item) => (owner ? item.owner === owner : true))
        .filter((item) => matches([item.name, item.id, companyName(item.companyId), item.owner], query))
        .slice(0, limit);
      return {
        ok: true,
        data: rows.map((r) => ({ id: r.id, name: r.name, stage: r.stage, value: r.budget, currency: r.currency })),
        render: {
          kind: "table",
          entity,
          columns: ["Quotation", "Company", "Stage", "Owner", `Value (${base})`],
          ids: rows.map((r) => r.id),
          rows: rows.map((r) => [
            r.name,
            companyName(r.companyId),
            r.stage,
            r.owner,
            money(reportingAmount(r, workspace), base),
          ]),
        },
        citations: rows.map((r) => ({ id: r.id, label: r.name, href: quotationHref(r.id) })),
      };
    }
    case "invoices": {
      const rows = workspace.financeInvoices
        .filter((item) => inScope(item.entity, workspace))
        .filter((item) => (status ? item.status === status : true))
        .filter((item) => matches([item.id, companyName(item.companyId), item.poNumber], query))
        .slice(0, limit);
      return {
        ok: true,
        data: rows.map((r) => ({ id: r.id, status: r.status, amount: r.amount, balance: invoiceBalance(r) })),
        render: {
          kind: "table",
          entity,
          columns: ["Invoice", "Company", "Status", "Due", "Balance"],
          ids: rows.map((r) => r.id),
          rows: rows.map((r) => [
            r.id,
            companyName(r.companyId),
            r.status,
            r.dueDate.slice(0, 10),
            money(invoiceBalance(r), r.currency),
          ]),
        },
        citations: rows.map((r) => ({ id: r.id, label: r.id, href: entityHref.invoices(r.id) })),
      };
    }
    case "leads": {
      const rows = workspace.leads
        .filter((item) => inScope(item.branch, workspace))
        .filter((item) => (status ? item.status === status : true))
        .filter((item) => (owner ? item.owner === owner : true))
        .filter((item) => matches([item.leadName, item.companyName, item.owner, item.id], query))
        .slice(0, limit);
      return {
        ok: true,
        data: rows.map((r) => ({ id: r.id, name: r.leadName, status: r.status, source: r.source })),
        render: {
          kind: "table",
          entity,
          columns: ["Lead", "Company", "Status", "Source", "Owner"],
          ids: rows.map((r) => r.id),
          rows: rows.map((r) => [r.leadName, r.companyName, r.status, r.source, r.owner]),
        },
        citations: rows.map((r) => ({ id: r.id, label: r.leadName, href: entityHref.leads(r.id) })),
      };
    }
    case "companies": {
      const rows = workspace.companies
        .filter((item) => inScope(item.branch, workspace))
        .filter((item) => (status ? item.status === status : true))
        .filter((item) => matches([item.name, item.industry, item.owner, item.id], query))
        .slice(0, limit);
      return {
        ok: true,
        data: rows.map((r) => ({ id: r.id, name: r.name, status: r.status, branch: r.branch })),
        render: {
          kind: "table",
          entity,
          columns: ["Company", "Market", "Industry", "Owner", "Status"],
          ids: rows.map((r) => r.id),
          rows: rows.map((r) => [r.name, r.branch, r.industry, r.owner, r.status]),
        },
        citations: rows.map((r) => ({ id: r.id, label: r.name, href: entityHref.companies(r.id) })),
      };
    }
    case "brands": {
      const rows = workspace.brands
        .filter((item) => matches([item.name, companyName(item.companyId), item.owner], query))
        .slice(0, limit);
      return {
        ok: true,
        data: rows,
        render: {
          kind: "table",
          entity,
          columns: ["Brand", "Company", "Owner", "Requested", "Used"],
          ids: rows.map((r) => r.id),
          rows: rows.map((r) => [r.name, companyName(r.companyId), r.owner, r.requestedInfluencers, r.usedInfluencers]),
        },
      };
    }
    case "activities": {
      const rows = workspace.activities
        .filter((item) => (status ? item.status === status : true))
        .filter((item) => (owner ? item.owner === owner : true))
        .filter((item) => matches([item.title, item.owner, companyName(item.companyId)], query))
        .slice(0, limit);
      return {
        ok: true,
        data: rows,
        render: {
          kind: "table",
          entity,
          columns: ["Activity", "Type", "Company", "Owner", "Due"],
          ids: rows.map((r) => r.id),
          rows: rows.map((r) => [r.title, r.type, companyName(r.companyId), r.owner ?? "—", r.dueDate ?? "—"]),
        },
      };
    }
    case "expenses": {
      const rows = workspace.expenses
        .filter((item) => matches([item.supplier, item.quotationId], query))
        .slice(0, limit);
      return {
        ok: true,
        data: rows,
        render: {
          kind: "table",
          entity,
          columns: ["Supplier", "Category", "Amount", "Due", "Paid"],
          ids: rows.map((r) => r.id),
          rows: rows.map((r) => [
            r.supplier,
            r.category,
            money(r.amount, r.currency),
            r.dueDate,
            r.paid ? "Yes" : "No",
          ]),
        },
      };
    }
    case "creatorLedger": {
      const rows = workspace.creatorLedger.filter((item) => matches([item.note, item.kind], query)).slice(0, limit);
      return {
        ok: true,
        data: rows,
        render: {
          kind: "table",
          entity,
          columns: ["Kind", "Quantity", "Company", "Note", "Date"],
          ids: rows.map((r) => r.id),
          rows: rows.map((r) => [r.kind, r.quantity, companyName(r.companyId), r.note, r.createdAt]),
        },
      };
    }
    case "campaigns": {
      const rows = workspace.activationCampaigns
        .filter((item) => (status ? item.status === status : true))
        .filter((item) => matches([item.name, item.city, item.campaignOwner], query))
        .slice(0, limit);
      return {
        ok: true,
        data: rows,
        render: {
          kind: "table",
          entity,
          columns: ["Campaign", "Market", "Owner", "Target", "Health"],
          ids: rows.map((r) => r.id),
          rows: rows.map((r) => [r.name, r.branch, r.campaignOwner, r.target, r.health]),
        },
        citations: rows.map((r) => ({ id: r.id, label: r.name, href: entityHref.campaigns(r.id) })),
      };
    }
    case "influencers": {
      const rows = workspace.influencers
        .filter((item) => (stage ? item.stage === stage : true))
        .filter((item) => matches([item.name, item.handle, item.owner], query))
        .slice(0, limit);
      return {
        ok: true,
        data: rows,
        render: {
          kind: "table",
          entity,
          columns: ["Creator", "Handle", "Stage", "Owner"],
          ids: rows.map((r) => r.id),
          rows: rows.map((r) => [r.name, r.handle, r.stage, r.owner]),
        },
      };
    }
    case "operationsQueue": {
      const rows = workspace.operationsQueue
        .filter((item) => (status ? item.status === status : true))
        .filter((item) => matches([item.nextAction, item.owner, item.queue], query))
        .slice(0, limit);
      return {
        ok: true,
        data: rows,
        render: {
          kind: "table",
          entity,
          columns: ["Queue", "Next action", "Owner", "Priority", "Deadline"],
          ids: rows.map((r) => r.id),
          rows: rows.map((r) => [r.queue, r.nextAction, r.owner, r.priority, r.deadline]),
        },
      };
    }
    case "team": {
      const rows = workspace.team.filter((item) => matches([item.name, item.role, item.branch], query)).slice(0, limit);
      return {
        ok: true,
        data: rows,
        render: {
          kind: "table",
          entity,
          columns: ["Name", "Role", "Market", "Email"],
          ids: rows.map((r) => r.id),
          rows: rows.map((r) => [r.name, r.role, r.branch, r.email]),
        },
      };
    }
    default:
      return { ok: false, message: `Unknown entity "${String(entity)}".` };
  }
}

function recordResult(workspace: Workspace, input: Record<string, unknown>): ToolRunResult {
  const entity = input.entity as AgentEntity;
  const id = String(input.id);
  const base = workspace.rules.baseCurrency;
  const companyName = (companyId: string) => workspace.companies.find((c) => c.id === companyId)?.name ?? "—";

  if (entity === "quotations") {
    const quotation = workspace.campaigns.find((item) => item.id === id);
    if (!quotation) return { ok: false, message: `Quotation ${id} was not found.` };
    const totals = quotation.pricing ? quotationTotals(quotation.requestedInfluencers, quotation.pricing) : null;
    const age = approvalAge(quotation);
    return {
      ok: true,
      data: { ...quotation, totals },
      render: {
        kind: "record",
        title: quotation.name,
        subtitle: `${companyName(quotation.companyId)} · ${quotation.branch}`,
        href: quotationHref(quotation.id),
        fields: [
          { label: "Stage", value: quotation.stage },
          { label: "Approval", value: quotation.approvalStatus },
          { label: "Owner", value: quotation.owner },
          { label: "Creators", value: String(quotation.requestedInfluencers) },
          { label: "Value", value: money(quotation.budget, quotation.currency) },
          { label: `Value (${base})`, value: money(reportingAmount(quotation, workspace), base) },
          { label: "Margin", value: totals ? money(totals.margin, quotation.currency) : "Not priced" },
          { label: "Waiting", value: `${Math.round(age.hours)}h · ${age.label}` },
          { label: "Expected close", value: quotation.expectedCloseDate ?? "Not set" },
        ],
      },
      citations: [{ id: quotation.id, label: quotation.name, href: quotationHref(quotation.id) }],
    };
  }

  if (entity === "invoices") {
    const invoice = workspace.financeInvoices.find((item) => item.id === id);
    if (!invoice) return { ok: false, message: `Invoice ${id} was not found.` };
    return {
      ok: true,
      data: invoice,
      render: {
        kind: "record",
        title: invoice.id,
        subtitle: `${companyName(invoice.companyId)} · ${invoice.entity}`,
        href: entityHref.invoices(invoice.id),
        fields: [
          { label: "Status", value: invoice.status },
          { label: "Amount", value: money(invoice.amount, invoice.currency) },
          { label: "Paid", value: money(invoice.paidAmount, invoice.currency) },
          { label: "Balance", value: money(invoiceBalance(invoice), invoice.currency) },
          { label: "Due", value: invoice.dueDate.slice(0, 10) },
          { label: "Terms", value: invoice.paymentTerms ?? "—" },
          { label: "PO", value: invoice.poNumber || "—" },
          { label: "Collections", value: invoice.collectionsOwner ?? "—" },
        ],
      },
      citations: [{ id: invoice.id, label: invoice.id, href: entityHref.invoices(invoice.id) }],
    };
  }

  if (entity === "companies") {
    const company = workspace.companies.find((item) => item.id === id);
    if (!company) return { ok: false, message: `Company ${id} was not found.` };
    const quotations = workspace.campaigns.filter((item) => item.companyId === id);
    return {
      ok: true,
      data: { ...company, quotationCount: quotations.length },
      render: {
        kind: "record",
        title: company.name,
        subtitle: `${company.branch} · ${company.industry}`,
        href: entityHref.companies(company.id),
        fields: [
          { label: "Status", value: company.status },
          { label: "Owner", value: company.owner },
          { label: "Contact", value: company.contactPerson || "—" },
          { label: "Email", value: company.email || "—" },
          { label: "Quotations", value: String(quotations.length) },
          { label: "Creators used", value: `${company.usedInfluencers} of ${company.requestedInfluencers}` },
        ],
      },
      citations: [{ id: company.id, label: company.name, href: entityHref.companies(company.id) }],
    };
  }

  if (entity === "leads") {
    const lead = workspace.leads.find((item) => item.id === id);
    if (!lead) return { ok: false, message: `Lead ${id} was not found.` };
    return {
      ok: true,
      data: lead,
      render: {
        kind: "record",
        title: lead.leadName,
        subtitle: `${lead.companyName} · ${lead.branch}`,
        href: entityHref.leads(lead.id),
        fields: [
          { label: "Status", value: lead.status },
          { label: "Source", value: lead.source },
          { label: "Owner", value: lead.owner },
          { label: "Last activity", value: lead.lastActivityAt ?? "None" },
          { label: "Next activity", value: lead.nextActivityAt ?? "Not scheduled" },
          { label: "Opportunity", value: String(lead.opportunityValue ?? 0) },
        ],
      },
      citations: [{ id: lead.id, label: lead.leadName, href: entityHref.leads(lead.id) }],
    };
  }

  const fallback = listResult(workspace, { entity, query: id, limit: 5 });
  return fallback;
}

function exceptionsResult(workspace: Workspace): ToolRunResult {
  const today = new Date().toISOString().slice(0, 10);
  const items: { title: string; detail: string; severity: string; href: string }[] = [];

  for (const quotation of workspace.campaigns) {
    if (!inScope(quotation.branch, workspace)) continue;
    if (["Management Review", "Financial Review"].includes(quotation.stage)) {
      const age = approvalAge(quotation);
      if (age.hours >= 24) {
        items.push({
          title: quotation.name,
          detail: `${quotation.stage} · ${Math.round(age.hours)}h waiting`,
          severity: age.hours >= 48 ? "Escalate" : "Due soon",
          href: quotationHref(quotation.id),
        });
      }
    }
    if (quotation.stage === "Client Approved" && !quotation.invoiceId) {
      items.push({
        title: quotation.name,
        detail: "Client approved with no invoice raised",
        severity: "Escalate",
        href: quotationHref(quotation.id),
      });
    }
  }

  for (const activity of workspace.activities) {
    if (activity.status === "Open" && activity.dueDate && activity.dueDate < today) {
      items.push({
        title: activity.title,
        detail: `Task past its due date · ${activity.owner ?? "Unassigned"}`,
        severity: "Overdue",
        href: "/dashboard/companies/tasks",
      });
    }
  }

  for (const invoice of workspace.financeInvoices) {
    if (
      liveInvoiceStatuses.includes(invoice.status) &&
      invoice.dueDate.slice(0, 10) < today &&
      invoiceBalance(invoice) > 0
    ) {
      items.push({
        title: invoice.id,
        detail: `Overdue balance ${money(invoiceBalance(invoice), invoice.currency)}`,
        severity: "Overdue",
        href: entityHref.invoices(invoice.id),
      });
    }
  }

  const order: Record<string, number> = { Escalate: 0, Overdue: 1, "Due soon": 2 };
  items.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));
  const top = items.slice(0, 12);

  return {
    ok: true,
    data: { total: items.length, items: top },
    render: { kind: "exceptions", items: top },
  };
}

function chartResult(workspace: Workspace, input: Record<string, unknown>): ToolRunResult {
  const series = String(input.series);
  const base = workspace.rules.baseCurrency;
  const scoped = workspace.campaigns.filter((item) => inScope(item.branch, workspace));

  const build = (
    variant: "bar" | "donut",
    title: string,
    unit: string,
    data: { label: string; value: number }[],
  ): ToolRunResult => ({
    ok: true,
    data: { series, unit, points: data },
    render: { kind: "chart", variant, title, unit, data },
  });

  switch (series) {
    case "pipeline_by_stage": {
      const stages: [string, string][] = [
        ["Proposal / Price Quote", "Draft"],
        ["Management Review", "Management"],
        ["Financial Review", "Finance"],
        ["Released", "Released"],
        ["Sent To Client", "With client"],
        ["Client Approved", "Won"],
      ];
      return build(
        "bar",
        "Where commercial value sits",
        base,
        stages.map(([stage, label]) => ({
          label,
          value: Math.round(
            scoped.filter((i) => i.stage === stage).reduce((sum, i) => sum + reportingAmount(i, workspace), 0),
          ),
        })),
      );
    }
    case "revenue_by_market": {
      const markets = [...new Set(workspace.companies.map((c) => c.branch))];
      return build(
        "bar",
        "Won business by market",
        base,
        markets.map((market) => ({
          label: market,
          value: Math.round(
            scoped
              .filter((i) => i.branch === market && i.stage === "Client Approved")
              .reduce((sum, i) => sum + reportingAmount(i, workspace), 0),
          ),
        })),
      );
    }
    case "creator_entitlement": {
      const balance = creatorBalance(workspace.creatorLedger);
      return build("donut", "Creator entitlement mix", "creators", [
        { label: "Available", value: balance.available },
        { label: "Reserved", value: balance.reserved },
        { label: "Consumed", value: balance.consumed },
        { label: "Expired", value: balance.expired },
      ]);
    }
    case "cash_commitments": {
      const now = Date.now();
      const points = Array.from({ length: 4 }, (_, index) => {
        const start = new Date(now + index * 7 * 86_400_000).toISOString().slice(0, 10);
        const end = new Date(now + (index + 1) * 7 * 86_400_000).toISOString().slice(0, 10);
        const receipts = workspace.financeInvoices
          .filter(
            (i) =>
              liveInvoiceStatuses.includes(i.status) && i.dueDate.slice(0, 10) >= start && i.dueDate.slice(0, 10) < end,
          )
          .reduce((sum, i) => sum + (invoiceBalance(i) * workspace.fxToSar[i.currency]) / workspace.fxToSar[base], 0);
        return { label: `Week ${index + 1}`, value: Math.round(receipts) };
      });
      return build("bar", "Expected receipts, next four weeks", base, points);
    }
    case "cost_vs_budget": {
      const points = scoped
        .filter((i) => i.pricing)
        .map((i) => ({
          label: i.name.length > 18 ? `${i.name.slice(0, 18)}…` : i.name,
          value: Math.round(
            workspace.expenses
              .filter((e) => e.quotationId === i.id)
              .reduce((sum, e) => sum + (e.amount * workspace.fxToSar[e.currency]) / workspace.fxToSar[base], 0),
          ),
        }))
        .filter((p) => p.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
      return build("bar", "Recorded cost by quotation", base, points);
    }
    case "owner_performance": {
      const owners = [...new Set(scoped.map((i) => i.owner))];
      return build(
        "bar",
        "Open pipeline by owner",
        base,
        owners
          .map((owner) => ({
            label: owner,
            value: Math.round(
              scoped
                .filter((i) => i.owner === owner && openStages.includes(i.stage))
                .reduce((sum, i) => sum + reportingAmount(i, workspace), 0),
            ),
          }))
          .sort((a, b) => b.value - a.value),
      );
    }
    case "lead_sources": {
      const sources = [...new Set(workspace.leads.map((l) => l.source))];
      return build(
        "donut",
        "Leads by acquisition source",
        "leads",
        sources.map((source) => ({
          label: source,
          value: workspace.leads.filter((l) => l.source === source).length,
        })),
      );
    }
    default:
      return { ok: false, message: `Unknown series "${series}".` };
  }
}

// -------------------------------------------------------------------- writes

const ok = (message: string, citations?: Citation[]): ToolRunResult => ({ ok: true, message, citations });
const fail = (message: string): ToolRunResult => ({ ok: false, message });

/**
 * Provider actions surface failures by returning false and raising a toast, so
 * a false return is reported back to the model as a refusal it must respect.
 */
function guard(result: boolean, success: string, failure: string, citations?: Citation[]): ToolRunResult {
  return result ? ok(success, citations) : fail(failure);
}

export function runAgentTool(
  workspace: Workspace,
  navigateTo: (path: string) => void,
  name: string,
  rawInput: unknown,
): ToolRunResult {
  const input = (rawInput ?? {}) as Record<string, unknown>;
  const str = (key: string) => String(input[key] ?? "");
  const num = (key: string) => Number(input[key] ?? 0);

  switch (name) {
    case "get_metrics":
      return metricsResult(workspace);
    case "list_records":
      return listResult(workspace, input);
    case "get_record":
      return recordResult(workspace, input);
    case "needs_attention":
      return exceptionsResult(workspace);
    case "chart_data":
      return chartResult(workspace, input);
    case "navigate": {
      const path = str("path");
      if (!path.startsWith("/")) return fail("Path must start with a slash.");
      navigateTo(path);
      return { ok: true, message: `Opened ${path}`, render: { kind: "navigate", path } };
    }

    case "create_lead": {
      const id = workspace.addLead({
        firstName: str("firstName"),
        lastName: str("lastName"),
        companyName: str("companyName"),
        phone: str("phone"),
        email: str("email"),
        branch: input.branch as never,
        owner: str("owner"),
        source: input.source as never,
      });
      const label = `${str("firstName")} ${str("lastName")}`.trim() || id;
      return ok(`Created lead ${id}.`, [{ id, label, href: entityHref.leads(id) }]);
    }
    case "create_company": {
      const id = workspace.addCompany({
        name: str("name"),
        contactPerson: str("contactPerson"),
        phone: str("phone"),
        email: str("email"),
        industry: str("industry"),
        owner: str("owner"),
        branch: input.branch as never,
        status: (input.status as never) ?? ("Prospect" as never),
      });
      return ok(`Created company ${id}.`, [{ id, label: str("name"), href: entityHref.companies(id) }]);
    }
    case "create_brand": {
      const id = workspace.addBrand({
        name: str("name"),
        companyId: str("companyId"),
        contactPerson: str("contactPerson"),
        status: (input.status as never) ?? ("Active" as never),
      });
      return ok(`Created brand ${id}.`);
    }
    case "log_activity": {
      workspace.addActivity(
        str("companyId"),
        input.type as never,
        str("title"),
        input.dueDate ? str("dueDate") : undefined,
      );
      return ok("Activity logged.");
    }
    case "qualify_lead": {
      workspace.qualifyLead(str("leadId"));
      return ok(`Lead ${str("leadId")} qualified.`);
    }
    case "convert_lead": {
      const id = workspace.convertLead(str("leadId"), Boolean(input.createQuotation));
      return id ? ok(`Lead converted into ${id}.`) : fail("The lead could not be converted.");
    }

    case "create_quotation": {
      const id = workspace.addCampaign({
        name: str("name"),
        companyId: str("companyId"),
        brandId: (input.brandId as string | null) ?? null,
        budget: num("budget"),
        requestedInfluencers: num("requestedInfluencers"),
      });
      if (!id) return fail("The quotation could not be created; check the company id.");
      return ok(`Created quotation ${id}.`, [{ id, label: str("name"), href: quotationHref(id) }]);
    }
    case "price_quotation": {
      const done = workspace.saveQuotationPricing(
        str("quotationId"),
        {
          unitPrice: num("unitPrice"),
          freeCreators: num("freeCreators"),
          discount: num("discount"),
          serviceFee: num("serviceFee"),
          vatPercent: num("vatPercent"),
          credit: num("credit"),
          influencerCost: num("influencerCost"),
          executionCost: num("executionCost"),
          operationsCost: num("operationsCost"),
        },
        num("quantity"),
        str("expectedCloseDate"),
      );
      return guard(
        done,
        `Pricing saved on ${str("quotationId")}.`,
        "Pricing was rejected; the quotation may be locked for approval.",
        [{ id: str("quotationId"), label: str("quotationId"), href: quotationHref(str("quotationId")) }],
      );
    }
    case "advance_quotation": {
      workspace.progressCampaign(str("quotationId"));
      return ok(`Advanced ${str("quotationId")}.`, [
        { id: str("quotationId"), label: str("quotationId"), href: quotationHref(str("quotationId")) },
      ]);
    }
    case "close_quotation": {
      const done = workspace.closeQuotation(
        str("quotationId"),
        input.decision as never,
        input.reason as never,
        str("notes"),
      );
      return guard(done, `Closed ${str("quotationId")}.`, "The quotation could not be closed in its current stage.");
    }

    case "review_quotation": {
      const decision = str("decision");
      const id = str("quotationId");
      if (decision === "approve") {
        workspace.progressCampaign(id);
        return ok(`Approved ${id}.`, [{ id, label: id, href: quotationHref(id) }]);
      }
      if (decision === "reject") {
        workspace.rejectCampaign(id);
        return ok(`Rejected ${id}.`);
      }
      workspace.requestRevision(id);
      return ok(`Requested changes on ${id}.`);
    }

    case "create_invoice": {
      const done = workspace.createQuotationInvoice(str("quotationId"));
      return guard(
        done,
        `Invoice raised for ${str("quotationId")}.`,
        "An invoice could not be raised for that quotation.",
      );
    }
    case "issue_invoice": {
      const done = workspace.issueFinanceInvoice(str("invoiceId"));
      return guard(done, `Issued ${str("invoiceId")}.`, "The invoice could not be issued from its current status.", [
        { id: str("invoiceId"), label: str("invoiceId"), href: entityHref.invoices(str("invoiceId")) },
      ]);
    }
    case "update_invoice_status": {
      const done = workspace.updateInvoiceStatus(
        str("invoiceId"),
        input.action as never,
        input.reason ? str("reason") : undefined,
        input.amount === undefined ? undefined : num("amount"),
      );
      return guard(done, `${str("action")} applied to ${str("invoiceId")}.`, "That invoice transition is not allowed.");
    }
    case "record_payment": {
      workspace.recordPayment(str("invoiceId"), num("amount"));
      return ok(`Recorded a receipt against ${str("invoiceId")}.`, [
        { id: str("invoiceId"), label: str("invoiceId"), href: entityHref.invoices(str("invoiceId")) },
      ]);
    }
    case "add_expense": {
      const done = workspace.addFinanceExpense({
        quotationId: str("quotationId"),
        companyId: str("companyId"),
        supplier: str("supplier"),
        category: input.category as never,
        amount: num("amount"),
        currency: input.currency as never,
        dueDate: str("dueDate"),
        reference: str("reference"),
      });
      return guard(done, "Cost recorded.", "The cost could not be recorded; check the quotation id.");
    }
    case "post_creator_entry": {
      const done = workspace.postCreatorEntry({
        companyId: str("companyId"),
        brandId: (input.brandId as string | null) ?? null,
        quotationId: input.quotationId ? str("quotationId") : undefined,
        kind: input.kind as never,
        quantity: num("quantity"),
        note: str("note"),
      });
      return guard(done, "Ledger entry posted.", "That entry would take the balance negative.");
    }

    case "update_fx_rate": {
      workspace.updateFx(input.currency as never, num("rate"));
      return ok(`${str("currency")} rate updated.`);
    }
    case "set_operating_scope": {
      workspace.setScope(input.scope as never);
      return ok(`Scope set to ${str("scope")}.`);
    }

    default:
      return fail(`Unknown tool "${name}".`);
  }
}
