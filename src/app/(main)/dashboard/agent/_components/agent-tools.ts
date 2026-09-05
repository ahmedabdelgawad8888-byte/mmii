import { z } from "zod";

/**
 * Tool catalogue shared by the server route and the browser.
 *
 * The workspace lives in React state and localStorage, so no tool declares an
 * `execute`. The model's calls are forwarded to the client, gated by the
 * permission matrix, then run against the companies provider.
 */

export const toolCategories = ["read", "create", "quotation", "approval", "finance", "admin"] as const;
export type ToolCategory = (typeof toolCategories)[number];

export type ToolPolicy = "auto" | "confirm" | "blocked";

export const categoryLabels: Record<ToolCategory, { title: string; description: string }> = {
  read: { title: "Read & search", description: "Query records, metrics, and exceptions." },
  create: { title: "Create CRM records", description: "Add leads, companies, brands, and activities." },
  quotation: { title: "Quotations & pricing", description: "Draft, price, advance, and close quotations." },
  approval: { title: "Approvals", description: "Management and finance decisions on quotations." },
  finance: { title: "Invoices & payments", description: "Invoices, receipts, expenses, and creator entitlements." },
  admin: { title: "Workspace settings", description: "Rules, FX rates, and acting identity." },
};

/** Defaults follow the principle that money and approvals always need a human. */
export const defaultPolicies: Record<ToolCategory, ToolPolicy> = {
  read: "auto",
  create: "auto",
  quotation: "confirm",
  approval: "confirm",
  finance: "confirm",
  admin: "blocked",
};

const entityEnum = z.enum([
  "leads",
  "companies",
  "brands",
  "quotations",
  "invoices",
  "activities",
  "expenses",
  "creatorLedger",
  "campaigns",
  "influencers",
  "operationsQueue",
  "team",
]);
export type AgentEntity = z.infer<typeof entityEnum>;

const branchEnum = z.enum(["Saudi Arabia", "Egypt", "UAE", "Kuwait", "Qatar", "Bahrain"]);
const lossReasonEnum = z.enum([
  "Budget",
  "Price",
  "Timing",
  "Competitor",
  "Client ghosted",
  "Scope changed",
  "Campaign cancelled",
  "Creators unavailable",
  "Internal delay",
  "Other",
]);

export interface AgentToolSpec {
  category: ToolCategory;
  description: string;
  inputSchema: z.ZodType;
  /** Short sentence rendered on the approval card, so a reviewer sees intent before JSON. */
  summarize: (input: Record<string, unknown>) => string;
}

const s = (value: unknown) => String(value ?? "");

