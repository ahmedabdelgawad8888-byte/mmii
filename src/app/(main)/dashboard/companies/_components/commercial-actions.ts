import { creatorBalance, emptyPricing, invoiceBalance, quotationTotals } from "./commercial-model";
import type {
  Activity,
  Campaign,
  CompaniesState,
  CreatorLedgerEntry,
  FinanceExpense,
  LossReason,
  QuotationPricing,
} from "./types";

const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const now = () => new Date().toISOString();
const actor = (state: CompaniesState) => state.team.find((user) => user.id === state.rules.currentUserId);

function requireRole(state: CompaniesState, role: "Management" | "Finance") {
  const user = actor(state);
  if (!user?.active || (state.rules.enforceRoleAccess && user.role !== "Admin" && user.role !== role)) {
    throw new Error(`${role} access is required for this action.`);
  }
}

function audit(state: CompaniesState, campaign: Campaign, action: string, oldValue: string, newValue: string) {
  return [
    {
      id: id("AUD"),
      user: actor(state)?.name ?? "Unknown",
      action,
      module: "Commercial",
      record: campaign.id,
      entity: campaign.branch,
      timestamp: now(),
      oldValue,
      newValue,
    },
    ...state.auditLog,
  ];
}

function task(state: CompaniesState, campaign: Campaign, title: string, key: string): Activity[] {
  if (state.activities.some((activity) => activity.automationKey === key)) return state.activities;
  return [
    {
      id: id("ACT"),
      companyId: campaign.companyId,
      quotationId: campaign.id,
      type: "Task",
      title,
      status: "Open",
      owner: campaign.owner,
      priority: "High",
      createdAt: now(),
      automationKey: key,
      dueDate: new Date(Date.now() + state.rules.followUpDays * 86_400_000).toISOString(),
    },
    ...state.activities,
  ];
}

export function savePricing(
  state: CompaniesState,
  quotationId: string,
  pricing: QuotationPricing,
  quantity: number,
  expectedCloseDate: string,
): CompaniesState {
  const quotation = state.campaigns.find((item) => item.id === quotationId);
  if (quotation?.stage !== "Proposal / Price Quote")
    throw new Error("Commercial terms are locked during review and after release.");
  if (
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    !Number.isSafeInteger(pricing.freeCreators) ||
    Object.values(pricing).some((value) => !Number.isFinite(value) || value < 0) ||
    pricing.vatPercent > 100
  ) {
    throw new Error("Enter positive creator quantities and valid non-negative pricing amounts.");
  }
  const totals = quotationTotals(quantity, pricing);
  if (totals.subtotal < 0 || totals.total <= 0 || pricing.credit > totals.subtotal) {
    throw new Error("Discounts and credits cannot exceed the quotation value.");
  }
  return {
    ...state,
    campaigns: state.campaigns.map((item) =>
      item.id !== quotationId
        ? item
        : {
            ...item,
            pricing,
            requestedInfluencers: quantity,
            budget: totals.total,
            expectedCloseDate,
            approvalStatus: "Not Submitted",
            pdfReady: false,
            updatedAt: now(),
            history: [
              {
                id: id("EVT"),
                title: "Pricing revised",
                detail: `${actor(state)?.name}: ${item.budget} → ${totals.total} ${item.currency}`,
                createdAt: now(),
              },
              ...item.history,
            ],
          },
    ),
    auditLog: audit(state, quotation, "Updated pricing", String(quotation.budget), String(totals.total)),
  };
}

