import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Locale } from "@/i18n/translations";

const KEYS = {
  apiBaseUrl: "@psych/apiBaseUrl",
  deepseekApiKey: "@psych/deepseekApiKey",
  model: "@psych/model",
  temperature: "@psych/temperature",
  autoAnalyzeLive: "@psych/autoAnalyzeLive",
  autoAnalyzeAfter: "@psych/autoAnalyzeAfter",
  locale: "@psych/locale",
} as const;

const DEFAULT_API = "http://192.168.1.100:3780";

export type AppSettings = {
  apiBaseUrl: string;
  deepseekApiKey: string;
  model: "deepseek-chat" | "deepseek-coder";
  temperature: number;
  autoAnalyzeLive: boolean;
  autoAnalyzeAfter: boolean;
  locale: Locale;
};

export async function loadSettings(): Promise<AppSettings> {
  const [url, key, model, temp, live, after, locale] = await Promise.all([
    AsyncStorage.getItem(KEYS.apiBaseUrl),
    AsyncStorage.getItem(KEYS.deepseekApiKey),
    AsyncStorage.getItem(KEYS.model),
    AsyncStorage.getItem(KEYS.temperature),
    AsyncStorage.getItem(KEYS.autoAnalyzeLive),
    AsyncStorage.getItem(KEYS.autoAnalyzeAfter),
    AsyncStorage.getItem(KEYS.locale),
  ]);
  return {
    apiBaseUrl: (url || DEFAULT_API).replace(/\/$/, ""),
    deepseekApiKey: key || "",
    model: (model as AppSettings["model"]) || "deepseek-chat",
    temperature: temp ? Number(temp) : 0.45,
    autoAnalyzeLive: live !== "false",
    autoAnalyzeAfter: after !== "false",
    locale: (locale as Locale) || "ru",
  };
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<void> {
  const ops: Promise<void>[] = [];
  if (patch.apiBaseUrl !== undefined) {
    ops.push(AsyncStorage.setItem(KEYS.apiBaseUrl, patch.apiBaseUrl.replace(/\/$/, "")));
  }
  if (patch.deepseekApiKey !== undefined) {
    ops.push(AsyncStorage.setItem(KEYS.deepseekApiKey, patch.deepseekApiKey));
  }
  if (patch.model !== undefined) {
    ops.push(AsyncStorage.setItem(KEYS.model, patch.model));
  }
  if (patch.temperature !== undefined) {
    ops.push(AsyncStorage.setItem(KEYS.temperature, String(patch.temperature)));
  }
  if (patch.autoAnalyzeLive !== undefined) {
    ops.push(AsyncStorage.setItem(KEYS.autoAnalyzeLive, String(patch.autoAnalyzeLive)));
  }
  if (patch.autoAnalyzeAfter !== undefined) {
    ops.push(AsyncStorage.setItem(KEYS.autoAnalyzeAfter, String(patch.autoAnalyzeAfter)));
  }
  if (patch.locale !== undefined) {
    ops.push(AsyncStorage.setItem(KEYS.locale, patch.locale));
  }
  await Promise.all(ops);
}

export async function getAnalyzeOptions(): Promise<{
  apiKey?: string;
  model: string;
  temperature: number;
}> {
  const s = await loadSettings();
  return {
    apiKey: s.deepseekApiKey || undefined,
    model: s.model,
    temperature: s.temperature,
  };
}