export const agentTools = {
  // ---------------------------------------------------------------- read
  get_metrics: {
    category: "read",
    description:
      "Headline commercial position for the active scope: open pipeline, won business, receivables, win rate, overdue work, and approval SLA breaches. Call this first for any 'how are we doing' question.",
    inputSchema: z.object({}),
    summarize: () => "Read workspace metrics",
  },
  list_records: {
    category: "read",
    description:
      "List records of one entity with optional filtering. Returns a compact table the interface renders directly. Use `query` for free text and `stage`/`status`/`branch`/`owner` to narrow.",
    inputSchema: z.object({
      entity: entityEnum,
      query: z.string().optional().describe("Free-text match on name, company, owner, or id"),
      stage: z.string().optional(),
      status: z.string().optional(),
      branch: branchEnum.optional(),
      owner: z.string().optional(),
      limit: z.number().int().min(1).max(50).default(15),
    }),
    summarize: (i) => `List ${s(i.entity)}`,
  },
  get_record: {
    category: "read",
    description: "Full detail for a single record, including its linked activities, history, and computed totals.",
    inputSchema: z.object({ entity: entityEnum, id: z.string() }),
    summarize: (i) => `Open ${s(i.id)}`,
  },
  needs_attention: {
    category: "read",
    description:
      "Operational exceptions ordered by urgency: approvals past SLA, overdue tasks, quotations sitting with the client, approved deals without invoices, and overdue invoices.",
    inputSchema: z.object({}),
    summarize: () => "Read the exception queue",
  },
  chart_data: {
    category: "read",
    description:
      "Aggregated series for a chart. Use this instead of listing records when the user asks about distribution, comparison, or trend. The interface renders the result as a real chart.",
    inputSchema: z.object({
      series: z.enum([
        "pipeline_by_stage",
        "revenue_by_market",
        "creator_entitlement",
        "cash_commitments",
        "cost_vs_budget",
        "owner_performance",
        "lead_sources",
      ]),
    }),
    summarize: (i) => `Chart ${s(i.series).replace(/_/g, " ")}`,
  },
  navigate: {
    category: "read",
    description:
      "Open a page in the dashboard for the user. Use a dashboard path such as /dashboard/companies/quotations or /dashboard/finance/invoices.",
    inputSchema: z.object({ path: z.string(), reason: z.string().optional() }),
    summarize: (i) => `Open ${s(i.path)}`,
  },

  // -------------------------------------------------------------- create
  create_lead: {
    category: "create",
    description: "Create a lead in the CRM.",
    inputSchema: z.object({
      firstName: z.string(),
      lastName: z.string(),
      companyName: z.string(),
      phone: z.string().default(""),
      email: z.string().default(""),
      branch: branchEnum,
      owner: z.string(),
      source: z.enum(["Website", "Referral", "Cold Call", "Instagram", "LinkedIn", "Event", "Partner"]),
    }),
    summarize: (i) => `Create lead ${s(i.firstName)} ${s(i.lastName)} at ${s(i.companyName)}`,
  },
  create_company: {
    category: "create",
    description: "Create a company (the commercial master account).",
    inputSchema: z.object({
      name: z.string(),
      contactPerson: z.string().default(""),
      phone: z.string().default(""),
      email: z.string().default(""),
      industry: z.string(),
      owner: z.string(),
      branch: branchEnum,
      status: z.enum(["Active", "Prospect", "Inactive"]).default("Prospect"),
    }),
    summarize: (i) => `Create company "${s(i.name)}"`,
  },
  create_brand: {
    category: "create",
    description: "Create a brand underneath an existing company.",
    inputSchema: z.object({
      name: z.string(),
      companyId: z.string(),
      contactPerson: z.string().default(""),
      status: z.enum(["Active", "Prospect", "Inactive"]).default("Active"),
    }),
    summarize: (i) => `Create brand "${s(i.name)}"`,
  },
  log_activity: {
    category: "create",
    description: "Log a meeting, call, task, or note against a company.",
    inputSchema: z.object({
      companyId: z.string(),
      type: z.enum(["Meeting", "Call", "Task", "Note"]),
      title: z.string(),
      dueDate: z.string().optional().describe("ISO date, for tasks"),
    }),
    summarize: (i) => `Log ${s(i.type).toLowerCase()}: "${s(i.title)}"`,
  },
  qualify_lead: {
    category: "create",
    description: "Mark a lead as qualified.",
    inputSchema: z.object({ leadId: z.string() }),
    summarize: (i) => `Qualify lead ${s(i.leadId)}`,
  },
  convert_lead: {
    category: "create",
    description: "Convert a qualified lead into a company, optionally opening a first quotation.",
    inputSchema: z.object({ leadId: z.string(), createQuotation: z.boolean().default(false) }),
    summarize: (i) => `Convert lead ${s(i.leadId)} into a company`,
  },

  // ----------------------------------------------------------- quotation
  create_quotation: {
    category: "quotation",
    description: "Open a quotation for a company, in that market's local currency.",
    inputSchema: z.object({
      name: z.string(),
      companyId: z.string(),
      brandId: z.string().nullable().default(null),
      budget: z.number().min(0).describe("Opening value in the market's local currency"),
      requestedInfluencers: z.number().int().min(1),
    }),
    summarize: (i) => `Create quotation "${s(i.name)}"`,
  },
  price_quotation: {
    category: "quotation",
    description:
      "Set the pricing breakdown on a quotation. The total is derived as (quantity x unitPrice) - discount + serviceFee + VAT - credit, and margin as subtotal - credit - costs.",
    inputSchema: z.object({
      quotationId: z.string(),
      quantity: z.number().int().min(1),
      unitPrice: z.number().min(0),
      freeCreators: z.number().int().min(0).default(0),
      discount: z.number().min(0).default(0),
      serviceFee: z.number().min(0).default(0),
      vatPercent: z.number().min(0).max(100).default(0),
      credit: z.number().min(0).default(0),
      influencerCost: z.number().min(0).default(0),
      executionCost: z.number().min(0).default(0),
      operationsCost: z.number().min(0).default(0),
      expectedCloseDate: z.string(),
    }),
    summarize: (i) => `Price ${s(i.quotationId)} at ${s(i.quantity)} x ${s(i.unitPrice)}`,
  },
  advance_quotation: {
    category: "quotation",
    description:
      "Move a quotation to its next lifecycle stage: draft to management review, to finance review, to released, to sent to client.",
    inputSchema: z.object({ quotationId: z.string() }),
    summarize: (i) => `Advance ${s(i.quotationId)} to the next stage`,
  },
  close_quotation: {
    category: "quotation",
    description: "Record a client decision that ends the quotation, with a structured loss reason.",
    inputSchema: z.object({
      quotationId: z.string(),
      decision: z.enum(["Client Not Approved", "Client Cancelled"]),
      reason: lossReasonEnum,
      notes: z.string().default(""),
    }),
    summarize: (i) => `Close ${s(i.quotationId)} as ${s(i.decision)}`,
  },

  // ------------------------------------------------------------ approval
  review_quotation: {
    category: "approval",
    description:
      "Record a management or finance decision on a quotation waiting for approval. Requires the acting user to hold that role.",
    inputSchema: z.object({
      quotationId: z.string(),
      decision: z.enum(["approve", "reject", "request_changes"]),
      note: z.string().default(""),
    }),
    summarize: (i) => `${s(i.decision).replace("_", " ")} ${s(i.quotationId)}`,
  },

  // ------------------------------------------------------------- finance
  create_invoice: {
    category: "finance",
    description: "Raise a draft invoice against a client-approved quotation.",
    inputSchema: z.object({ quotationId: z.string() }),
    summarize: (i) => `Create an invoice for ${s(i.quotationId)}`,
  },
  issue_invoice: {
    category: "finance",
    description: "Issue an approved invoice so it becomes collectable.",
    inputSchema: z.object({ invoiceId: z.string() }),
    summarize: (i) => `Issue invoice ${s(i.invoiceId)}`,
  },
  update_invoice_status: {
    category: "finance",
    description: "Submit, approve, send, void, or credit an invoice.",
    inputSchema: z.object({
      invoiceId: z.string(),
      action: z.enum(["Submit", "Approve", "Sent", "Void", "Credit"]),
      reason: z.string().optional(),
      amount: z.number().min(0).optional().describe("Credit note amount, required for Credit"),
    }),
    summarize: (i) => `${s(i.action)} invoice ${s(i.invoiceId)}`,
  },
  record_payment: {
    category: "finance",
    description: "Record a receipt against an issued invoice.",
    inputSchema: z.object({ invoiceId: z.string(), amount: z.number().min(0) }),
    summarize: (i) => `Record ${s(i.amount)} against ${s(i.invoiceId)}`,
  },
  add_expense: {
    category: "finance",
    description: "Record a supplier or execution cost against a quotation.",
    inputSchema: z.object({
      quotationId: z.string(),
      companyId: z.string(),
      supplier: z.string(),
      category: z.enum(["Influencer", "Execution", "Operations"]),
      amount: z.number().min(0),
      currency: z.enum(["SAR", "EGP", "AED", "KWD", "QAR", "BHD"]),
      dueDate: z.string(),
      reference: z.string().default(""),
    }),
    summarize: (i) => `Record ${s(i.currency)} ${s(i.amount)} cost from ${s(i.supplier)}`,
  },
  post_creator_entry: {
    category: "finance",
    description:
      "Post a creator entitlement movement. Kinds are Purchased, Bonus, Reserved, Released, Consumed, Expired, and Adjusted.",
    inputSchema: z.object({
      companyId: z.string(),
      brandId: z.string().nullable().default(null),
      quotationId: z.string().optional(),
      kind: z.enum(["Purchased", "Bonus", "Reserved", "Released", "Consumed", "Expired", "Adjusted"]),
      quantity: z.number().int().min(1),
      note: z.string().default(""),
    }),
    summarize: (i) => `Post ${s(i.quantity)} ${s(i.kind).toLowerCase()} creators`,
  },

  // --------------------------------------------------------------- admin
  update_fx_rate: {
    category: "admin",
    description: "Change a currency's conversion rate against the reporting currency.",
    inputSchema: z.object({ currency: z.enum(["SAR", "EGP", "AED", "KWD", "QAR", "BHD"]), rate: z.number().min(0) }),
    summarize: (i) => `Set ${s(i.currency)} rate to ${s(i.rate)}`,
  },
  set_operating_scope: {
    category: "admin",
    description: "Switch the reporting scope between Group and a single market.",
    inputSchema: z.object({ scope: z.enum(["Group", "Saudi Arabia", "Egypt", "UAE", "Kuwait", "Qatar", "Bahrain"]) }),
    summarize: (i) => `Switch scope to ${s(i.scope)}`,
  },
} satisfies Record<string, AgentToolSpec>;

export type AgentToolName = keyof typeof agentTools;
export const agentToolNames = Object.keys(agentTools) as AgentToolName[];

export function toolCategory(name: string): ToolCategory | null {
  return name in agentTools ? agentTools[name as AgentToolName].category : null;
}

export function summarizeToolCall(name: string, input: unknown): string {
  if (!(name in agentTools)) return name;
  try {
    return agentTools[name as AgentToolName].summarize((input ?? {}) as Record<string, unknown>);
  } catch {
    return name;
  }
}

/** Tools whose effects are visible in the workspace, so the UI can label them as writes. */
export function isWriteTool(name: string): boolean {
  const category = toolCategory(name);
  return category !== null && category !== "read";
}
