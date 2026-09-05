import type { ReactNode } from "react";

import { AgentSettingsProvider } from "./_components/agent-settings";

/** Shared so the agent and its settings page read the same stored configuration. */
export default function AgentLayout({ children }: { children: ReactNode }) {
  return <AgentSettingsProvider>{children}</AgentSettingsProvider>;
}
