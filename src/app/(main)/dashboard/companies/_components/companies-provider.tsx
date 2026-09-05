"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import {
  addExpense,
  advanceQuotation,
  closeQuotation,
  createInvoice,
  invoiceAction,
  issueInvoice,
  payInvoice,
  postCreatorEntry,
  reviewQuotation,
  savePricing,
  settleExpense,
} from "./commercial-actions";
import { creatorBalance, migrateCreatorLedger } from "./commercial-model";
import { branchCurrencies, initialCompaniesState } from "./data";
import type {
  AccountRequest,
  ActivationCampaign,
  CompaniesState,
  CreatorLedgerEntry,
  Currency,
  FinanceExpense,
  InfluencerStage,
  LossReason,
  MeetingOutcome,
  NewBrandInput,
  NewCampaignInput,
  NewCompanyInput,
  NewLeadInput,
  OperatingScope,
  OperationsQueue,
  QuotationPricing,
  WorkspaceRules,
} from "./types";
import { reconcileReminders } from "./workflow-automation";

const STORAGE_KEY = "trygc:companies-workspace:v1";

interface CompaniesContextValue extends CompaniesState {
  addFinanceExpense: (input: Omit<FinanceExpense, "id" | "recordedAt" | "actor" | "paid">) => boolean;
  settleFinanceExpense: (id: string) => boolean;
  saveQuotationPricing: (id: string, pricing: QuotationPricing, quantity: number, expectedCloseDate: string) => boolean;
  createQuotationInvoice: (id: string) => boolean;
  issueFinanceInvoice: (id: string) => boolean;
  saveInvoiceTerms: (
    id: string,
    terms: { dueDate: string; paymentTerms: string; poNumber: string; collectionsOwner: string },
  ) => boolean;
  updateInvoiceStatus: (
    id: string,
    action: "Submit" | "Approve" | "Sent" | "Void" | "Credit",
    reason?: string,
    amount?: number,
  ) => boolean;
  postCreatorEntry: (input: Omit<CreatorLedgerEntry, "id" | "actor" | "createdAt">) => boolean;
  closeQuotation: (
    id: string,
    decision: "Client Not Approved" | "Client Cancelled",
    reason: LossReason,
    notes: string,
  ) => boolean;
  updateLeadProfile: (
    id: string,
    patch: {
      budgetConfirmed: boolean;
      meetingHeld: boolean;
      expectedCreators: number;
      opportunityValue: number;
      notes: string;
      nextActivityAt: string | null;
    },
  ) => boolean;
  addLead: (input: NewLeadInput) => string;
  qualifyLead: (leadId: string) => void;
  junkLead: (leadId: string) => void;
  convertLead: (leadId: string, createQuotation: boolean) => string | null;
  addCompany: (input: NewCompanyInput) => string;
  addBrand: (input: NewBrandInput) => string | null;
  addCampaign: (input: NewCampaignInput) => string | null;
  addActivity: (companyId: string, type: "Meeting" | "Call" | "Task" | "Note", title: string, dueDate?: string) => void;
  addAttachment: (companyId: string, file: { name: string; type: string; size: number; dataUrl?: string }) => void;
  completeActivity: (activityId: string) => void;
  recordMeetingOutcome: (id: string, outcome: MeetingOutcome) => boolean;
  setCurrentUser: (userId: string) => void;
  setScope: (scope: OperatingScope) => void;
  updateRules: (patch: Partial<WorkspaceRules>) => void;
  updateFx: (currency: Currency, rate: number) => void;
  canApprove: (kind: "Management" | "Finance") => boolean;
  createActivationCampaign: (
    input: Omit<ActivationCampaign, "id" | "health" | "status" | "rootCause" | "impact">,
  ) => string;
  addInfluencer: (campaignId: string, name: string, handle: string, owner: string) => void;
  advanceInfluencer: (influencerId: string, stage: InfluencerStage) => void;
  reassignWork: (workId: string, owner: string) => void;
  createWork: (input: {
    queue: OperationsQueue;
    companyId: string;
    campaignId: string;
    owner: string;
    nextAction: string;
  }) => void;
  completeWork: (workId: string) => void;
  requestAccount: (input: Pick<AccountRequest, "accountName" | "accountType" | "entity">) => void;
  decideAccountRequest: (requestId: string, approved: boolean) => void;
  recordPayment: (invoiceId: string, amount: number) => void;
  progressCampaign: (campaignId: string) => void;
  requestRevision: (campaignId: string) => void;
  rejectCampaign: (campaignId: string) => void;
  setClientDecision: (campaignId: string, decision: "Client Not Approved" | "Client Cancelled") => void;
}

