import {
  advanceQuotation,
  createInvoice,
  invoiceAction,
  issueInvoice,
  payInvoice,
  postCreatorEntry,
  reviewQuotation,
  savePricing,
} from "../app/(main)/dashboard/companies/_components/commercial-actions";
import {
  creatorBalance,
  emptyPricing,
  invoiceBalance,
  quotationTotals,
} from "../app/(main)/dashboard/companies/_components/commercial-model";
import { initialCompaniesState } from "../app/(main)/dashboard/companies/_components/data";
import type { Campaign, CompaniesState } from "../app/(main)/dashboard/companies/_components/types";
import assert from "node:assert/strict";

let state: CompaniesState = structuredClone(initialCompaniesState);
const quote: Campaign = {
  id: "VERIFY-QUOTE",
  companyId: state.companies[0].id,
  brandId: null,
  name: "Verification only",
  owner: state.team[0].name,
  branch: "Saudi Arabia",
  currency: "SAR",
  budget: 0,
  requestedInfluencers: 12,
  stage: "Proposal / Price Quote",
  approvalStatus: "Not Submitted",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  followUpDue: null,
  pdfReady: false,
  invoiceId: null,
  history: [],
};
state.campaigns = [quote];
state.financeInvoices = [];
state.creatorLedger = [];
const pricing = {
  ...emptyPricing,
  unitPrice: 1800,
  freeCreators: 2,
  discount: 600,
  serviceFee: 500,
  vatPercent: 15,
  influencerCost: 9000,
  executionCost: 1500,
  operationsCost: 1000,
};
const totals = quotationTotals(12, pricing);
assert.equal(totals.total, 24725);
assert.equal(totals.margin, 10000);
assert.throws(() => advanceQuotation(state, quote.id), /pricing breakdown/);
state = savePricing(state, quote.id, pricing, 12, "2026-10-01");
state = advanceQuotation(state, quote.id);
assert.equal(state.campaigns[0].stage, "Management Review");
assert.throws(() => savePricing(state, quote.id, pricing, 12, ""), /locked/);
const salesState = { ...state, rules: { ...state.rules, enforceRoleAccess: true, currentUserId: "u2" } };
assert.throws(() => advanceQuotation(salesState, quote.id), /Management access/);
assert.throws(() => reviewQuotation(salesState, quote.id, "Rejected"), /Management access/);
assert.throws(() => reviewQuotation(salesState, quote.id, "Revision Required"), /Management access/);
state = advanceQuotation(state, quote.id);
state = advanceQuotation(state, quote.id);
assert.equal(state.campaigns[0].stage, "Released");
assert.ok(state.activities.some((item) => item.title === "Send quotation to client"));
state = advanceQuotation(state, quote.id);
assert.ok(state.activities.some((item) => item.title === "Client follow-up"));
state.rules.autoInvoiceOnClientApproval = true;
state = advanceQuotation(state, quote.id);
assert.equal(state.financeInvoices.length, 1);
assert.equal(state.financeInvoices[0].amount, totals.total);
assert.equal(creatorBalance(state.creatorLedger).available, 14);
assert.throws(() => advanceQuotation(state, quote.id), /already closed/);
assert.throws(() => createInvoice(state, quote.id), /already has an invoice/);
const invoiceId = state.financeInvoices[0].id;
assert.throws(() => payInvoice(state, invoiceId, 100), /issued invoice/);
state = invoiceAction(state, invoiceId, "Submit");
state = invoiceAction(state, invoiceId, "Approve");
state = issueInvoice(state, invoiceId);
state = invoiceAction(state, invoiceId, "Sent");
assert.throws(() => payInvoice(state, invoiceId, -1), /positive/);
assert.throws(() => payInvoice(state, invoiceId, 25000), /exceed/);
state = payInvoice(state, invoiceId, 10000);
assert.equal(invoiceBalance(state.financeInvoices[0]), 14725);
state = invoiceAction(state, invoiceId, "Credit", "Scope reduction", 725);
assert.equal(invoiceBalance(state.financeInvoices[0]), 14000);
state = payInvoice(state, invoiceId, 14000);
assert.equal(state.financeInvoices[0].status, "Paid");
assert.equal(state.financeInvoices[0].payments?.length, 2);
assert.equal(state.financeInvoices[0].creditNotes?.length, 1);
assert.throws(
  () =>
    postCreatorEntry(state, {
      companyId: quote.companyId,
      brandId: null,
      kind: "Consumed",
      quantity: 15,
      note: "Test overdraw",
    }),
  /exceeds/,
);
state = postCreatorEntry(state, {
  companyId: quote.companyId,
  brandId: null,
  kind: "Consumed",
  quantity: 4,
  note: "Verified delivery",
});
assert.equal(creatorBalance(state.creatorLedger).available, 10);
console.log(
  "Commercial verification passed: pricing, margin, approval permissions, locks, invoice lifecycle, receipts, credits, and creator reconciliation.",
);
