import type { Campaign, CompaniesState, CreatorLedgerEntry, FinanceInvoice, QuotationPricing } from "./types";

export const emptyPricing: QuotationPricing = {
  unitPrice: 0,
  freeCreators: 0,
  discount: 0,
  serviceFee: 0,
  vatPercent: 0,
  credit: 0,
  influencerCost: 0,
  executionCost: 0,
  operationsCost: 0,
};

export function quotationTotals(quantity: number, pricing: QuotationPricing) {
  const round = (value: number) => Math.round((value + Number.EPSILON) * 1000) / 1000;
  const base = round(quantity * pricing.unitPrice);
  const subtotal = round(base - pricing.discount + pricing.serviceFee);
  const tax = round((subtotal * pricing.vatPercent) / 100);
  const total = round(subtotal + tax - pricing.credit);
  const cost = round(pricing.influencerCost + pricing.executionCost + pricing.operationsCost);
  const margin = round(subtotal - pricing.credit - cost);
  return { base, subtotal, tax, total, cost, margin, marginPercent: subtotal > 0 ? (margin / subtotal) * 100 : 0 };
}

export function approvalAge(quotation: Campaign, now = Date.now()) {
  const hours = Math.max(0, (now - new Date(quotation.updatedAt).getTime()) / 3_600_000);
  let label = "Within SLA";
  if (hours >= 24) label = "Due soon";
  if (hours >= 36) label = "Urgent";
  if (hours >= 48) label = "Breached";
  if (hours >= 72) label = "Escalated";
  return { hours, label };
}

export function invoiceBalance(invoice: FinanceInvoice) {
  return Math.max(0, invoice.amount - (invoice.creditAmount ?? 0) - invoice.paidAmount);
}

export function invoiceStatus(invoice: FinanceInvoice, now = Date.now()) {
  if (["Draft", "Pending Approval", "Approved", "Cancelled"].includes(invoice.status)) return invoice.status;
  if (invoiceBalance(invoice) === 0) return "Paid";
  if (new Date(`${invoice.dueDate.slice(0, 10)}T23:59:59Z`).getTime() < now) return "Overdue";
  return invoice.paidAmount > 0 ? "Partially Paid" : invoice.status;
}

export function creatorBalance(entries: CreatorLedgerEntry[]) {
  const sum = (kind: CreatorLedgerEntry["kind"]) =>
    entries.filter((entry) => entry.kind === kind).reduce((total, entry) => total + entry.quantity, 0);
  const purchased = sum("Purchased");
  const bonus = sum("Bonus");
  const adjusted = sum("Adjusted");
  const reserved = sum("Reserved") - sum("Released");
  const consumed = sum("Consumed");
  const expired = sum("Expired");
  return {
    purchased,
    bonus,
    adjusted,
    reserved,
    consumed,
    expired,
    available: purchased + bonus + adjusted - reserved - consumed - expired,
  };
}

export function migrateCreatorLedger(state: Pick<CompaniesState, "companies">): CreatorLedgerEntry[] {
  return state.companies.flatMap((company) =>
    [
      { kind: "Purchased" as const, quantity: company.requestedInfluencers },
      { kind: "Bonus" as const, quantity: company.freeInfluencers },
      { kind: "Consumed" as const, quantity: company.usedInfluencers },
    ]
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        ...item,
        id: `opening-${company.id}-${item.kind}`,
        companyId: company.id,
        brandId: null,
        note: "Opening company balance; historical brand allocation unavailable",
        actor: "Opening balance migration",
        createdAt: company.createdAt,
      })),
  );
}

export function reportingAmount(quotation: Campaign, state: Pick<CompaniesState, "fxToSar" | "rules">) {
  return (
    (quotation.budget * (quotation.fxSnapshot?.rate ?? state.fxToSar[quotation.currency])) /
    state.fxToSar[state.rules.baseCurrency]
  );
}
