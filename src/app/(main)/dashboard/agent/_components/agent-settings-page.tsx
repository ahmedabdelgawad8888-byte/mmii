"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowLeft, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { AgentPromptManager } from "./agent-prompts";
import { providerCatalogue, useAgentSettings } from "./agent-settings";
import { ConnectionSection, PermissionSection, ScheduleSection, VoiceSection } from "./agent-settings-sections";
import { AgentToolReference } from "./agent-tool-reference";
import { defaultPolicies, toolCategories } from "./agent-tools";

const SETTINGS_KEY = "trygc:agent-settings:v1";

export function AgentSettingsPage() {
  const settings = useAgentSettings();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const keysHeld = providerCatalogue.filter((provider) => settings.apiKeys[provider.id]);
  const relaxed = toolCategories.filter(
    (category) => settings.policies[category] === "auto" && defaultPolicies[category] !== "auto",
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium text-muted-foreground text-sm">INTELLIGENCE · OPERATING AGENT</p>
          <h1 className="font-semibold text-2xl tracking-tight">Agent settings</h1>
          <p className="text-muted-foreground text-sm">
            Where the agent thinks, what it is allowed to touch, and what it runs on a schedule.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/agent">
            <ArrowLeft aria-hidden="true" /> Back to the agent
          </Link>
        </Button>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <div className="flex flex-col gap-6 xl:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle>Connection</CardTitle>
              <CardDescription>
                Any provider that speaks tools. Keys stay in this browser unless the server already holds one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectionSection />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                The agent reads freely. Everything that changes money or approvals is gated here.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {relaxed.length > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                  <p className="text-sm">
                    {relaxed.length === 1 ? "One category runs" : `${relaxed.length} categories run`} without asking
                    that would normally need approval. The agent can change those records unprompted.
                  </p>
                </div>
              )}
              <PermissionSection />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prompts &amp; schedules</CardTitle>
              <CardDescription>Reusable briefs, and the ones that run on a cadence.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <AgentPromptManager onRun={() => toast.info("Open the agent to run a prompt.")} />
              <Separator />
              <ScheduleSection />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 xl:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Current setup</CardTitle>
              <CardDescription>What this browser will use on the next message.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <dt className="text-muted-foreground text-xs">Provider</dt>
                  <dd className="font-medium text-sm">{settings.provider.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Model</dt>
                  <dd className="truncate font-medium font-mono text-sm">{settings.modelId || "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Credential</dt>
                  <dd className="font-medium text-sm">
                    {settings.activeKey ? "Saved in this browser" : `Server ${settings.provider.envVar}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Keys held here</dt>
                  <dd className="font-medium text-sm">{keysHeld.length || "None"}</dd>
                </div>
              </dl>
              {keysHeld.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {keysHeld.map((provider) => (
                    <Badge key={provider.id} variant="secondary">
                      {provider.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voice</CardTitle>
              <CardDescription>Browser speech, so quality varies by platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <VoiceSection />
            </CardContent>
          </Card>

          <AgentToolReference />

          <Card>
            <CardHeader>
              <CardTitle>Data held in this browser</CardTitle>
              <CardDescription>
                Settings, saved prompts, schedules and any API keys live in localStorage on this device only.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start gap-2 rounded-md border p-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <p className="text-muted-foreground text-sm">
                  Nothing here is sent anywhere except to the provider you selected, as part of a request you triggered.
                </p>
              </div>
              {confirmingReset ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm">Clear settings, keys, prompts and schedules?</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      window.localStorage.removeItem(SETTINGS_KEY);
                      window.location.reload();
                    }}
                  >
                    Clear everything
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmingReset(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setConfirmingReset(true)}>
                  <RotateCcw aria-hidden="true" /> Reset agent data
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
