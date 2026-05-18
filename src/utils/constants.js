// Цвета и тексты интерфейса (светлая / тёмная тема)

export const LIGHT = {
  bg: "#f4f1ec",
  card: "#ffffff",
  text: "#2c2a26",
  muted: "#6b6560",
  accent: "#5b7c6e",
  accentSoft: "#e8f0ec",
  danger: "#dc2626",
  border: "#e0dbd4",
};

export const DARK = {
  bg: "#1a1918",
  card: "#2a2826",
  text: "#f4f1ec",
  muted: "#a39e98",
  accent: "#7a9d8c",
  accentSoft: "#2d3d36",
  danger: "#f87171",
  border: "#3d3a36",
};

// Интервал живого разбора (мс)
export const LIVE_ANALYZE_MS = 25000;
export const MIN_TEXT_CHARS = 40;

// Сообщения об ошибках — понятные человеку
export const ERRORS = {
  noInternet: "Нет интернета. Запись сохранена — анализ можно сделать позже в «Истории».",
  noApiKey: "Укажите API-ключ DeepSeek в «Настройках» или запустите сервер на компьютере.",
  serverUnreachable: "Не удалось связаться с сервером. Проверьте Wi‑Fi и адрес в настройках.",
  apiFailed: "DeepSeek не ответил. Попробуйте ещё раз через минуту.",
  micDenied: "Нужен доступ к микрофону. Разрешите в настройках телефона.",
  tooShort: "Мало текста для анализа. Поговорите подольше или говорите ближе к микрофону.",
  voiceUnavailable: "Распознавание речи недоступно. Пересоберите приложение (не Expo Go).",
};

// Ключи AsyncStorage
export const STORAGE_KEYS = {
  settings: "@psych/settings",
  theme: "@psych/darkTheme",
};

export const DEFAULT_SETTINGS = {
  apiBaseUrl: "http://192.168.1.100:3780",
  deepseekApiKey: "",
  model: "deepseek-chat",
  temperature: 0.45,
  autoAnalyzeLive: true,
  autoAnalyzeAfter: true,
  locale: "ru",
};
