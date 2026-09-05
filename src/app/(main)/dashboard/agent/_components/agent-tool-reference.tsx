"use client";

import { Badge } from "@/components/ui/badge";

import { useAgentSettings } from "./agent-settings";
import { agentTools, categoryLabels, type ToolPolicy, toolCategories } from "./agent-tools";

const policyTone: Record<ToolPolicy, "default" | "secondary" | "destructive"> = {
  auto: "default",
  confirm: "secondary",
  blocked: "destructive",
};

const policyLabel: Record<ToolPolicy, string> = {
  auto: "Automatic",
  confirm: "Asks first",
  blocked: "Blocked",
};

/** Shows exactly what the agent can reach, and under which policy. */
export function AgentToolReference() {
  const settings = useAgentSettings();
  const entries = Object.entries(agentTools);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="font-medium text-sm">Capabilities</p>
        <p className="text-muted-foreground text-xs">
          {entries.length} tools across the commercial lifecycle. Change any policy in settings.
        </p>
      </div>
      <div className="divide-y overflow-hidden rounded-lg border">
        {toolCategories.map((category) => {
          const tools = entries.filter(([, spec]) => spec.category === category);
          if (!tools.length) return null;
          const policy = settings.policies[category];
          return (
            <div key={category} className="p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">{categoryLabels[category].title}</p>
                <Badge variant={policyTone[policy]} className="shrink-0">
                  {policyLabel[policy]}
                </Badge>
              </div>
              <p className="mt-0.5 text-muted-foreground text-xs">{categoryLabels[category].description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {tools.map(([name]) => (
                  <code key={name} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    {name}
                  </code>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
