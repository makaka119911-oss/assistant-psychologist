/**
 * Анализ через ваш сервер (ключ в .env на ПК) или ключ в настройках телефона.
 * Данные уходят только на DeepSeek API.
 */
import * as Network from "expo-network";
import { loadSettings } from "./StorageService";
import { ERRORS } from "../utils/constants";

export async function isOnline() {
  try {
    const s = await Network.getNetworkStateAsync();
    return s.isConnected && s.isInternetReachable !== false;
  } catch {
    return false;
  }
}

export async function analyzeTranscript(transcript, sessionMeta = {}, previous = null) {
  if (!(await isOnline())) {
    throw new Error(ERRORS.noInternet);
  }

  const settings = await loadSettings();
  if (!settings.deepseekApiKey) {
    // Проверим, есть ли ключ на сервере
    try {
      const h = await fetch(`${settings.apiBaseUrl}/api/health`, { method: "GET" });
      const data = await h.json();
      if (!data.deepseek) throw new Error(ERRORS.noApiKey);
    } catch {
      throw new Error(ERRORS.serverUnreachable);
    }
  }

  let res;
  try {
    res = await fetch(`${settings.apiBaseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        previous,
        sessionMeta,
        options: {
          apiKey: settings.deepseekApiKey || undefined,
          model: settings.model,
          temperature: settings.temperature,
        },
      }),
    });
  } catch {
    throw new Error(ERRORS.serverUnreachable);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(ERRORS.apiFailed);
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.error || ERRORS.apiFailed);
  }
  return data.result;
}

/** Повторный анализ для офлайн-сессий */
export async function analyzePendingSession(session) {
  const text = session.transcript?.trim() || "";
  if (text.length < 30) throw new Error(ERRORS.tooShort);
  return analyzeTranscript(text, { clientName: session.clientName, retry: true });
}
