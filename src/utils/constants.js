// Supabase-style dark + фиолетовый акцент (мобилка)

export const LIGHT = {
  bg: "#171717",
  card: "#232323",
  text: "#ededed",
  muted: "#a3a3a3",
  accent: "#8b5cf6",
  accentSoft: "rgba(139, 92, 246, 0.12)",
  danger: "#f87171",
  border: "#2e2e2e",
};

export const DARK = {
  bg: "#0a0a0a",
  card: "#1a1a1a",
  text: "#f5f5f5",
  muted: "#737373",
  accent: "#a78bfa",
  accentSoft: "rgba(167, 139, 250, 0.15)",
  danger: "#fca5a5",
  border: "#262626",
};

export const LIVE_ANALYZE_MS = 25000;
export const MIN_TEXT_CHARS = 40;

export const DEFAULT_API_URL = "https://assistant-psychologist-eosin.vercel.app";

export const ERRORS = {
  noInternet: "Нет интернета. Запись сохранена — анализ можно сделать позже в «Истории».",
  noApiKey: "Сервер недоступен. Проверьте интернет или укажите свой CEREBRAS_API_KEY в настройках.",
  serverUnreachable: "Не удалось связаться с сервером. Проверьте интернет.",
  apiFailed: "Сервер анализа не ответил. Попробуйте через минуту.",
  micDenied: "Нужен доступ к микрофону. Разрешите в настройках телефона.",
  tooShort: "Мало текста. Говорите громче, ближе к микрофону или включите громкую связь.",
  voiceUnavailable:
    "Распознавание речи недоступно в Expo Go. Установите APK (см. docs/MOBILE-PHONE.md).",
  callModeHint:
    "Сначала «Начать приём», потом ответьте на звонок и включите громкую связь. Подробнее: docs/PHONE-CALL.md",
  micBusy:
    "Микрофон занят звонком. Завершите звонок или начните приём до ответа (режим звонка).",
};

export const STORAGE_KEYS = {
  settings: "@psych/settings",
  theme: "@psych/darkTheme",
};

export const DEFAULT_SETTINGS = {
  apiBaseUrl: DEFAULT_API_URL,
  deepseekApiKey: "",
  model: "llama3.1-8b",
  temperature: 0.35,
  autoAnalyzeLive: true,
  autoAnalyzeAfter: true,
  locale: "ru",
};