export function advanceQuotation(state: CompaniesState, quotationId: string): CompaniesState {
  const quotation = state.campaigns.find((item) => item.id === quotationId);
  if (!quotation) throw new Error("Quotation not found.");
  if (quotation.stage === "Management Review") requireRole(state, "Management");
  if (quotation.stage === "Financial Review") requireRole(state, "Finance");
  if (!quotation.pricing || quotation.budget <= 0)
    throw new Error("Save an explicit pricing breakdown before submitting for approval.");
  let initialStage: Campaign["stage"] = "Released";
  if (state.rules.requireFinanceApproval) initialStage = "Financial Review";
  if (state.rules.requireManagementApproval) initialStage = "Management Review";
  const stages: Partial<Record<Campaign["stage"], Campaign["stage"]>> = {
    "Proposal / Price Quote": initialStage,
    "Management Review": state.rules.requireFinanceApproval ? "Financial Review" : "Released",
    "Financial Review": "Released",
    Released: "Sent To Client",
    "Sent To Client": "Client Approved",
  };
  const stage = stages[quotation.stage];
  if (!stage) throw new Error("This quotation is already closed.");
  let approvalStatus: Campaign["approvalStatus"] = "Approved";
  if (stage === "Management Review") approvalStatus = "Pending Management";
  if (stage === "Financial Review") approvalStatus = "Pending Finance";
  const fxSnapshot = quotation.fxSnapshot ?? {
    rate: state.fxToSar[quotation.currency],
    effectiveAt: now(),
    source: "Workspace configured rate at submission",
    actor: actor(state)?.name ?? "Unknown",
  };
  const updated: Campaign = {
    ...quotation,
    stage,
    approvalStatus,
    fxSnapshot,
    updatedAt: now(),
    pdfReady: ["Released", "Sent To Client", "Client Approved"].includes(stage),
    followUpDue:
      stage === "Sent To Client"
        ? new Date(Date.now() + state.rules.followUpDays * 86_400_000).toISOString()
        : quotation.followUpDue,
    history: [
      {
        id: id("EVT"),
        title: "Stage updated",
        detail: `${actor(state)?.name}: ${quotation.stage} → ${stage}`,
        createdAt: now(),
      },
      ...quotation.history,
    ],
  };
  const tasksByStage: Partial<Record<Campaign["stage"], string>> = {
    Released: "Send quotation to client",
    "Sent To Client": "Client follow-up",
    "Client Approved": "Issue invoice",
  };
  const title = tasksByStage[stage];
  let next: CompaniesState = {
    ...state,
    campaigns: state.campaigns.map((item) => (item.id === quotationId ? updated : item)),
    activities: title
      ? task(state, quotation, title, `${quotationId}:${stage}:${quotation.history.length}`)
      : state.activities,
    auditLog: audit(state, quotation, "Quotation transition", quotation.stage, stage),
  };
  next.activities = next.activities.map((activity) => {
    if (activity.quotationId !== quotationId || activity.status !== "Open" || !activity.automationKey) return activity;
    const done =
      (stage === "Sent To Client" && activity.title === "Send quotation to client") ||
      (stage === "Client Approved" && activity.title === "Client follow-up") ||
      (activity.automationKey.startsWith("sla:") && !["Management Review", "Financial Review"].includes(stage));
    return done ? { ...activity, status: "Completed", completedAt: now() } : activity;
  });
  if (stage === "Client Approved") {
    const entries: CreatorLedgerEntry[] = [
      { kind: "Purchased" as const, quantity: quotation.requestedInfluencers },
      { kind: "Bonus" as const, quantity: quotation.pricing.freeCreators },
    ]
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        ...item,
        id: id("CR"),
        companyId: quotation.companyId,
        brandId: quotation.brandId,
        quotationId,
        note: "Client-approved quotation entitlement",
        actor: actor(state)?.name ?? "Unknown",
        createdAt: now(),
      }));
    next = { ...next, creatorLedger: [...next.creatorLedger, ...entries] };
    if (state.rules.autoInvoiceOnClientApproval) next = createInvoice(next, quotationId, true);
  }
  return next;
}

export function reviewQuotation(
  state: CompaniesState,
  quotationId: string,
  decision: "Rejected" | "Revision Required",
): CompaniesState {
  const quotation = state.campaigns.find((item) => item.id === quotationId);
  if (!quotation || !["Management Review", "Financial Review"].includes(quotation.stage))
    throw new Error("Only a pending review can be returned.");
  requireRole(state, quotation.stage === "Management Review" ? "Management" : "Finance");
  return {
    ...state,
    campaigns: state.campaigns.map((item) =>
      item.id !== quotationId
        ? item
        : {
            ...item,
            stage: "Proposal / Price Quote",
            approvalStatus: decision,
            pdfReady: false,
            fxSnapshot: undefined,
            updatedAt: now(),
            history: [
              {
                id: id("EVT"),
                title: decision,
                detail: `${actor(state)?.name} returned the quotation to Sales`,
                createdAt: now(),
              },
              ...item.history,
            ],
          },
    ),
    auditLog: audit(state, quotation, decision, quotation.stage, "Proposal / Price Quote"),
  };
}

export function closeQuotation(
  state: CompaniesState,
  quotationId: string,
  decision: "Client Not Approved" | "Client Cancelled",
  reason: LossReason,
  notes: string,
): CompaniesState {
  const quotation = state.campaigns.find((item) => item.id === quotationId);
  if (quotation?.stage !== "Sent To Client") throw new Error("Only a quotation sent to the client can be closed.");
  if (!reason || (reason === "Other" && !notes.trim()))
    throw new Error("Select a loss reason; Other requires an explanation.");
  return {
    ...state,
    campaigns: state.campaigns.map((item) =>
      item.id !== quotationId
        ? item
        : {
            ...item,
            stage: decision,
            lossReason: reason,
            lossNotes: notes,
            updatedAt: now(),
            history: [
              { id: id("EVT"), title: decision, detail: `${reason}: ${notes}`, createdAt: now() },
              ...item.history,
            ],
          },
    ),
    auditLog: audit(state, quotation, "Client decision", quotation.stage, `${decision}: ${reason}`),
  };
}