const CompaniesContext = createContext<CompaniesContextValue | null>(null);

function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

function event(title: string, detail: string) {
  return { id: nextId("EVT"), title, detail, createdAt: new Date().toISOString() };
}

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CompaniesState>(() => ({
    ...initialCompaniesState,
    creatorLedger: initialCompaniesState.creatorLedger.length
      ? initialCompaniesState.creatorLedger
      : migrateCreatorLedger(initialCompaniesState),
  }));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(saved) as Partial<CompaniesState>;
      setState({
        expenses: parsed.expenses ?? initialCompaniesState.expenses,
        creatorLedger:
          parsed.creatorLedger ??
          (initialCompaniesState.creatorLedger.length
            ? initialCompaniesState.creatorLedger
            : migrateCreatorLedger({ companies: parsed.companies ?? initialCompaniesState.companies })),
        leads: parsed.leads ?? initialCompaniesState.leads,
        companies: parsed.companies ?? initialCompaniesState.companies,
        brands: parsed.brands ?? initialCompaniesState.brands,
        campaigns: parsed.campaigns ?? initialCompaniesState.campaigns,
        activities: parsed.activities ?? initialCompaniesState.activities,
        attachments: parsed.attachments ?? [],
        team: parsed.team ?? initialCompaniesState.team,
        rules: { ...initialCompaniesState.rules, ...(parsed.rules ?? {}) },
        fxToSar: { ...initialCompaniesState.fxToSar, ...(parsed.fxToSar ?? {}) },
        activationCampaigns: parsed.activationCampaigns ?? initialCompaniesState.activationCampaigns,
        influencers: parsed.influencers ?? initialCompaniesState.influencers,
        operationsQueue: parsed.operationsQueue ?? initialCompaniesState.operationsQueue,
        entities: parsed.entities ?? initialCompaniesState.entities,
        chartOfAccounts: parsed.chartOfAccounts ?? initialCompaniesState.chartOfAccounts,
        accountRequests: parsed.accountRequests ?? [],
        financeInvoices: parsed.financeInvoices ?? initialCompaniesState.financeInvoices,
        auditLog: parsed.auditLog ?? initialCompaniesState.auditLog,
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      toast.error("Browser storage is full or unavailable. Your latest changes could not be saved.");
    }
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    setState((current) => reconcileReminders(current));
    const timer = setInterval(() => setState((current) => reconcileReminders(current)), 60_000);
    return () => clearInterval(timer);
  }, [hydrated]);

  const value = useMemo<CompaniesContextValue>(() => {
    const run = (action: (current: CompaniesState) => CompaniesState, message: string) => {
      try {
        const next = action(state);
        setState(next);
        toast.success(message);
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The action could not be completed.");
        return false;
      }
    };
    const scope = state.rules.activeScope;
    const scopedCompanies =
      scope === "Group" ? state.companies : state.companies.filter((item) => item.branch === scope);
    const companyIds = new Set(scopedCompanies.map((item) => item.id));
    return {
      ...state,
      expenses: state.expenses.filter((item) => companyIds.has(item.companyId)),
      addFinanceExpense: (input) => run((current) => addExpense(current, input), "Expense recorded"),
      settleFinanceExpense: (id) => run((current) => settleExpense(current, id), "Expense settled"),
      creatorLedger: state.creatorLedger.filter((item) => companyIds.has(item.companyId)),
      saveQuotationPricing: (id, pricing, quantity, closeDate) =>
        run((current) => savePricing(current, id, pricing, quantity, closeDate), "Pricing saved"),
      createQuotationInvoice: (id) => run((current) => createInvoice(current, id), "Draft invoice created"),
      saveInvoiceTerms: (id, terms) =>
        run((current) => {
          const invoice = current.financeInvoices.find((item) => item.id === id);
          const actor = current.team.find((item) => item.id === current.rules.currentUserId);
          if (
            invoice?.status !== "Draft" ||
            !terms.dueDate ||
            !terms.paymentTerms.trim() ||
            !terms.collectionsOwner.trim()
          )
            throw new Error("Complete the draft invoice terms.");
          if (!actor?.active || (current.rules.enforceRoleAccess && !["Admin", "Finance"].includes(actor.role)))
            throw new Error("Finance access is required.");
          return {
            ...current,
            financeInvoices: current.financeInvoices.map((item) => (item.id === id ? { ...item, ...terms } : item)),
          };
        }, "Invoice terms saved"),
      updateInvoiceStatus: (id, action, reason, amount) =>
        run((current) => invoiceAction(current, id, action, reason, amount), "Invoice updated"),
      issueFinanceInvoice: (id) => run((current) => issueInvoice(current, id), "Invoice issued"),
      postCreatorEntry: (input) => run((current) => postCreatorEntry(current, input), "Creator ledger updated"),
      closeQuotation: (id, decision, reason, notes) =>
        run((current) => closeQuotation(current, id, decision, reason, notes), "Client decision recorded"),
      leads: scope === "Group" ? state.leads : state.leads.filter((item) => item.branch === scope),
      companies: scopedCompanies.map((company) => {
        const balance = creatorBalance(state.creatorLedger.filter((entry) => entry.companyId === company.id));
        return {
          ...company,
          requestedInfluencers: balance.purchased + balance.adjusted,
          freeInfluencers: balance.bonus,
          usedInfluencers: balance.consumed,
        };
      }),
      brands: (scope === "Group" ? state.brands : state.brands.filter((item) => item.branch === scope)).map((brand) => {
        const balance = creatorBalance(state.creatorLedger.filter((entry) => entry.brandId === brand.id));
        return {
          ...brand,
          requestedInfluencers: balance.purchased + balance.adjusted,
          freeInfluencers: balance.bonus,
          usedInfluencers: balance.consumed,
        };
      }),
      campaigns: scope === "Group" ? state.campaigns : state.campaigns.filter((item) => item.branch === scope),
      activities:
        scope === "Group" ? state.activities : state.activities.filter((item) => companyIds.has(item.companyId)),
      attachments:
        scope === "Group" ? state.attachments : state.attachments.filter((item) => companyIds.has(item.companyId)),
      activationCampaigns:
        scope === "Group"
          ? state.activationCampaigns
          : state.activationCampaigns.filter((item) => item.branch === scope),
      influencers:
        scope === "Group"
          ? state.influencers
          : state.influencers.filter((item) =>
              state.activationCampaigns.some(
                (campaign) => campaign.id === item.campaignId && campaign.branch === scope,
              ),
            ),
      operationsQueue:
        scope === "Group"
          ? state.operationsQueue
          : state.operationsQueue.filter((item) =>
              state.activationCampaigns.some(
                (campaign) => campaign.id === item.campaignId && campaign.branch === scope,
              ),
            ),
      entities: scope === "Group" ? state.entities : state.entities.filter((item) => item.country === scope),
      accountRequests:
        scope === "Group" ? state.accountRequests : state.accountRequests.filter((item) => item.entity === scope),
      financeInvoices:
        scope === "Group" ? state.financeInvoices : state.financeInvoices.filter((item) => item.entity === scope),
      auditLog: scope === "Group" ? state.auditLog : state.auditLog.filter((item) => item.entity === scope),
      updateLeadProfile: (id, patch) =>
        run((current) => {
          if (
            !Number.isSafeInteger(patch.expectedCreators) ||
            patch.expectedCreators < 0 ||
            !Number.isFinite(patch.opportunityValue) ||
            patch.opportunityValue < 0
          )
            throw new Error("Enter valid non-negative demand and opportunity values.");
          const actor = current.team.find((user) => user.id === current.rules.currentUserId)?.name ?? "Demo operator";
          return {
            ...current,
            leads: current.leads.map((lead) =>
              lead.id === id
                ? {
                    ...lead,
                    ...patch,
                    lastActivityAt: new Date().toISOString(),
                    history: [event("Discovery updated", `${actor}: ${patch.notes}`), ...(lead.history ?? [])],
                  }
                : lead,
            ),
          };
        }, "Lead discovery updated"),
      addLead: (input) => {
        const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
        const duplicate = state.leads.find(
          (lead) =>
            (input.email.trim() && lead.email.trim().toLowerCase() === input.email.trim().toLowerCase()) ||
            (input.phone.trim() && normalize(lead.phone) === normalize(input.phone)),
        );
        if (duplicate) {
          toast.error(`A lead with this email or phone already exists: ${duplicate.leadName}`);
          return "";
        }
        const id = nextId("LEAD");
        setState((current) => ({
          ...current,
          leads: [
            {
              ...input,
              id,
              leadName: `${input.firstName} ${input.lastName}`.trim(),
              status: "New",
              createdAt: new Date().toISOString(),
              lastActivityAt: null,
              nextActivityAt: null,
              notes: "",
            },
            ...current.leads,
          ],
        }));
        toast.success("Lead added and assigned");
        return id;
      },
      qualifyLead: (leadId) => {
        setState((current) => ({
          ...current,
          leads: current.leads.map((lead) =>
            lead.id === leadId ? { ...lead, status: "Qualified", qualifiedAt: new Date().toISOString() } : lead,
          ),
        }));
        toast.success("Lead qualified");
      },
      junkLead: (leadId) => {
        setState((current) => ({
          ...current,
          leads: current.leads.map((lead) => (lead.id === leadId ? { ...lead, status: "Junk" } : lead)),
        }));
        toast.info("Lead marked as junk");
      },
      convertLead: (leadId, createQuotation) => {
        const lead = state.leads.find((item) => item.id === leadId);
        if (lead?.status !== "Qualified") {
          toast.error("Qualify the lead before converting it.");
          return null;
        }
        const companyId = nextId("CMP");
        const campaignId = nextId("QT");
        const now = new Date().toISOString();
        const currency = branchCurrencies[lead.branch];
        setState((current) => ({
          ...current,
          leads: current.leads.map((item) =>
            item.id === leadId
              ? { ...item, status: "Converted", convertedCompanyId: companyId, convertedAt: now }
              : item,
          ),
          companies: [
            {
              id: companyId,
              name: lead.companyName,
              contactPerson: lead.leadName,
              phone: lead.phone,
              email: lead.email,
              website: "",
              industry: "Not classified",
              owner: lead.owner,
              branch: lead.branch,
              status: "Active",
              createdAt: now,
              requestedInfluencers: 0,
              freeInfluencers: 0,
              usedInfluencers: 0,
              source: "Workspace",
            },
            ...current.companies,
          ],
          campaigns: createQuotation
            ? [
                {
                  id: campaignId,
                  name: `${lead.companyName} — New Campaign`,
                  companyId,
                  brandId: null,
                  owner: lead.owner,
                  branch: lead.branch,
                  currency,
                  budget: 0,
                  requestedInfluencers: 0,
                  stage: "Proposal / Price Quote",
                  approvalStatus: "Not Submitted",
                  createdAt: now,
                  updatedAt: now,
                  followUpDue: null,
                  pdfReady: false,
                  invoiceId: null,
                  history: [event("Lead converted", "Company and initial quotation created from the qualified lead.")],
                },
                ...current.campaigns,
              ]
            : current.campaigns,
        }));
        toast.success(createQuotation ? "Lead converted to company and quotation" : "Lead converted to company");
        return companyId;
      },
      addCompany: (input) => {
        const id = nextId("CMP");
        setState((current) => ({
          ...current,
          companies: [
            {
              ...input,
              id,
              website: "",
              createdAt: new Date().toISOString(),
              requestedInfluencers: 0,
              freeInfluencers: 0,
              usedInfluencers: 0,
              source: "Workspace",
            },
            ...current.companies,
          ],
        }));
        toast.success("Company added to the directory");
        return id;
      },
      addBrand: (input) => {
        const company = state.companies.find((item) => item.id === input.companyId);
        if (!company) return null;
        const id = nextId("BRD");
        setState((current) => ({
          ...current,
          brands: [
            {
              ...input,
              id,
              owner: company.owner,
              branch: company.branch,
              industry: company.industry,
              requestedInfluencers: 0,
              freeInfluencers: 0,
              usedInfluencers: 0,
            },
            ...current.brands,
          ],
        }));
        toast.success("Brand linked to its company");
        return id;
      },
      addCampaign: (input) => {
        const company = state.companies.find((item) => item.id === input.companyId);
        const brand = input.brandId ? state.brands.find((item) => item.id === input.brandId) : null;
        if (!company || (input.brandId && !brand) || (brand && brand.companyId !== company.id)) return null;
        const id = nextId("CAM");
        const createdAt = new Date().toISOString();
        setState((current) => ({
          ...current,
          campaigns: [
            {
              ...input,
              id,
              owner: company.owner,
              branch: company.branch,
              currency: branchCurrencies[company.branch],
              stage: "Proposal / Price Quote",
              approvalStatus: "Not Submitted",
              createdAt,
              updatedAt: createdAt,
              followUpDue: null,
              pdfReady: false,
              invoiceId: null,
              history: [event("Campaign created", "Proposal opened and linked to the company record.")],
            },
            ...current.campaigns,
          ],
        }));
        toast.success("Campaign created in proposal stage");
        return id;
      },
      addActivity: (companyId, type, title, dueDate) => {
        setState((current) => ({
          ...current,
          activities: [
            {
              id: nextId("ACT"),
              companyId,
              type,
              title,
              owner: state.companies.find((item) => item.id === companyId)?.owner ?? "Unassigned",
              dueDate: dueDate || undefined,
              priority: "Medium",
              status: type === "Note" || type === "Call" ? "Completed" : "Open",
              createdAt: new Date().toISOString(),
            },
            ...current.activities,
          ],
        }));
        toast.success(`${type} added to the company timeline`);
      },
      addAttachment: (companyId, file) => {
        setState((current) => ({
          ...current,
          attachments: [
            {
              id: nextId("ATT"),
              companyId,
              ...file,
              uploadedAt: new Date().toISOString(),
            },
            ...current.attachments,
          ],
        }));
        toast.success("Attachment recorded on the company");
      },
      recordMeetingOutcome: (id, outcome) =>
        run((current) => {
          const meeting = current.activities.find((item) => item.id === id && item.type === "Meeting");
          if (
            !meeting ||
            !outcome.decision.trim() ||
            !outcome.purpose.trim() ||
            !outcome.nextAction.trim() ||
            !outcome.owner.trim() ||
            !outcome.deadline ||
            !Number.isSafeInteger(outcome.expectedCreators) ||
            outcome.expectedCreators < 0
          ) {
            throw new Error(
              "Record the meeting purpose, decision, next action, owner, deadline, and a valid creator quantity.",
            );
          }
          const now = new Date().toISOString();
          const taskKey = `meeting-followup:${id}`;
          const existingTask = current.activities.find((item) => item.automationKey === taskKey);
          return {
            ...current,
            activities: [
              ...(!existingTask
                ? [
                    {
                      id: nextId("ACT"),
                      companyId: meeting.companyId,
                      type: "Task" as const,
                      title: outcome.nextAction,
                      owner: outcome.owner,
                      dueDate: outcome.deadline,
                      status: "Open" as const,
                      createdAt: now,
                      automationKey: taskKey,
                    },
                  ]
                : []),
              ...current.activities.map((item) => {
                if (item.id === id)
                  return {
                    ...item,
                    meetingOutcome: outcome,
                    status: "Completed" as const,
                    outcome: outcome.decision,
                    completedAt: now,
                  };
                if (item.automationKey === taskKey)
                  return { ...item, title: outcome.nextAction, owner: outcome.owner, dueDate: outcome.deadline };
                return item;
              }),
            ],
          };
        }, "Meeting outcome saved and follow-up assigned"),
      completeActivity: (activityId) => {
        const activity = state.activities.find((item) => item.id === activityId);
        if (activity?.type === "Meeting" && !activity.meetingOutcome) {
          toast.error("Complete the meeting with structured notes from the meetings register.");
          return;
        }
        setState((current) => ({
          ...current,
          activities: current.activities.map((item) =>
            item.id === activityId ? { ...item, status: "Completed", completedAt: new Date().toISOString() } : item,
          ),
        }));
        toast.success("Activity completed");
      },
      setCurrentUser: (userId) => {
        setState((current) => ({ ...current, rules: { ...current.rules, currentUserId: userId } }));
        toast.success("Employee workspace changed");
      },
      setScope: (activeScope) => {
        setState((current) => ({ ...current, rules: { ...current.rules, activeScope } }));
        toast.success(activeScope === "Group" ? "Group view enabled" : `${activeScope} scope enabled`);
      },
      updateRules: (patch) => {
        setState((current) => ({ ...current, rules: { ...current.rules, ...patch } }));
        toast.success("Workflow rules updated");
      },
      updateFx: (currency, rate) => {
        if (!Number.isFinite(rate) || rate <= 0 || (currency === "SAR" && rate !== 1)) {
          toast.error("Enter a valid positive rate. SAR must remain 1.");
          return;
        }
        setState((current) => ({ ...current, fxToSar: { ...current.fxToSar, [currency]: rate } }));
        toast.success(`${currency} conversion rate updated`);
      },
      createActivationCampaign: (input) => {
        const id = nextId("CPN");
        const actor = state.team.find((item) => item.id === state.rules.currentUserId)?.name ?? "System";
        setState((current) => ({
          ...current,
          activationCampaigns: [
            {
              ...input,
              id,
              health: "Amber",
              status: "Planning",
              rootCause: "Influencer planning not started",
              impact: `${input.target} confirmations required`,
            },
            ...current.activationCampaigns,
          ],
          auditLog: [
            {
              id: nextId("AUD"),
              user: actor,
              action: "Created campaign",
              module: "Campaigns",
              record: id,
              entity: input.branch,
              timestamp: new Date().toISOString(),
              oldValue: "",
              newValue: input.name,
            },
            ...current.auditLog,
          ],
        }));
        toast.success("Campaign created and assigned");
        return id;
      },
      addInfluencer: (campaignId, name, handle, owner) => {
        const actor = state.team.find((item) => item.id === state.rules.currentUserId)?.name ?? "System";
        const campaign = state.activationCampaigns.find((item) => item.id === campaignId);
        if (!campaign) return;
        const id = nextId("INF");
        setState((current) => ({
          ...current,
          influencers: [
            {
              id,
              campaignId,
              name,
              handle,
              owner,
              stage: "Target",
              updatedAt: new Date().toISOString(),
              history: [
                {
                  id: nextId("HIS"),
                  stage: "Target",
                  actor,
                  timestamp: new Date().toISOString(),
                  previousValue: "Created",
                },
              ],
            },
            ...current.influencers,
          ],
          auditLog: [
            {
              id: nextId("AUD"),
              user: actor,
              action: "Added influencer",
              module: "Campaigns",
              record: id,
              entity: campaign.branch,
              timestamp: new Date().toISOString(),
              oldValue: "",
              newValue: "Target",
            },
            ...current.auditLog,
          ],
        }));
        toast.success("Influencer added to campaign planning");
      },
      advanceInfluencer: (influencerId, stage) => {
        const currentInfluencer = state.influencers.find((item) => item.id === influencerId);
        const campaign = state.activationCampaigns.find((item) => item.id === currentInfluencer?.campaignId);
        if (!currentInfluencer || !campaign) return;
        const actor = state.team.find((item) => item.id === state.rules.currentUserId)?.name ?? "System";
        const now = new Date().toISOString();
        const queueMap: Partial<Record<InfluencerStage, OperationsQueue>> = {
          Confirmed: "Coordination",
          Scheduled: "Visits",
          Visited: "Posting Coverage",
          "Posting Coverage Received": "QA",
          "Replacement Required": "Onboarding",
        };
        const queue = queueMap[stage];
        setState((current) => {
          const influencers = current.influencers.map((item) =>
            item.id === influencerId
              ? {
                  ...item,
                  stage,
                  updatedAt: now,
                  history: [
                    { id: nextId("HIS"), stage, actor, timestamp: now, previousValue: item.stage },
                    ...item.history,
                  ],
                }
              : item,
          );
          const campaignInfluencers = influencers.filter((item) => item.campaignId === campaign.id);
          const approved = campaignInfluencers.filter((item) =>
            [
              "Approved",
              "Scheduled",
              "Visited",
              "Posting Coverage Received",
              "Posting Coverage Verified",
              "Completed",
            ].includes(item.stage),
          ).length;
          const replacements = campaignInfluencers.filter((item) => item.stage === "Replacement Required").length;
          const ratio = approved / Math.max(1, campaign.target);
          let health: ActivationCampaign["health"] = "Green";
          if (replacements > 2 || ratio < 0.25) health = "Red";
          else if (ratio < 0.75) health = "Amber";
          return {
            ...current,
            influencers,
            activationCampaigns: current.activationCampaigns.map((item) =>
              item.id === campaign.id
                ? {
                    ...item,
                    health,
                    rootCause: ratio < 1 ? "Approval target gap" : "On target",
                    impact: `${Math.max(0, campaign.target - approved)} approvals remaining`,
                    nextAction: replacements ? "Source replacements" : "Progress influencer workflow",
                  }
                : item,
            ),
            operationsQueue: queue
              ? [
                  {
                    id: nextId("OPS"),
                    queue,
                    companyId: campaign.companyId,
                    campaignId: campaign.id,
                    influencerId,
                    owner: campaign.operationsOwner,
                    priority: health === "Red" ? "High" : "Medium",
                    status: "Open",
                    createdAt: now,
                    deadline: new Date(Date.now() + 24 * 3600000).toISOString(),
                    slaHours: 24,
                    nextAction: stage === "Visited" ? "Collect posting coverage" : `Process ${stage}`,
                    escalated: false,
                  },
                  ...current.operationsQueue,
                ]
              : current.operationsQueue,
            auditLog: [
              {
                id: nextId("AUD"),
                user: actor,
                action: "Moved influencer stage",
                module: "Campaigns",
                record: influencerId,
                entity: campaign.branch,
                timestamp: now,
                oldValue: currentInfluencer.stage,
                newValue: stage,
              },
              ...current.auditLog,
            ],
          };
        });
        toast.success(`Influencer moved to ${stage}`);
      },
      createWork: (input) => {
        setState((current) => ({
          ...current,
          operationsQueue: [
            {
              id: nextId("OPS"),
              ...input,
              influencerId: null,
              priority: "Medium",
              status: "Open",
              createdAt: new Date().toISOString(),
              deadline: new Date(Date.now() + 24 * 3600000).toISOString(),
              slaHours: 24,
              escalated: false,
            },
            ...current.operationsQueue,
          ],
        }));
        toast.success("Operations work created");
      },
      reassignWork: (workId, owner) => {
        setState((current) => ({
          ...current,
          operationsQueue: current.operationsQueue.map((item) => (item.id === workId ? { ...item, owner } : item)),
        }));
        toast.success("Queue ownership updated");
      },
      completeWork: (workId) => {
        setState((current) => ({
          ...current,
          operationsQueue: current.operationsQueue.map((item) =>
            item.id === workId ? { ...item, status: "Completed" } : item,
          ),
        }));
        toast.success("Queue item completed");
      },
      requestAccount: (input) => {
        const actor = state.team.find((item) => item.id === state.rules.currentUserId)?.name ?? "System";
        const requestId = nextId("COA");
        setState((current) => ({
          ...current,
          accountRequests: [
            {
              id: requestId,
              ...input,
              requestedBy: actor,
              submittedAt: new Date().toISOString(),
              status: "Pending Finance",
            },
            ...current.accountRequests,
          ],
          auditLog: [
            {
              id: nextId("AUD"),
              user: actor,
              action: "Submitted Chart of Accounts request",
              module: "Finance",
              record: requestId,
              entity: input.entity,
              timestamp: new Date().toISOString(),
              oldValue: "Not submitted",
              newValue: "Pending Finance",
            },
            ...current.auditLog,
          ],
        }));
        toast.success("Account request submitted to Finance");
      },
      decideAccountRequest: (requestId, approved) => {
        const role = state.team.find((item) => item.id === state.rules.currentUserId)?.role;
        if (role !== "Admin" && role !== "Finance") {
          toast.error("Finance or Admin access is required");
          return;
        }
        const request = state.accountRequests.find((item) => item.id === requestId);
        if (!request) return;
        const actor = state.team.find((item) => item.id === state.rules.currentUserId)?.name ?? "Finance";
        setState((current) => ({
          ...current,
          accountRequests: current.accountRequests.map((item) =>
            item.id === requestId ? { ...item, status: approved ? "Approved" : "Rejected" } : item,
          ),
          chartOfAccounts: approved
            ? [
                ...current.chartOfAccounts,
                {
                  code: `6${String(current.chartOfAccounts.length + 1).padStart(3, "0")}`,
                  name: request.accountName,
                  type: request.accountType,
                  groupCategory: "Requested Accounts",
                  entityApplicability: [request.entity],
                  active: true,
                  approvedBy: actor,
                  effectiveDate: new Date().toISOString().slice(0, 10),
                },
              ]
            : current.chartOfAccounts,
          auditLog: [
            {
              id: nextId("AUD"),
              user: actor,
              action: approved ? "Approved Chart of Accounts request" : "Rejected Chart of Accounts request",
              module: "Finance",
              record: requestId,
              entity: request.entity,
              timestamp: new Date().toISOString(),
              oldValue: "Pending Finance",
              newValue: approved ? "Approved" : "Rejected",
            },
            ...current.auditLog,
          ],
        }));
        toast.success(approved ? "Account approved and created" : "Account request rejected");
      },
      recordPayment: (invoiceId, amount) => {
        run((current) => payInvoice(current, invoiceId, amount), "Payment recorded");
      },
      canApprove: (kind) => {
        if (!state.rules.enforceRoleAccess) return true;
        const role = state.team.find((item) => item.id === state.rules.currentUserId)?.role;
        return role === "Admin" || role === kind;
      },
      progressCampaign: (campaignId) => {
        run((current) => advanceQuotation(current, campaignId), "Quotation workflow updated");
      },
      requestRevision: (campaignId) => {
        run((current) => reviewQuotation(current, campaignId, "Revision Required"), "Returned for revision");
      },
      rejectCampaign: (campaignId) => {
        run((current) => reviewQuotation(current, campaignId, "Rejected"), "Quotation rejected");
      },
      setClientDecision: () => {
        toast.error("Open the quotation and record a structured loss reason.");
      },
    };
  }, [state]);

  if (!hydrated)
    return (
      <div role="status" className="p-6 text-muted-foreground text-sm">
        Loading your saved demo workspace…
      </div>
    );
  return <CompaniesContext.Provider value={value}>{children}</CompaniesContext.Provider>;
}

export function useCompanies() {
  const context = useContext(CompaniesContext);
  if (!context) throw new Error("useCompanies must be used inside CompaniesProvider");
  return context;
}
