"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ExternalLink, KeyRound, Loader2, PlugZap, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { type ProviderId, providerCatalogue, useAgentSettings } from "./agent-settings";
import { categoryLabels, defaultPolicies, type ToolPolicy, toolCategories } from "./agent-tools";

interface CatalogueModel {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
}

const policyLabels: Record<ToolPolicy, string> = {
  auto: "Run automatically",
  confirm: "Ask me first",
  blocked: "Block entirely",
};

/** Provider, model, endpoint and credentials. */
export function ConnectionSection() {
  const settings = useAgentSettings();
  const provider = settings.provider;
  const activeKey = settings.activeKey;
  const [models, setModels] = useState<CatalogueModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);

  const loadCatalogue = useCallback(async () => {
    setLoading(true);
    setCatalogueError(null);
    try {
      const response = await fetch(`/api/agent/models?provider=${provider.id}`, {
        headers: activeKey ? { "x-agent-key": activeKey } : undefined,
      });
      const payload = (await response.json()) as { models?: CatalogueModel[]; error?: string };
      setModels(payload.models ?? []);
      setCatalogueError(payload.error ?? null);
    } catch {
      setModels([]);
      setCatalogueError("Could not reach the model catalogue. Type the model id directly.");
    } finally {
      setLoading(false);
    }
  }, [activeKey, provider.id]);

  useEffect(() => {
    void loadCatalogue();
  }, [loadCatalogue]);

  const availableModels = useMemo(() => {
    if (provider.id === "compatible") return [];
    const fallback = provider.fallbackModels.map((id) => ({ id, name: id, provider: provider.id }));
    // Providers with their own catalogue already return exactly their own ids.
    if (["gateway", "ollama", "zen", "qwen"].includes(provider.id)) return models.length ? models : fallback;
    const own = models
      .filter((model) => model.provider === provider.id || model.id.startsWith(`${provider.id}/`))
      .map((model) => ({ ...model, id: model.id.replace(`${provider.id}/`, "") }));
    return own.length ? own : fallback;
  }, [models, provider]);

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogueModel[]>();
    for (const model of availableModels) {
      const list = map.get(model.provider) ?? [];
      list.push(model);
      map.set(model.provider, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [availableModels]);

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="agent-provider">Provider</FieldLabel>
        <Select
          value={settings.providerId}
          onValueChange={(value) => settings.update({ providerId: value as ProviderId })}
        >
          <SelectTrigger id="agent-provider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {providerCatalogue.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">{provider.blurb}</p>
      </Field>

      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="agent-model">Model</FieldLabel>
          <Button variant="ghost" size="sm" onClick={() => void loadCatalogue()} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
        </div>
        {provider.id === "compatible" || !availableModels.length ? (
          <Input
            id="agent-model"
            value={settings.modelId}
            onChange={(event) => settings.update({ modelId: event.target.value })}
            placeholder="Model id, for example llama-3.3-70b"
          />
        ) : (
          <Select value={settings.modelId} onValueChange={(value) => settings.update({ modelId: value })}>
            <SelectTrigger id="agent-model">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {grouped.map(([group, list]) => (
                <SelectGroup key={group}>
                  <SelectLabel>{group}</SelectLabel>
                  {list.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="text-muted-foreground text-xs">
          {availableModels.length
            ? `${availableModels.length} tool-capable models available.`
            : (catalogueError ?? "Enter the model id exactly as your endpoint expects it.")}
        </p>
      </Field>

      {(provider.needsBaseUrl || provider.defaultBaseUrl) && (
        <Field>
          <FieldLabel htmlFor="agent-base-url">Base URL</FieldLabel>
          <Input
            id="agent-base-url"
            value={settings.activeBaseUrl ?? ""}
            onChange={(event) => settings.setBaseUrl(provider.id, event.target.value)}
            placeholder={provider.defaultBaseUrl ?? "http://localhost:11434/v1"}
          />
          <p className="text-muted-foreground text-xs">
            {provider.defaultBaseUrl
              ? "Prefilled for the hosted endpoint. Change it for a self-hosted or regional deployment."
              : "Any OpenAI-compatible endpoint. Local runtimes must allow this origin."}
          </p>
        </Field>
      )}

      <ApiKeyField key={provider.id} />
    </FieldGroup>
  );
}

/**
 * Keys are only committed on an explicit save, so a half-typed value never
 * reaches storage, and the visitor can confirm the key actually works.
 */
export function ApiKeyField() {
  const settings = useAgentSettings();
  const provider = settings.provider;
  const saved = settings.activeKey ?? "";
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const masked = saved.length > 8 ? `${"•".repeat(Math.min(saved.length - 4, 28))}${saved.slice(-4)}` : "••••••••";

  const save = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    settings.setApiKey(provider.id, trimmed);
    setDraft("");
    setEditing(false);
    setResult(null);
    toast.success(`${provider.name} key saved in this browser.`);
  };

  const remove = () => {
    settings.setApiKey(provider.id, "");
    setDraft("");
    setEditing(false);
    setResult(null);
    toast.success(`${provider.name} key removed.`);
  };

  const test = async () => {
    setTesting(true);
    setResult(null);
    try {
      const response = await fetch("/api/agent/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providerId: provider.id,
          modelId: settings.modelId,
          apiKey: saved || undefined,
          baseURL: settings.activeBaseUrl || undefined,
        }),
      });
      const payload = (await response.json()) as { ok: boolean; message?: string; error?: string };
      setResult({
        ok: payload.ok,
        text: payload.ok ? (payload.message ?? "Connected.") : (payload.error ?? "Failed."),
      });
    } catch {
      setResult({ ok: false, text: "Could not reach the verification endpoint." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Field>
      <FieldLabel htmlFor="agent-key">
        <KeyRound className="size-3.5" aria-hidden="true" /> API key
      </FieldLabel>

      {saved && !editing ? (
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-3 py-2 font-mono text-sm">
            {masked}
          </code>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Change
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            id="agent-key"
            type="password"
            autoComplete="off"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                save();
              }
            }}
            placeholder={`Paste your ${provider.name} key`}
          />
          <Button size="sm" onClick={save} disabled={!draft.trim()}>
            Save
          </Button>
          {saved && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(false);
                setDraft("");
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={saved ? "default" : "secondary"}>{saved ? "Saved in this browser" : "Using server key"}</Badge>
        <Button variant="ghost" size="sm" onClick={() => void test()} disabled={testing}>
          {testing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <PlugZap aria-hidden="true" />}
          Test connection
        </Button>
        {saved && (
          <Button variant="ghost" size="sm" onClick={remove}>
            <Trash2 aria-hidden="true" /> Remove
          </Button>
        )}
      </div>

      {result && <p className={result.ok ? "text-primary text-xs" : "text-destructive text-xs"}>{result.text}</p>}

      <p className="text-muted-foreground text-xs">
        Held in this browser only and sent with each request. Leave it empty and the server uses{" "}
        <code className="font-mono">{provider.envVar}</code> from <code className="font-mono">.env.local</code>.
      </p>
      {provider.keyUrl && (
        <a
          href={provider.keyUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs underline underline-offset-4"
        >
          Get a key <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      )}
    </Field>
  );
}

/** The permission matrix that decides what runs without asking. */
export function PermissionSection() {
  const settings = useAgentSettings();
  const changed = toolCategories.some((category) => settings.policies[category] !== defaultPolicies[category]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-sm">What the agent may do</p>
          <p className="text-muted-foreground text-xs">
            Confirmed actions show a card you approve before anything changes.
          </p>
        </div>
        {changed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              settings.update({ policies: { ...defaultPolicies } });
              toast.success("Permissions restored to the safe defaults.");
            }}
          >
            <RotateCcw aria-hidden="true" /> Defaults
          </Button>
        )}
      </div>
      {toolCategories.map((category) => (
        <div key={category} className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{categoryLabels[category].title}</p>
            <p className="truncate text-muted-foreground text-xs">{categoryLabels[category].description}</p>
          </div>
          <Select
            value={settings.policies[category]}
            onValueChange={(value) => settings.setPolicy(category, value as ToolPolicy)}
          >
            <SelectTrigger size="sm" className="w-40 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["auto", "confirm", "blocked"] as ToolPolicy[]).map((policy) => (
                <SelectItem key={policy} value={policy}>
                  {policyLabels[policy]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}

export function VoiceSection() {
  const settings = useAgentSettings();
  return (
    <div className="flex flex-col gap-3">
      <p className="font-medium text-sm">Voice</p>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm">Dictation</p>
          <p className="text-muted-foreground text-xs">Speak instead of typing.</p>
        </div>
        <Switch checked={settings.voiceInput} onCheckedChange={(checked) => settings.update({ voiceInput: checked })} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm">Read replies aloud</p>
          <p className="text-muted-foreground text-xs">Speaks each finished answer.</p>
        </div>
        <Switch
          checked={settings.voiceOutput}
          onCheckedChange={(checked) => settings.update({ voiceOutput: checked })}
        />
      </div>
    </div>
  );
}

export function ScheduleSection() {
  const settings = useAgentSettings();
  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium text-sm">Scheduled briefs</p>
      {settings.schedules.length ? (
        settings.schedules.map((schedule) => {
          const prompt = settings.savedPrompts.find((item) => item.id === schedule.promptId);
          return (
            <div key={schedule.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
              <div className="min-w-0">
                <p className="truncate text-sm">{prompt?.title ?? "Removed prompt"}</p>
                <p className="text-muted-foreground text-xs">
                  {schedule.cadence} at {String(schedule.hour).padStart(2, "0")}:00
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={schedule.enabled ? "default" : "secondary"}>{schedule.enabled ? "On" : "Paused"}</Badge>
                <Button variant="ghost" size="sm" onClick={() => settings.removeSchedule(schedule.id)}>
                  Remove
                </Button>
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-muted-foreground text-xs">
          Schedule a brief from the prompt library. Briefs run while the agent page is open.
        </p>
      )}
    </div>
  );
}
