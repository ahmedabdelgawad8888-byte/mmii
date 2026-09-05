"use client";

import { toast } from "sonner";

import { exportRows } from "../../companies/_components/register-tools";
import type { RenderPayload, ToolRunResult } from "./agent-runtime";
import { summarizeToolCall } from "./agent-tools";

/**
 * Conversation exports. HTML is self-contained so it opens anywhere, PDF reuses
 * it through the print pipeline, and CSV flattens the transcript for a sheet.
 */

export interface ExportMessage {
  id: string;
  role: string;
  parts: unknown[];
}

export interface ExportMeta {
  provider: string;
  model: string;
  scope: string;
  currency: string;
}

interface FlatPart {
  kind: "text" | "tool";
  text?: string;
  toolName?: string;
  summary?: string;
  result?: ToolRunResult;
}

function toolStatus(result?: ToolRunResult) {
  if (!result) return "pending";
  return result.ok ? "ok" : "refused";
}

function flatten(message: ExportMessage): FlatPart[] {
  const parts: FlatPart[] = [];
  for (const raw of message.parts) {
    const part = raw as { type?: string; text?: string; output?: unknown; input?: unknown; state?: string };
    if (part.type === "text" && part.text?.trim()) {
      parts.push({ kind: "text", text: part.text });
      continue;
    }
    if (typeof part.type === "string" && part.type.startsWith("tool-")) {
      const toolName = part.type.slice("tool-".length);
      parts.push({
        kind: "tool",
        toolName,
        summary: summarizeToolCall(toolName, part.input),
        result: part.output as ToolRunResult | undefined,
      });
    }
  }
  return parts;
}

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function renderPayloadHtml(payload: RenderPayload): string {
  switch (payload.kind) {
    case "metrics":
      return `<div class="tiles">${payload.tiles
        .map(
          (tile) =>
            `<div class="tile"><span class="label">${escapeHtml(tile.label)}</span><strong>${escapeHtml(tile.value)}</strong>${
              tile.hint ? `<span class="hint">${escapeHtml(tile.hint)}</span>` : ""
            }</div>`,
        )
        .join("")}</div>`;
    case "table":
      return `<table><thead><tr>${payload.columns
        .map((column) => `<th>${escapeHtml(column)}</th>`)
        .join("")}</tr></thead><tbody>${payload.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
        .join("")}</tbody></table>`;
    case "record":
      return `<div class="record"><p class="record-title">${escapeHtml(payload.title)}</p>${
        payload.subtitle ? `<p class="hint">${escapeHtml(payload.subtitle)}</p>` : ""
      }<dl>${payload.fields
        .map((field) => `<div><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(field.value)}</dd></div>`)
        .join("")}</dl></div>`;
    case "chart":
      // Charts are interactive components, so the export carries the numbers.
      return `<p class="hint">${escapeHtml(payload.title)} (${escapeHtml(payload.unit)})</p><table><thead><tr><th>Series</th><th>Value</th></tr></thead><tbody>${payload.data
        .map(
          (point) =>
            `<tr><td>${escapeHtml(point.label)}</td><td>${escapeHtml(point.value.toLocaleString("en"))}</td></tr>`,
        )
        .join("")}</tbody></table>`;
    case "exceptions":
      return `<table><thead><tr><th>Item</th><th>Detail</th><th>Severity</th></tr></thead><tbody>${payload.items
        .map(
          (item) =>
            `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.detail)}</td><td>${escapeHtml(item.severity)}</td></tr>`,
        )
        .join("")}</tbody></table>`;
    default:
      return "";
  }
}

