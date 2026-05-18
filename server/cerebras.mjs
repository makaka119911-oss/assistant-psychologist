import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
let systemPrompt = "";

try {
  systemPrompt = readFileSync(join(dir, "prompts", "system.md"), "utf8");
} catch {
  systemPrompt = "Ты ассистент психолога. Отвечай только JSON.";
}

function friendlyApiError(status, body) {
  const lower = body.toLowerCase();
  if (status === 402 || lower.includes("insufficient") || lower.includes("balance")) {
    return "Недостаточно баланса Cerebras — пополните на cloud.cerebras.ai";
  }
  if (status === 401) {
    return "Неверный CEREBRAS_API_KEY — проверьте ключ в Vercel";
  }
  return `Cerebras ${status}: ${body.slice(0, 200)}`;
}

export async function analyzeTranscript({
  transcript,
  previous = null,
  sessionMeta = {},
  options = {},
}) {
  const apiKey = options.apiKey || process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error("Нет CEREBRAS_API_KEY (Vercel → Environment Variables или .env локально)");
  }

  const base = options.baseUrl || process.env.CEREBRAS_BASE_URL || "https://api.cerebras.ai/v1";
  const model = options.model || process.env.CEREBRAS_MODEL || "llama3.1-8b";
  const temperature =
    options.temperature !== undefined && options.temperature !== null
      ? Number(options.temperature)
      : 0.2;

  const userContent = [
    `Метаданные сессии: ${JSON.stringify(sessionMeta)}`,
    previous
      ? `Предыдущий разбор (обнови по новому тексту, не теряя факты):\n${JSON.stringify(previous, null, 2)}`
      : "",
    `Вот диалог (расшифровка разговора):\n\n${transcript}`,
    "Выдай результат строго в JSON формате (БЕЗ лишнего текста).",
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: Math.min(0.8, Math.max(0, temperature)),
      max_completion_tokens: 4096,
      stream: false,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(friendlyApiError(res.status, errText));
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Модель вернула не JSON");
  }
}
