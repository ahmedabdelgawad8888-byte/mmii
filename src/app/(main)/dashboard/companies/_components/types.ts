export type Branch = "Saudi Arabia" | "Egypt" | "UAE" | "Kuwait" | "Qatar" | "Bahrain";
export type Currency = "SAR" | "EGP" | "AED" | "KWD" | "QAR" | "BHD";
export type OperatingScope = "Group" | Branch;
export type RecordStatus = "Active" | "Prospect" | "Inactive";
export type LeadStatus = "New" | "Contacted" | "Working" | "Qualified" | "Junk" | "Converted";
export type LeadSource = "Website" | "Referral" | "Cold Call" | "Instagram" | "LinkedIn" | "Event" | "Partner";
export type UserRole = "Sales" | "Management" | "Finance" | "Admin";
export type CampaignStage =
  | "Proposal / Price Quote"
  | "Management Review"
  | "Financial Review"
  | "Released"
  | "Sent To Client"
  | "Client Approved"
  | "Client Not Approved"
  | "Client Cancelled";
export type ApprovalStatus =
  | "Not Submitted"
  | "Pending Management"
  | "Pending Finance"
  | "Approved"
  | "Rejected"
  | "Revision Required";

export interface Company {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  industry: string;
  owner: string;
  branch: Branch;
  status: RecordStatus;
  createdAt: string;
  requestedInfluencers: number;
  freeInfluencers: number;
  usedInfluencers: number;
  source: "Grand OS starter" | "Workspace";
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  branch: Branch;
  email: string;
  active: boolean;
}

export interface Lead {
  id: string;
  leadName: string;
  companyName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  branch: Branch;
  owner: string;
  source: LeadSource;
  status: LeadStatus;
  createdAt: string;
  lastActivityAt: string | null;
  nextActivityAt: string | null;
  convertedCompanyId?: string;
  notes: string;
  qualifiedAt?: string;
  convertedAt?: string;
  budgetConfirmed?: boolean;
  meetingHeld?: boolean;
  expectedCreators?: number;
  opportunityValue?: number;
  history?: CampaignEvent[];
}

export interface WorkspaceRules {
  currentUserId: string;
  activeScope: OperatingScope;
  baseCurrency: Currency;
  requireManagementApproval: boolean;
  requireFinanceApproval: boolean;
  autoInvoiceOnClientApproval: boolean;
  enforceRoleAccess: boolean;
  followUpDays: number;
  quotationValidityDays: number;
}

export type CampaignHealth = "Green" | "Amber" | "Red" | "Critical";
export type InfluencerStage =
  | "Target"
  | "Prospected"
  | "Contacted"
  | "Interested"
  | "Confirmation Requested"
  | "Confirmed"
  | "Submitted to Client"
  | "Approved"
  | "Rejected"
  | "Replacement Required"
  | "Scheduled"
  | "Visited"
  | "Posting Coverage Received"
  | "Posting Coverage Verified"
  | "Completed";

export interface ActivationCampaign {
  id: string;
  name: string;
  companyId: string;
  branch: Branch;
  city: string;
  campaignOwner: string;
  operationsOwner: string;
  backupOwner: string;
  target: number;
  startDate: string;
  endDate: string;
  postingRequirement: string;
  brief: string;
  budget: number;
  currency: Currency;
  health: CampaignHealth;
  status: "Planning" | "Active" | "Completed" | "Cancelled";
  rootCause: string;
  impact: string;
  nextAction: string;
  eta: string;
}

export interface InfluencerHistoryEntry {
  id: string;
  stage: InfluencerStage;
  actor: string;
  timestamp: string;
  previousValue: string;
}

export interface CampaignInfluencer {
  id: string;
  campaignId: string;
  name: string;
  handle: string;
  owner: string;
  stage: InfluencerStage;
  updatedAt: string;
  history: InfluencerHistoryEntry[];
}

export type OperationsQueue = "Onboarding" | "Coordination" | "WhatsApp" | "Visits" | "Posting Coverage" | "QA";
export interface OperationsWorkItem {
  id: string;
  queue: OperationsQueue;
  companyId: string;
  campaignId: string;
  influencerId: string | null;
  owner: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Blocked" | "Completed";
  createdAt: string;
  deadline: string;
  slaHours: number;
  nextAction: string;
  escalated: boolean;
}

export interface FinanceEntity {
  id: string;
  name: string;
  country: Branch;
  currency: Currency;
  status: "Active" | "Setup";
}

export interface ChartAccount {
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  groupCategory: string;
  entityApplicability: Branch[];
  active: boolean;
  approvedBy: string;
  effectiveDate: string;
}

export interface AccountRequest {
  id: string;
  accountName: string;
  accountType: ChartAccount["type"];
  entity: Branch;
  requestedBy: string;
  submittedAt: string;
  status: "Pending Finance" | "Approved" | "Rejected" | "Revision Required";
}

