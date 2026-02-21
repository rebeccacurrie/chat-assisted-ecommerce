import { CATEGORIES, SORT_OPTIONS } from "../data/products.ts";
import type { Command } from "./types.ts";

export async function sendCommand(prompt: string): Promise<Command> {
  const res = await fetch("/api/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      availableCategories: [...CATEGORIES],
      availableSorts: [...SORT_OPTIONS],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<Command>;
}
