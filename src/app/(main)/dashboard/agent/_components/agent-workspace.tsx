"use client";

import { useCallback, useRef } from "react";

import { AgentChat } from "./agent-chat";
import { AgentPromptManager } from "./agent-prompts";
import { AgentToolReference } from "./agent-tool-reference";

export function AgentWorkspace() {
  // The chat stays mounted for the life of the page so the transcript survives
  // interaction with the rail beside it.
  const runRef = useRef<((prompt: string) => void) | null>(null);
  const register = useCallback((run: (prompt: string) => void) => {
    runRef.current = run;
  }, []);
  const run = useCallback((prompt: string) => runRef.current?.(prompt), []);

  return (
    // On a wide screen the page itself does not scroll: the transcript and the
    // rail scroll independently, which keeps the composer on screen at all times.
    <div className="flex flex-col gap-4 xl:h-[calc(100svh-10.5rem)] xl:overflow-hidden">
      <div>
        <p className="font-medium text-muted-foreground text-sm">INTELLIGENCE · OPERATING AGENT</p>
        <h1 className="font-semibold text-2xl tracking-tight">Ask it. Then let it act.</h1>
        <p className="text-muted-foreground text-sm">
          A provider-agnostic agent wired into every record, with approvals on anything that moves money.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 items-start gap-4 xl:grid-cols-12 xl:items-stretch">
        <div className="flex h-[70svh] min-h-96 flex-col xl:col-span-8 xl:h-full xl:min-h-0">
          <AgentChat onReady={register} />
        </div>
        <div className="flex flex-col gap-4 xl:col-span-4 xl:h-full xl:min-h-0 xl:overflow-y-auto xl:pe-1">
          <AgentPromptManager onRun={run} />
          <AgentToolReference />
        </div>
      </div>
    </div>
  );
}