export interface FinanceInvoice {
  id: string;
  companyId: string;
  campaignId: string | null;
  entity: Branch;
  currency: Currency;
  amount: number;
  paidAmount: number;
  status:
    | "Draft"
    | "Pending Approval"
    | "Approved"
    | "Issued"
    | "Sent"
    | "Partially Paid"
    | "Paid"
    | "Overdue"
    | "Cancelled";
  dueDate: string;
  createdAt: string;
  quotationId?: string;
  issuedAt?: string;
  sentAt?: string;
  paymentTerms?: string;
  poNumber?: string;
  collectionsOwner?: string;
  subtotal?: number;
  tax?: number;
  creditAmount?: number;
  fxSnapshot?: FxSnapshot;
  payments?: PaymentEntry[];
  creditNotes?: { id: string; amount: number; reason: string; issuedAt: string; actor: string }[];
}

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  module: string;
  record: string;
  entity: string;
  timestamp: string;
  oldValue: string;
  newValue: string;
}

export interface Brand {
  id: string;
  name: string;
  companyId: string;
  contactPerson: string;
  owner: string;
  branch: Branch;
  industry: string;
  status: RecordStatus;
  requestedInfluencers: number;
  freeInfluencers: number;
  usedInfluencers: number;
}

export interface CampaignEvent {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  companyId: string;
  brandId: string | null;
  owner: string;
  branch: Branch;
  currency: Currency;
  budget: number;
  requestedInfluencers: number;
  stage: CampaignStage;
  approvalStatus: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  followUpDue: string | null;
  pdfReady: boolean;
  invoiceId: string | null;
  history: CampaignEvent[];
  pricing?: QuotationPricing;
  fxSnapshot?: FxSnapshot;
  expectedCloseDate?: string;
  lossReason?: LossReason;
  lossNotes?: string;
}

export interface Activity {
  id: string;
  companyId: string;
  type: "Meeting" | "Call" | "Task" | "Note";
  title: string;
  status: "Open" | "Completed";
  createdAt: string;
  quotationId?: string;
  leadId?: string;
  brandId?: string;
  owner?: string;
  dueDate?: string;
  priority?: "High" | "Medium" | "Low";
  completedAt?: string;
  outcome?: string;
  automationKey?: string;
  meetingOutcome?: MeetingOutcome;
}

export interface MeetingOutcome {
  purpose: string;
  decision: string;
  clientRequests: string;
  budgetDiscussed: string;
  expectedCreators: number;
  nextAction: string;
  owner: string;
  deadline: string;
  nextMeeting: string;
}

export const lossReasons = [
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
] as const;
export type LossReason = (typeof lossReasons)[number];

export interface QuotationPricing {
  unitPrice: number;
  freeCreators: number;
  discount: number;
  serviceFee: number;
  vatPercent: number;
  credit: number;
  influencerCost: number;
  executionCost: number;
  operationsCost: number;
}

export interface FxSnapshot {
  rate: number;
  effectiveAt: string;
  source: string;
  actor: string;
}

export interface PaymentEntry {
  id: string;
  amount: number;
  reference: string;
  recordedAt: string;
  actor: string;
}

export interface CreatorLedgerEntry {
  id: string;
  companyId: string;
  brandId: string | null;
  quotationId?: string;
  kind: "Purchased" | "Bonus" | "Reserved" | "Released" | "Consumed" | "Expired" | "Adjusted";
  quantity: number;
  note: string;
  actor: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  companyId: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  dataUrl?: string;
}

export interface CompaniesState {
  creatorLedger: CreatorLedgerEntry[];
  expenses: FinanceExpense[];
  leads: Lead[];
  companies: Company[];
  brands: Brand[];
  campaigns: Campaign[];
  activities: Activity[];
  attachments: Attachment[];
  team: TeamMember[];
  rules: WorkspaceRules;
  fxToSar: Record<Currency, number>;
  activationCampaigns: ActivationCampaign[];
  influencers: CampaignInfluencer[];
  operationsQueue: OperationsWorkItem[];
  entities: FinanceEntity[];
  chartOfAccounts: ChartAccount[];
  accountRequests: AccountRequest[];
  financeInvoices: FinanceInvoice[];
  auditLog: AuditEntry[];
}

export interface FinanceExpense {
  id: string;
  quotationId: string;
  companyId: string;
  supplier: string;
  category: "Influencer" | "Execution" | "Operations";
  amount: number;
  currency: Currency;
  dueDate: string;
  paid: boolean;
  reference: string;
  recordedAt: string;
  actor: string;
}

export interface NewLeadInput {
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  branch: Branch;
  owner: string;
  source: LeadSource;
}

export interface NewCompanyInput {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
  owner: string;
  branch: Branch;
  status: RecordStatus;
}

export interface NewBrandInput {
  name: string;
  companyId: string;
  contactPerson: string;
  status: RecordStatus;
}

export interface NewCampaignInput {
  name: string;
  companyId: string;
  brandId: string | null;
  budget: number;
  requestedInfluencers: number;
}
