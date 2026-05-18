// Freudly-inspired палитра + тексты

export const LIGHT = {
  bg: "#f6f4fc",
  card: "#ffffff",
  text: "#1c1833",
  muted: "#6e6a86",
  accent: "#6b4eff",
  accentSoft: "#ede9ff",
  danger: "#dc2626",
  border: "#e8e4f4",
};

export const DARK = {
  bg: "#14121f",
  card: "#1f1c2e",
  text: "#f4f2ff",
  muted: "#9b96b0",
  accent: "#8b74ff",
  accentSoft: "#2a2440",
  danger: "#f87171",
  border: "#322e45",
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
