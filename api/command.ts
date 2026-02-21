import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import { z } from "zod/v4";

const CATEGORIES = ["electronics", "books", "clothing", "home", "sports"] as const;
const SORTS = ["price_asc", "price_desc", "rating_desc", "name_asc"] as const;

const CommandSchema = z.object({
  filters: z.object({
    category: z.enum(CATEGORIES).nullable(),
    maxPrice: z.number().nullable(),
    minRating: z.number().nullable(),
    inStockOnly: z.boolean().nullable(),
  }),
  sort: z.enum(SORTS).nullable(),
  explanation: z.string(),
});

function buildSystemPrompt(categories: readonly string[], sorts: readonly string[]): string {
  return `You are a product filter assistant. Given a user's natural language request, output ONLY a JSON object matching this schema:

{
  "filters": {
    "category": <one of ${JSON.stringify(categories)} or null>,
    "maxPrice": <number or null>,
    "minRating": <number or null>,
    "inStockOnly": <boolean or null>
  },
  "sort": <one of ${JSON.stringify(sorts)} or null>,
  "explanation": "<short summary of what you set>"
}

Rules:
- If the user does NOT mention a field, return null for it. Do NOT invent constraints.
- category must be exactly one of the known values or null.
- sort must be exactly one of the known values or null.
- "under $X" or "less than $X" means maxPrice = X.
- "highly rated" / "top rated" means minRating >= 4.0 and/or sort "rating_desc".
- "in stock" / "available" means inStockOnly = true.
- Output ONLY the JSON object. No markdown fences, no extra text.`;
}

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenced ? fenced[1] : raw).trim();
}

async function callLLM(client: OpenAI, system: string, user: string): Promise<string> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const res = await client.chat.completions.create({
    model,
    temperature: 0,
    top_p: 1,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, availableCategories, availableSorts } = req.body ?? {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing 'prompt' string in request body" });
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing AI_GATEWAY_API_KEY env var" });
  }

  const client = new OpenAI({
    apiKey,
    ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
  });

  const cats = availableCategories ?? [...CATEGORIES];
  const sorts = availableSorts ?? [...SORTS];
  const system = buildSystemPrompt(cats, sorts);

  // First attempt
  let raw: string;
  try {
    raw = await callLLM(client, system, prompt);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(502).json({ error: "LLM call failed", detail: msg });
  }

  console.log("[command] prompt:", JSON.stringify(prompt));
  console.log("[command] raw:", raw);

  let json1: string;
  try {
    json1 = extractJSON(raw);
    const first = CommandSchema.safeParse(JSON.parse(json1));
    if (first.success) {
      return res.status(200).json(first.data);
    }
  } catch {
    json1 = raw;
  }

  // Retry with repair prompt
  console.log("[command] first parse failed, retrying");
  const repairPrompt = `The following was supposed to be valid JSON matching the schema but failed:\n\n${json1}\n\nFix it and output ONLY valid JSON. No other text.`;

  let raw2: string;
  try {
    raw2 = await callLLM(client, system, repairPrompt);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(502).json({ error: "LLM retry failed", detail: msg });
  }

  console.log("[command] retry raw:", raw2);
  try {
    const json2 = extractJSON(raw2);
    const second = CommandSchema.safeParse(JSON.parse(json2));
    if (second.success) {
      return res.status(200).json(second.data);
    }
    return res.status(422).json({
      error: "Invalid command after retry",
      firstResponse: json1,
      secondResponse: json2,
      validationError: second.error.message,
    });
  } catch {
    return res.status(422).json({ error: "Could not parse LLM response as JSON", raw: raw2 });
  }
}
