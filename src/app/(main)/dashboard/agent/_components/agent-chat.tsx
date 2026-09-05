"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import {
  ArrowUpRight,
  Ban,
  Check,
  ChevronDown,
  CircleCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  Send,
  Settings2,
  ShieldQuestion,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useCompanies } from "../../companies/_components/companies-provider";
import { AgentBlock } from "./agent-blocks";
import { downloadHtml, exportConversationCsv, printConversation } from "./agent-export";
import { AgentPromptLibrary } from "./agent-prompts";
import { type Citation, type RenderPayload, runAgentTool, type ToolRunResult } from "./agent-runtime";
import { useAgentSettings } from "./agent-settings";
import { AgentSettingsPanel } from "./agent-settings-panel";
import { categoryLabels, isWriteTool, summarizeToolCall, toolCategory } from "./agent-tools";
import { useDictation, useSpeech } from "./use-voice";

const RECORD_PATTERN = /\b(QT|INV|CMP|BRD|LED|CPN|EXP|LGR|ACT|OPS)-[A-Z0-9]+\b/g;

const recordHref: Record<string, (id: string) => string> = {
  QT: (id) => `/dashboard/companies/quotations/${id}`,
  INV: (id) => `/dashboard/finance/invoices/${id}`,
  CMP: (id) => `/dashboard/companies/${id}`,
  LED: (id) => `/dashboard/companies/leads/${id}`,
  CPN: (id) => `/dashboard/campaigns/${id}`,
};

