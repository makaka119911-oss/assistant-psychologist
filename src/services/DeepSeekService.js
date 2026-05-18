/**
 * Анализ через Vercel API (Cerebras на сервере) или свой ключ в настройках.
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

async function serverReady(settings) {
  const res = await fetch(`${settings.apiBaseUrl.replace(/\/$/, "")}/api/health`, {
    method: "GET",
  });
  const data = await res.json();
  if (!data.ok) return false;
  return !!(data.cerebras || data.deepseek || settings.deepseekApiKey);
}

export async function analyzeTranscript(transcript, sessionMeta = {}, previous = null) {
  if (!(await isOnline())) {
    throw new Error(ERRORS.noInternet);
  }

  const settings = await loadSettings();
  const base = settings.apiBaseUrl.replace(/\/$/, "");

  if (!settings.deepseekApiKey) {
    try {
      if (!(await serverReady(settings))) {
        throw new Error(ERRORS.noApiKey);
      }
    } catch (e) {
      if (e.message === ERRORS.noApiKey) throw e;
      throw new Error(ERRORS.serverUnreachable);
    }
  }

  let res;
  try {
    res = await fetch(`${base}/api/analyze`, {
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

export async function analyzePendingSession(session) {
  const text = session.transcript?.trim() || "";
  if (text.length < 30) throw new Error(ERRORS.tooShort);
  return analyzeTranscript(text, { clientName: session.clientName, retry: true });
}
