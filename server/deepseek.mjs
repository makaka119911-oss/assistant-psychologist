import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
let systemPrompt = "";

try {
  systemPrompt = readFileSync(join(dir, "prompts", "system.md"), "utf8");
} catch {
  systemPrompt = "Ты ассистент психолога. Отвечай JSON.";
}

export async function analyzeTranscript({
  transcript,
  previous = null,
  sessionMeta = {},
  options = {},
}) {
  const apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("Нет DEEPSEEK_API_KEY (настройки приложения или .env на сервере)");
  }

  const base = options.baseUrl || process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = options.model || process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const temperature =
    options.temperature !== undefined && options.temperature !== null
      ? Number(options.temperature)
      : 0.45;

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
      temperature: Math.min(0.8, Math.max(0.3, temperature)),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${errText.slice(0, 200)}`);
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
