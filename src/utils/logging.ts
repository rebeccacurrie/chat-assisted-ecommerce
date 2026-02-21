import type { LogEntry } from "./types.ts";

const logs: LogEntry[] = [];

export function addLog(entry: LogEntry) {
  logs.push(entry);
}

export function getLogs(): readonly LogEntry[] {
  return logs;
}

export function clearLogs() {
  logs.length = 0;
}

export function exportJSON(): string {
  return JSON.stringify(logs, null, 2);
}

export function exportCSV(): string {
  if (logs.length === 0) return "";
  const headers = [
    "timestamp", "basePrompt", "relationName", "variantPrompt",
    "returnedCommand", "uiSnapshot", "verdict", "reason",
  ];
  const rows = logs.map((l) =>
    [
      l.timestamp,
      esc(l.basePrompt),
      l.relationName,
      esc(l.variantPrompt),
      esc(JSON.stringify(l.returnedCommand)),
      esc(JSON.stringify(l.uiSnapshot)),
      l.verdict,
      esc(l.reason),
    ].join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function esc(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
