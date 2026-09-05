import type { Activity, CompaniesState } from "./types";

export function reconcileReminders(state: CompaniesState, now = Date.now()): CompaniesState {
  const additions: Activity[] = [];
  for (const quotation of state.campaigns) {
    if (!["Management Review", "Financial Review"].includes(quotation.stage)) continue;
    const hours = (now - new Date(quotation.updatedAt).getTime()) / 3_600_000;
    const threshold = [72, 48, 24].find((value) => hours >= value) ?? 0;
    if (!threshold) continue;
    const automationKey = `sla:${quotation.id}:${quotation.updatedAt}:${threshold}`;
    if (state.activities.some((item) => item.automationKey === automationKey)) continue;
    const role = threshold < 72 && quotation.stage === "Financial Review" ? "Finance" : "Management";
    additions.push({
      id: `ACT-${crypto.randomUUID()}`,
      automationKey,
      companyId: quotation.companyId,
      quotationId: quotation.id,
      type: "Task",
      title: `${threshold >= 72 ? "Escalation" : "Approval reminder"}: ${quotation.name} (${threshold}h)`,
      owner: state.team.find((item) => item.active && item.role === role)?.name ?? quotation.owner,
      dueDate: new Date(now).toISOString(),
      priority: "High",
      status: "Open",
      createdAt: new Date(now).toISOString(),
    });
  }
  if (!additions.length) return state;
  return { ...state, activities: [...additions, ...state.activities] };
}