export function createInvoice(state: CompaniesState, quotationId: string, automatic = false): CompaniesState {
  if (!automatic) requireRole(state, "Finance");
  const quotation = state.campaigns.find((item) => item.id === quotationId);
  if (quotation?.stage !== "Client Approved") throw new Error("The client must approve the quotation first.");
  if (state.financeInvoices.some((item) => item.quotationId === quotationId || item.id === quotation.invoiceId)) {
    throw new Error("This quotation already has an invoice.");
  }
  const invoiceId = id("INV");
  const totals = quotationTotals(quotation.requestedInfluencers, quotation.pricing ?? emptyPricing);
  return {
    ...state,
    financeInvoices: [
      {
        id: invoiceId,
        quotationId,
        companyId: quotation.companyId,
        campaignId: null,
        entity: quotation.branch,
        currency: quotation.currency,
        amount: quotation.budget,
        paidAmount: 0,
        status: "Draft",
        dueDate: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
        createdAt: now(),
        subtotal: quotation.pricing ? totals.subtotal : quotation.budget,
        tax: quotation.pricing ? totals.tax : 0,
        paymentTerms: "30 days",
        collectionsOwner: actor(state)?.name ?? quotation.owner,
        poNumber: "",
        payments: [],
        fxSnapshot: quotation.fxSnapshot,
      },
      ...state.financeInvoices,
    ],
    campaigns: state.campaigns.map((item) => (item.id === quotationId ? { ...item, invoiceId } : item)),
    activities: state.activities.map((item) =>
      item.quotationId === quotationId && item.title === "Issue invoice"
        ? { ...item, status: "Completed", completedAt: now() }
        : item,
    ),
    auditLog: audit(state, quotation, "Created draft invoice", "", invoiceId),
  };
}

export function postCreatorEntry(
  state: CompaniesState,
  input: Omit<CreatorLedgerEntry, "id" | "actor" | "createdAt">,
): CompaniesState {
  if (
    !Number.isSafeInteger(input.quantity) ||
    input.quantity === 0 ||
    (input.kind !== "Adjusted" && input.quantity < 0) ||
    !input.note.trim()
  )
    throw new Error("Enter a valid whole quantity and an explanation.");
  if (!state.companies.some((item) => item.id === input.companyId)) throw new Error("Select a company.");
  if (input.brandId && !state.brands.some((item) => item.id === input.brandId && item.companyId === input.companyId)) {
    throw new Error("The brand must belong to the selected company.");
  }
  const entries = state.creatorLedger.filter(
    (item) => item.companyId === input.companyId && item.brandId === input.brandId,
  );
  const entry = { ...input, id: id("CR"), actor: actor(state)?.name ?? "Unknown", createdAt: now() };
  const balance = creatorBalance([...entries, entry]);
  if (balance.available < 0 || balance.reserved < 0)
    throw new Error("This entry exceeds the available or reserved balance for this account allocation.");
  return { ...state, creatorLedger: [...state.creatorLedger, entry] };
}

export function payInvoice(
  state: CompaniesState,
  invoiceId: string,
  amount: number,
  reference = "Manual receipt",
): CompaniesState {
  requireRole(state, "Finance");
  const invoice = state.financeInvoices.find((item) => item.id === invoiceId);
  if (!invoice || ["Draft", "Pending Approval", "Approved", "Cancelled"].includes(invoice.status))
    throw new Error("Payments require an issued invoice.");
  if (!Number.isFinite(amount) || amount <= 0 || amount > invoiceBalance(invoice))
    throw new Error("Payment must be positive and cannot exceed the outstanding balance.");
  const paidAmount = invoice.paidAmount + amount;
  return {
    ...state,
    financeInvoices: state.financeInvoices.map((item) =>
      item.id !== invoiceId
        ? item
        : {
            ...item,
            paidAmount,
            status: paidAmount >= item.amount - (item.creditAmount ?? 0) ? "Paid" : "Partially Paid",
            payments: [
              ...(item.payments ?? []),
              { id: id("PAY"), amount, reference, recordedAt: now(), actor: actor(state)?.name ?? "Unknown" },
            ],
          },
    ),
    auditLog: [
      {
        id: id("AUD"),
        user: actor(state)?.name ?? "Unknown",
        action: "Recorded payment",
        module: "Finance",
        record: invoiceId,
        entity: invoice.entity,
        timestamp: now(),
        oldValue: String(invoice.paidAmount),
        newValue: String(paidAmount),
      },
      ...state.auditLog,
    ],
  };
}

