const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");

const PROMPT_PATHS = [
  join(process.cwd(), "server", "prompts", "system.md"),
  join(__dirname, "..", "server", "prompts", "system.md"),
];

function loadSystemPrompt() {
  for (const p of PROMPT_PATHS) {
    if (existsSync(p)) {
      try {
        return readFileSync(p, "utf8");
      } catch {
        /* next */
      }
    }
  }
  return "Ты ассистент психолога. Отвечай только JSON.";
}

const systemPrompt = loadSystemPrompt();

function friendlyApiError(status, body) {
  const lower = String(body).toLowerCase();
  if (status === 402 || lower.includes("insufficient") || lower.includes("balance")) {
    return "Недостаточно баланса Cerebras — пополните на cloud.cerebras.ai";
  }
  if (status === 401) {
    return "Неверный CEREBRAS_API_KEY — проверьте ключ в Vercel";
  }
  if (status === 403) {
    return "Cerebras отклонил запрос (403). Повторите или проверьте ключ.";
  }
  return `Cerebras ${status}: ${String(body).slice(0, 200)}`;
}

const SESSION_TYPE_LABELS = {
  primary: "первичная",
  followup: "повторная",
  couple: "пара",
  sexology: "сексология",
};

const APPROACH_LABELS = {
  cbt: "КПТ",
  gestalt: "гештальт",
  eft: "ЭФТ",
  eclectic: "эклектика",
};

function buildSessionContext(sessionMeta = {}) {
  const parts = [];
  const st = SESSION_TYPE_LABELS[sessionMeta.sessionType] || sessionMeta.sessionType;
  const ap = APPROACH_LABELS[sessionMeta.approach] || sessionMeta.approach;
  if (st) parts.push(`Тип сессии: ${st}.`);
  if (ap) parts.push(`Предпочтительный подход: ${ap} — техники и формулировки из этого направления.`);
  if (sessionMeta.clientName) parts.push(`Имя клиента: ${sessionMeta.clientName}.`);
  return parts.join(" ");
}

function normalizeResult(data) {
  if (!data || typeof data !== "object") return data;
  if (!Array.isArray(data.что_сказать_сейчас)) data.что_сказать_сейчас = [];
  if (!Array.isArray(data.домашнее_задание)) data.домашнее_задание = [];
  const r = data.рекомендации_психологу;
  if (r && typeof r === "object") {
    if (!r.уточняющие_вопросы && r.уточняющие_опросы) {
      r.уточняющие_вопросы = r.уточняющие_опросы;
    }
    if (!Array.isArray(r.техники_интервенции)) r.техники_интервенции = [];
    if (!Array.isArray(r.уточняющие_вопросы)) r.уточняющие_вопросы = [];
  }
  return data;
}

function parseModelJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const m = String(raw).match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Модель вернула не JSON");
  }
}

async function analyzeTranscript({ transcript, previous = null, sessionMeta = {}, options = {} }) {
  const apiKey = options.apiKey || process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error("Нет CEREBRAS_API_KEY (Vercel → Environment Variables)");
  }

  const base = options.baseUrl || process.env.CEREBRAS_BASE_URL || "https://api.cerebras.ai/v1";
  const model = options.model || process.env.CEREBRAS_MODEL || "llama3.1-8b";
  const temperature =
    options.temperature !== undefined && options.temperature !== null
      ? Number(options.temperature)
      : 0.35;

  const ctx = buildSessionContext(sessionMeta);
  const userContent = [
    ctx ? `Контекст: ${ctx}` : `Метаданные: ${JSON.stringify(sessionMeta)}`,
    previous
      ? `Предыдущий разбор (обнови по новому тексту, не теряя факты):\n${JSON.stringify(previous, null, 2)}`
      : "",
    `Вот диалог (расшифровка разговора):\n\n${transcript}`,
    "Выдай результат строго в JSON формате (БЕЗ лишнего текста).",
    "Проверь: что_сказать_сейчас (2–3 фразы), домашнее_задание (1–3 пункта), в рекомендации_психологу минимум 3 техники и 5 уточняющих вопросов.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const body = {
    model,
    temperature: Math.min(0.8, Math.max(0, temperature)),
    max_completion_tokens: 3072,
    stream: false,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  };

  const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(friendlyApiError(res.status, errText));
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  return normalizeResult(parseModelJson(raw));
}

module.exports = { analyzeTranscript, SESSION_TYPE_LABELS, APPROACH_LABELS };
