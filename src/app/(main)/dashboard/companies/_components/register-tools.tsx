"use client";

import { useEffect, useState } from "react";

import { Bookmark, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function exportRows(name: string, rows: Record<string, string | number>[]) {
  if (!rows.length) {
    toast.info("No records to export in this view.");
    return;
  }
  const keys = Object.keys(rows[0]);
  const escapeCell = (value: string | number) => {
    const text = String(value);
    return `"${(/^[=+@\-\t\r]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
  };
  const csv = [
    keys.map(escapeCell).join(","),
    ...rows.map((row) => keys.map((key) => escapeCell(row[key] ?? "")).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function RegisterTools({
  name,
  search,
  onSearch,
  rows,
}: {
  name: string;
  search: string;
  onSearch: (value: string) => void;
  rows: Record<string, string | number>[];
}) {
  const [saved, setSaved] = useState<string | null>(null);
  useEffect(() => {
    setSaved(localStorage.getItem(`trygc:view:${name}`));
  }, [name]);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Input
        className="max-w-sm"
        aria-label={`Search ${name}`}
        placeholder="Search records…"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          try {
            localStorage.setItem(`trygc:view:${name}`, search);
            setSaved(search);
            toast.success("Search view saved");
          } catch {
            toast.error("View could not be saved");
          }
        }}
      >
        <Bookmark data-icon="inline-start" />
        Save view
      </Button>
      {saved !== null && (
        <Button size="sm" variant="ghost" onClick={() => onSearch(saved)}>
          Restore view
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => exportRows(name, rows)}>
        <Download data-icon="inline-start" />
        Export CSV
      </Button>
    </div>
  );
}