export function issueInvoice(state: CompaniesState, invoiceId: string): CompaniesState {
  requireRole(state, "Finance");
  const invoice = state.financeInvoices.find((item) => item.id === invoiceId);
  if (invoice?.status !== "Approved") throw new Error("Approve the invoice before issuing it.");
  const quotation = state.campaigns.find((item) => item.id === invoice.quotationId);
  return {
    ...state,
    financeInvoices: state.financeInvoices.map((item) =>
      item.id === invoiceId ? { ...item, status: "Issued", issuedAt: now() } : item,
    ),
    activities: quotation ? task(state, quotation, "Payment follow-up", `payment:${invoiceId}`) : state.activities,
    auditLog: [
      {
        id: id("AUD"),
        user: actor(state)?.name ?? "Unknown",
        action: "Issued invoice",
        module: "Finance",
        record: invoiceId,
        entity: invoice.entity,
        timestamp: now(),
        oldValue: "Approved",
        newValue: "Issued",
      },
      ...state.auditLog,
    ],
  };
}

export function invoiceAction(
  state: CompaniesState,
  invoiceId: string,
  action: "Submit" | "Approve" | "Sent" | "Void" | "Credit",
  reason = "",
  amount = 0,
): CompaniesState {
  requireRole(state, "Finance");
  const invoice = state.financeInvoices.find((item) => item.id === invoiceId);
  if (!invoice) throw new Error("Invoice not found.");
  const patch: Partial<typeof invoice> = {};
  if (action === "Submit" && invoice.status === "Draft") patch.status = "Pending Approval";
  else if (action === "Approve" && invoice.status === "Pending Approval") patch.status = "Approved";
  else if (action === "Sent" && invoice.status === "Issued") {
    patch.status = "Sent";
    patch.sentAt = now();
  } else if (action === "Void" && invoice.status !== "Cancelled" && invoice.paidAmount === 0 && reason.trim())
    patch.status = "Cancelled";
  else if (
    action === "Credit" &&
    ["Issued", "Sent", "Overdue", "Partially Paid"].includes(invoice.status) &&
    Number.isFinite(amount) &&
    amount > 0 &&
    amount <= invoiceBalance(invoice) &&
    reason.trim()
  ) {
    patch.creditAmount = (invoice.creditAmount ?? 0) + amount;
    patch.creditNotes = [
      ...(invoice.creditNotes ?? []),
      { id: id("CN"), amount, reason, issuedAt: now(), actor: actor(state)?.name ?? "Unknown" },
    ];
  } else
    throw new Error(
      "This action is not valid for the invoice. Credits require a positive amount within the outstanding balance; credits and voids require a reason.",
    );
  return {
    ...state,
    financeInvoices: state.financeInvoices.map((item) => (item.id === invoiceId ? { ...item, ...patch } : item)),
    auditLog: [
      {
        id: id("AUD"),
        user: actor(state)?.name ?? "Unknown",
        action: `Invoice ${action}`,
        module: "Finance",
        record: invoiceId,
        entity: invoice.entity,
        timestamp: now(),
        oldValue: invoice.status,
        newValue: `${patch.status ?? action}: ${reason}${amount ? ` (${amount})` : ""}`,
      },
      ...state.auditLog,
    ],
  };
}

export function addExpense(
  state: CompaniesState,
  input: Omit<FinanceExpense, "id" | "recordedAt" | "actor" | "paid">,
): CompaniesState {
  requireRole(state, "Finance");
  const quotation = state.campaigns.find((item) => item.id === input.quotationId && item.companyId === input.companyId);
  if (
    !quotation ||
    input.currency !== quotation.currency ||
    !input.supplier.trim() ||
    !input.reference.trim() ||
    !Number.isFinite(input.amount) ||
    input.amount <= 0 ||
    !input.dueDate
  )
    throw new Error("Enter a linked quotation, payee, positive amount, due date, and reference.");
  return {
    ...state,
    expenses: [
      { ...input, id: id("EXP"), paid: false, recordedAt: now(), actor: actor(state)?.name ?? "Unknown" },
      ...state.expenses,
    ],
    auditLog: audit(
      state,
      quotation,
      "Recorded supplier liability",
      "",
      `${input.supplier}: ${input.amount} ${input.currency}`,
    ),
  };
}

export function settleExpense(state: CompaniesState, expenseId: string): CompaniesState {
  requireRole(state, "Finance");
  const expense = state.expenses.find((item) => item.id === expenseId);
  if (!expense || expense.paid) throw new Error("This expense is already settled or unavailable.");
  return {
    ...state,
    expenses: state.expenses.map((item) => (item.id === expenseId ? { ...item, paid: true } : item)),
    auditLog: [
      {
        id: id("AUD"),
        user: actor(state)?.name ?? "Unknown",
        action: "Settled expense",
        module: "Finance",
        record: expenseId,
        entity: state.companies.find((item) => item.id === expense.companyId)?.branch ?? "Group",
        timestamp: now(),
        oldValue: "Unpaid",
        newValue: "Paid",
      },
      ...state.auditLog,
    ],
  };
}