export function conversationToHtml(messages: ExportMessage[], meta: ExportMeta): string {
  const body = messages
    .map((message) => {
      const parts = flatten(message);
      if (!parts.length) return "";
      const who = message.role === "user" ? "You" : "Agent";
      const content = parts
        .map((part) => {
          if (part.kind === "text") return `<p>${escapeHtml(part.text).replaceAll("\n", "<br />")}</p>`;
          const result = part.result;
          let status = " · no result";
          if (result) status = result.ok ? "" : " · not applied";
          const rendered = result?.render ? renderPayloadHtml(result.render) : "";
          const message_ = !rendered && result?.message ? `<p class="hint">${escapeHtml(result.message)}</p>` : "";
          return `<div class="tool"><p class="tool-name">${escapeHtml(part.summary)}${escapeHtml(status)}</p>${rendered}${message_}</div>`;
        })
        .join("");
      return `<article class="${message.role === "user" ? "user" : "agent"}"><h2>${who}</h2>${content}</article>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>TryGC agent conversation</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px; font: 14px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: #18181b; background: #fff; }
  main { max-width: 860px; margin: 0 auto; }
  header { border-bottom: 2px solid #18181b; padding-bottom: 12px; margin-bottom: 24px; }
  h1 { margin: 0 0 4px; font-size: 20px; }
  .meta { color: #71717a; font-size: 12px; }
  article { padding: 16px 0; border-bottom: 1px solid #e4e4e7; page-break-inside: avoid; }
  article h2 { margin: 0 0 8px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #71717a; }
  article.user h2 { color: #18181b; }
  article.user { background: #fafafa; padding: 16px; border-radius: 8px; border-bottom: 0; margin-bottom: 8px; }
  p { margin: 0 0 8px; }
  .hint { color: #71717a; font-size: 12px; }
  .tool { margin: 12px 0; padding-left: 12px; border-left: 3px solid #e4e4e7; }
  .tool-name { font-size: 12px; color: #52525b; font-weight: 600; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; page-break-inside: avoid; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e4e4e7; }
  th { background: #fafafa; font-weight: 600; }
  .tiles { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; }
  .tile { flex: 1 1 150px; border: 1px solid #e4e4e7; border-radius: 6px; padding: 8px; display: flex; flex-direction: column; }
  .tile .label { font-size: 11px; color: #71717a; }
  .tile strong { font-size: 16px; }
  .record { border: 1px solid #e4e4e7; border-radius: 6px; padding: 10px; }
  .record-title { font-weight: 600; margin-bottom: 2px; }
  .record dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 8px 0 0; }
  .record dt { font-size: 11px; color: #71717a; }
  .record dd { margin: 0; font-size: 13px; font-weight: 500; }
  footer { margin-top: 24px; color: #71717a; font-size: 11px; }
  @media print { body { padding: 0; } article { break-inside: avoid; } }
</style></head>
<body><main>
<header>
  <h1>TryGC agent conversation</h1>
  <p class="meta">${escapeHtml(meta.provider)} · ${escapeHtml(meta.model)} · scope ${escapeHtml(meta.scope)} · reporting in ${escapeHtml(meta.currency)}</p>
  <p class="meta">Exported ${escapeHtml(new Date().toLocaleString("en-GB"))}</p>
</header>
${body}
<footer>Generated from demo workspace data. Figures reflect the workspace at export time.</footer>
</main></body></html>`;
}

function timestamp() {
  return new Date().toISOString().slice(0, 16).replace("T", "-").replaceAll(":", "");
}

export function downloadHtml(messages: ExportMessage[], meta: ExportMeta) {
  if (!messages.length) {
    toast.info("There is nothing to export yet.");
    return;
  }
  const html = conversationToHtml(messages, meta);
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `trygc-agent-${timestamp()}.html`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast.success("Conversation exported as HTML.");
}

/**
 * Printing a hidden iframe avoids popup blockers, and the browser's own
 * "Save as PDF" destination produces the file without shipping a PDF library.
 */
export function printConversation(messages: ExportMessage[], meta: ExportMeta) {
  if (!messages.length) {
    toast.info("There is nothing to export yet.");
    return;
  }
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    toast.error("The browser blocked the print view.");
    return;
  }
  doc.open();
  doc.write(conversationToHtml(messages, meta));
  doc.close();

  const run = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  };
  if (doc.readyState === "complete") setTimeout(run, 120);
  else frame.onload = () => setTimeout(run, 120);

  toast.info("Choose “Save as PDF” in the print dialog.");
}

export function exportConversationCsv(messages: ExportMessage[]) {
  const rows: Record<string, string | number>[] = [];
  messages.forEach((message, index) => {
    for (const part of flatten(message)) {
      if (part.kind === "text") {
        rows.push({
          turn: index + 1,
          role: message.role,
          type: "message",
          detail: part.text ?? "",
          status: "",
        });
      } else {
        rows.push({
          turn: index + 1,
          role: "tool",
          type: part.toolName ?? "",
          detail: part.summary ?? "",
          status: toolStatus(part.result),
        });
      }
    }
  });
  if (!rows.length) {
    toast.info("There is nothing to export yet.");
    return;
  }
  exportRows(`trygc-agent-${timestamp()}`, rows);
  toast.success("Conversation exported as CSV.");
}

/** Exports a single table a tool produced, which is usually the thing worth keeping. */
export function exportTableCsv(payload: Extract<RenderPayload, { kind: "table" }>) {
  const rows = payload.rows.map((row) =>
    Object.fromEntries(payload.columns.map((column, index) => [column, row[index] ?? ""])),
  );
  exportRows(`trygc-${payload.entity}-${timestamp()}`, rows);
}