/** Turns record ids the model mentions into links back to the record. */
function LinkedText({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(RECORD_PATTERN)) {
    const id = match[0];
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    const href = recordHref[id.split("-")[0]]?.(id);
    nodes.push(
      href ? (
        <Link key={`${id}-${start}`} href={href} className="font-medium underline underline-offset-4">
          {id}
        </Link>
      ) : (
        id
      ),
    );
    cursor = start + id.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <span className="whitespace-pre-wrap">{nodes}</span>;
}

interface PendingCall {
  toolCallId: string;
  toolName: string;
  input: unknown;
}

export function AgentChat({ onReady }: { onReady?: (run: (prompt: string) => void) => void }) {
  const workspace = useCompanies();
  const settings = useAgentSettings();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<PendingCall[]>([]);
  const spokenRef = useRef<string | null>(null);

  const dictation = useDictation(setInput);
  const speech = useSpeech();

  // Kept in a ref so the transport body always reads current settings without
  // rebuilding the chat and losing the transcript.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;

  const systemPrompt = useMemo(() => {
    const team = workspace.team.map((member) => `${member.name} (${member.role}, ${member.branch})`).join("; ");
    const actor = workspace.team.find((member) => member.id === workspace.rules.currentUserId);
    return [
      "You are the operating agent for TryGC, a revenue operations, CRM and finance approval system.",
      "You help a commercial team run the lifecycle: Lead, Company, Brand, Quotation, Management approval, Finance approval, Client decision, Invoice, Payment.",
      "",
      "Working rules:",
      "- Always ground answers in tool results. Never invent a number, a record, or an id.",
      "- Call get_metrics or needs_attention before broad questions about performance or risk.",
      "- Prefer chart_data over listing records when the question is about distribution, comparison or ranking.",
      "- Refer to records by their id in square brackets, for example [QT-5001], so the interface can link them.",
      "- Money is held in each market's local currency and reported in the base currency. State which you are using.",
      "- Stage inventory is not a conversion rate. Never present one as the other.",
      "- When an action is not approved or a tool reports a refusal, explain why and stop. Do not retry it.",
      "- Be concise. Lead with the answer, then the evidence.",
      "",
      `Current scope: ${workspace.rules.activeScope}. Reporting currency: ${workspace.rules.baseCurrency}.`,
      `Acting as: ${actor ? `${actor.name}, role ${actor.role}` : "unknown"}. Role gating is ${workspace.rules.enforceRoleAccess ? "enforced" : "relaxed"}.`,
      `Today is ${new Date().toISOString().slice(0, 10)}.`,
      `Team: ${team}.`,
      `Workspace size: ${workspace.leads.length} leads, ${workspace.companies.length} companies, ${workspace.brands.length} brands, ${workspace.campaigns.length} quotations, ${workspace.financeInvoices.length} invoices.`,
    ].join("\n");
  }, [workspace]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent/chat",
        body: () => ({
          providerId: settingsRef.current.providerId,
          modelId: settingsRef.current.modelId,
          apiKey: settingsRef.current.activeKey || undefined,
          baseURL: settingsRef.current.activeBaseUrl || undefined,
          system: systemPromptRef.current,
        }),
      }),
    [],
  );

  const systemPromptRef = useRef(systemPrompt);
  systemPromptRef.current = systemPrompt;

  const execute = useCallback(
    (toolName: string, toolInput: unknown): ToolRunResult => {
      try {
        return runAgentTool(workspaceRef.current, (path) => router.push(path), toolName, toolInput);
      } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : "The action failed." };
      }
    },
    [router],
  );

  const { messages, sendMessage, addToolOutput, status, stop, setMessages, error } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: ({ toolCall }) => {
      if (toolCall.dynamic) return;
      const name = toolCall.toolName;
      const category = toolCategory(name);
      const policy = category ? settingsRef.current.policies[category] : "confirm";

      if (policy === "blocked") {
        void addToolOutput({
          tool: name as never,
          toolCallId: toolCall.toolCallId,
          output: {
            ok: false,
            message: `Blocked by workspace policy: ${category ? categoryLabels[category].title : name} is turned off. Do not retry.`,
          } as never,
        });
        return;
      }

      if (policy === "confirm") {
        setPending((current) => [
          ...current,
          { toolCallId: toolCall.toolCallId, toolName: name, input: toolCall.input },
        ]);
        return;
      }

      const result = execute(name, toolCall.input);
      void addToolOutput({ tool: name as never, toolCallId: toolCall.toolCallId, output: result as never });
    },
    onError: (chatError) => toast.error(chatError.message || "The agent request failed."),
  });

  const busy = status === "submitted" || status === "streaming";

  const resolvePending = useCallback(
    (call: PendingCall, approved: boolean) => {
      setPending((current) => current.filter((item) => item.toolCallId !== call.toolCallId));
      const result: ToolRunResult = approved
        ? execute(call.toolName, call.input)
        : { ok: false, message: "The user declined this action. Do not retry it." };
      void addToolOutput({ tool: call.toolName as never, toolCallId: call.toolCallId, output: result as never });
    },
    [addToolOutput, execute],
  );

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setInput("");
      dictation.stop();
      void sendMessage({ text: trimmed });
    },
    [busy, dictation, sendMessage],
  );

  // Read finished answers aloud when the user has asked for it.
  useEffect(() => {
    if (!settings.voiceOutput || busy) return;
    const last = messages.at(-1);
    if (last?.role !== "assistant" || last.id === spokenRef.current) return;
    const text = last.parts
      .filter((part) => part.type === "text")
      .map((part) => (part as { text: string }).text)
      .join(" ");
    if (!text.trim()) return;
    spokenRef.current = last.id;
    speech.speak(text);
  }, [busy, messages, settings.voiceOutput, speech]);

  // Scheduled briefs fire while the page is open, at most once per window.
  useEffect(() => {
    if (!settings.schedules.some((item) => item.enabled)) return;
    const timer = setInterval(() => {
      if (busy) return;
      const now = new Date();
      for (const schedule of settings.schedules) {
        if (!schedule.enabled || now.getHours() !== schedule.hour) continue;
        const stampKey = `${schedule.id}:${now.toISOString().slice(0, 13)}`;
        if (window.sessionStorage.getItem(stampKey)) continue;
        const prompt = settings.savedPrompts.find((item) => item.id === schedule.promptId);
        if (!prompt) continue;
        window.sessionStorage.setItem(stampKey, "1");
        toast.info(`Running scheduled brief: ${prompt.title}`);
        submit(prompt.prompt);
        break;
      }
    }, 60_000);
    return () => clearInterval(timer);
  }, [busy, settings.savedPrompts, settings.schedules, submit]);

  useEffect(() => {
    onReady?.(submit);
  }, [onReady, submit]);

  const exportMeta = useMemo(
    () => ({
      provider: settings.provider.name,
      model: settings.modelId,
      scope: workspace.rules.activeScope,
      currency: workspace.rules.baseCurrency,
    }),
    [settings.provider.name, settings.modelId, workspace.rules.activeScope, workspace.rules.baseCurrency],
  );

  const empty = messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {settings.provider.name} · {settings.modelId || "no model"}
          </Badge>
          {!settings.activeKey && (
            <span className="text-muted-foreground text-xs">
              Using <code className="font-mono">{settings.provider.envVar}</code> on the server
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {speech.speaking && (
            <Button variant="ghost" size="sm" onClick={speech.cancel}>
              <Volume2 aria-hidden="true" /> Stop reading
            </Button>
          )}
          {messages.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Download aria-hidden="true" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadHtml(messages, exportMeta)}>
                  <FileText aria-hidden="true" /> HTML document
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => printConversation(messages, exportMeta)}>
                  <Printer aria-hidden="true" /> PDF, via print
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportConversationCsv(messages)}>
                  <FileSpreadsheet aria-hidden="true" /> CSV transcript
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMessages([]);
                setPending([]);
              }}
            >
              <Trash2 aria-hidden="true" /> Clear
            </Button>
          )}
          <AgentSettingsPanel>
            <Button variant="outline" size="sm">
              <Settings2 aria-hidden="true" /> Settings
            </Button>
          </AgentSettingsPanel>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 rounded-lg border">
        <div className="flex flex-col gap-5 p-4">
          {empty ? (
            <Empty className="min-h-72">
              <EmptyHeader>
                <EmptyTitle>Ask about the workspace, or tell it what to do</EmptyTitle>
                <EmptyDescription>
                  The agent reads every record and can drive the commercial lifecycle. Anything that changes money or
                  approvals asks you first.
                </EmptyDescription>
              </EmptyHeader>
              <AgentPromptLibrary onPick={submit} compact />
            </Empty>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex flex-col gap-2">
                {message.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-primary-foreground text-sm">
                      {message.parts
                        .filter((part) => part.type === "text")
                        .map((part) => (
                          <p key={(part as { text: string }).text} className="whitespace-pre-wrap">
                            {(part as { text: string }).text}
                          </p>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {message.parts.map((part, index) => {
                      const key = `${message.id}-${index}`;
                      if (part.type === "text") {
                        return (
                          <div key={key} className="text-sm leading-relaxed">
                            <LinkedText text={(part as { text: string }).text} />
                          </div>
                        );
                      }
                      if (part.type === "reasoning") {
                        const reasoning = (part as { text?: string }).text ?? "";
                        if (!reasoning.trim()) return null;
                        return (
                          <Collapsible key={key}>
                            <CollapsibleTrigger className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground">
                              <ChevronDown className="size-3" aria-hidden="true" /> Reasoning
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-2 text-muted-foreground text-xs">
                              {reasoning}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      }
                      if (isToolUIPart(part)) {
                        const toolName = getToolName(part);
                        const awaiting = pending.find((item) => item.toolCallId === part.toolCallId);
                        return (
                          <ToolPart
                            key={key}
                            toolName={toolName}
                            state={part.state}
                            input={part.input}
                            output={part.output as ToolRunResult | undefined}
                            pending={awaiting}
                            onDecision={resolvePending}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            ))
          )}

          {busy && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Working…
            </div>
          )}
          {error && !busy && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error.message}</p>
          )}
        </div>
      </ScrollArea>

      <div className="sticky bottom-0 z-10 flex flex-col gap-2 bg-background pt-2 pb-1">
        {!empty && <AgentPromptLibrary onPick={submit} compact />}
        <InputGroup>
          <InputGroupTextarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit(input);
              }
            }}
            placeholder="Ask about pipeline, approvals, collections — or tell the agent to act."
            aria-label="Message the agent"
            rows={2}
          />
          <InputGroupAddon align="block-end">
            {settings.voiceInput && dictation.supported && (
              <InputGroupButton
                variant={dictation.listening ? "default" : "ghost"}
                onClick={() => (dictation.listening ? dictation.stop() : dictation.start())}
                aria-label={dictation.listening ? "Stop dictation" : "Start dictation"}
              >
                {dictation.listening ? <Square aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                {dictation.listening ? "Listening" : "Dictate"}
              </InputGroupButton>
            )}
            <div className="ms-auto flex items-center gap-1">
              {busy ? (
                <InputGroupButton variant="outline" onClick={stop} aria-label="Stop generating">
                  <Square aria-hidden="true" /> Stop
                </InputGroupButton>
              ) : (
                <InputGroupButton onClick={() => submit(input)} disabled={!input.trim()} aria-label="Send message">
                  <Send aria-hidden="true" /> Send
                </InputGroupButton>
              )}
            </div>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}

function ToolPart({
  toolName,
  state,
  input,
  output,
  pending,
  onDecision,
}: {
  toolName: string;
  state: string;
  input: unknown;
  output?: ToolRunResult;
  pending?: PendingCall;
  onDecision: (call: PendingCall, approved: boolean) => void;
}) {
  const category = toolCategory(toolName);
  const summary = summarizeToolCall(toolName, input);
  const write = isWriteTool(toolName);

  if (pending) {
    return (
      <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
        <div className="flex items-start gap-2">
          <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">{summary}</p>
            <p className="text-muted-foreground text-xs">
              {category ? categoryLabels[category].title : toolName} · needs your approval before anything changes.
            </p>
            <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted p-2 text-xs">
              {JSON.stringify(input, null, 2)}
            </pre>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => onDecision(pending, true)}>
                <Check aria-hidden="true" /> Apply
              </Button>
              <Button size="sm" variant="outline" onClick={() => onDecision(pending, false)}>
                <X aria-hidden="true" /> Decline
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "input-streaming" || state === "input-available") {
    return (
      <p className="flex items-center gap-2 text-muted-foreground text-xs">
        <Loader2 className="size-3 animate-spin" aria-hidden="true" /> {summary}
      </p>
    );
  }

  if (!output) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-muted-foreground text-xs">
        {output.ok ? (
          <CircleCheck className="size-3 text-primary" aria-hidden="true" />
        ) : (
          <Ban className="size-3 text-destructive" aria-hidden="true" />
        )}
        {summary}
        {write && output.ok && (
          <Badge variant="secondary" className="text-[10px]">
            applied
          </Badge>
        )}
      </p>
      {output.render && <AgentBlock payload={output.render as RenderPayload} />}
      {!output.render && output.message && (
        <p className={output.ok ? "text-sm" : "text-destructive text-sm"}>{output.message}</p>
      )}
      {output.citations && output.citations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {output.citations.slice(0, 8).map((citation: Citation) => (
            <Link
              key={citation.id}
              href={citation.href}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs hover:bg-accent"
            >
              {citation.label}
              <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
