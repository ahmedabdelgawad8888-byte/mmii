import {
  Banknote,
  Building2,
  ChartBar,
  CheckSquare,
  FolderOpen,
  Gauge,
  LayoutDashboard,
  ListTodo,
  Lock,
  type LucideIcon,
  Users,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "REVENUE",
    items: [
      {
        id: "executive-overview",
        title: "Executive brief",
        url: "/dashboard/companies/overview",
        icon: LayoutDashboard,
      },
      {
        id: "sales",
        title: "Sales workspace",
        icon: Users,
        subItems: [
          { id: "leads", title: "Leads", url: "/dashboard/companies/leads" },
          { id: "companies", title: "Companies", url: "/dashboard/companies" },
          { id: "brands", title: "Brands", url: "/dashboard/companies/brands" },
          { id: "deals", title: "Won & lost deals", url: "/dashboard/companies/deals" },
        ],
      },
      { id: "quotations", title: "Quotations", url: "/dashboard/companies/quotations", icon: FolderOpen },
      { id: "approvals", title: "Approval center", url: "/dashboard/companies/approvals", icon: CheckSquare },
    ],
  },
  {
    id: 2,
    label: "DELIVERY & EXECUTION",
    items: [
      { id: "campaigns", title: "Campaigns", url: "/dashboard/campaigns", icon: Gauge },
      { id: "creator-ledger", title: "Creator ledger", url: "/dashboard/companies/creator-ledger", icon: Users },
      { id: "operations", title: "Operations queue", url: "/dashboard/operations", icon: ListTodo },
      {
        id: "activity",
        title: "Activities & meetings",
        icon: CheckSquare,
        subItems: [
          { id: "activities", title: "Activity timeline", url: "/dashboard/companies/activities" },
          { id: "meetings", title: "Meetings", url: "/dashboard/companies/meetings" },
          { id: "tasks", title: "Follow-ups & tasks", url: "/dashboard/companies/tasks" },
        ],
      },
    ],
  },
  {
    id: 3,
    label: "FINANCE & INTELLIGENCE",
    items: [
      {
        id: "finance",
        title: "Finance",
        icon: Banknote,
        subItems: [
          { id: "finance-overview", title: "Finance overview", url: "/dashboard/finance" },
          { id: "invoices", title: "Invoices & collections", url: "/dashboard/finance/invoices" },
          { id: "planning", title: "Costs, margin & cash", url: "/dashboard/finance/planning" },
          { id: "entities", title: "Legal entities", url: "/dashboard/finance/entities" },
          { id: "coa", title: "Chart of accounts", url: "/dashboard/finance/chart-of-accounts" },
          { id: "consolidation", title: "Consolidation", url: "/dashboard/finance/consolidation" },
        ],
      },
      { id: "reports", title: "Management reports", url: "/dashboard/companies/reports", icon: ChartBar },
      { id: "analytics", title: "Analytics", url: "/dashboard/analytics", icon: Gauge },
    ],
  },
  {
    id: 4,
    label: "GOVERNANCE",
    items: [
      { id: "settings", title: "Workspace settings", url: "/dashboard/companies/settings", icon: Building2 },
      { id: "audit", title: "Audit trail", url: "/dashboard/audit-log", icon: Lock },
    ],
  },
];
