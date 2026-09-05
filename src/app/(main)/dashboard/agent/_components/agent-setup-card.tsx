"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { CircleCheck, KeyRound, RefreshCw, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useAgentSettings } from "./agent-settings";

interface StatusPayload {
  ready: { id: string; label: string }[];
  anyConfigured: boolean;
}

/**
 * Asks the server which providers can actually answer, so an unconfigured agent
 * says so up front rather than failing on the first message.
 */
export function useAgentReadiness() {
  const settings = useAgentSettings();
  const credentials = settings.credentials;
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/agent/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ credentials }),
      });
      setStatus((await response.json()) as StatusPayload);
    } catch {
      setStatus(null);
    } finally {
      setChecking(false);
    }
  }, [credentials]);

  useEffect(() => {
    void check();
  }, [check]);

  return { status, checking, recheck: check };
}

export function AgentSetupCard({ onRecheck, checking }: { onRecheck: () => void; checking: boolean }) {
  const settings = useAgentSettings();

  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">No model provider is configured yet</p>
          <p className="mt-1 text-muted-foreground text-sm">
            The agent needs one key before it can answer. Save a key for any provider and it will be used, whichever one
            is selected.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" asChild>
              <Link href="/dashboard/agent/settings">
                <KeyRound aria-hidden="true" /> Add a key
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={onRecheck} disabled={checking}>
              <RefreshCw className={checking ? "animate-spin" : ""} aria-hidden="true" /> Re-check
            </Button>
          </div>
          <p className="mt-3 text-muted-foreground text-xs">
            Or add <code className="font-mono">{settings.provider.envVar}</code> to{" "}
            <code className="font-mono">.env.local</code> and restart the dev server. See{" "}
            <code className="font-mono">.env.example</code> for every supported variable.
          </p>
        </div>
      </div>
    </div>
  );
}

export function AgentReadyBadge({ ready }: { ready: { id: string; label: string }[] }) {
  if (!ready.length) return null;
  return (
    <Badge variant="secondary" className="gap-1">
      <CircleCheck className="size-3" aria-hidden="true" />
      {ready.length === 1 ? ready[0].label : `${ready.length} providers ready`}
    </Badge>
  );
}
