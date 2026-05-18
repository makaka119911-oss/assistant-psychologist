import type { DeepSeekResult } from "@/types/session";
import { getApiBaseUrl, getAnalyzeOptions } from "./settings";

export async function analyzeTranscript(
  transcript: string,
  sessionMeta: { clientName?: string },
  previous?: DeepSeekResult | null,
): Promise<DeepSeekResult> {
  const base = await getApiBaseUrl();
  const options = await getAnalyzeOptions();
  const res = await fetch(`${base}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      previous: previous || null,
      sessionMeta: {
        clientName: sessionMeta.clientName || null,
        source: "mobile",
        at: new Date().toISOString(),
      },
      options: {
        apiKey: options.apiKey,
        model: options.model,
        temperature: options.temperature,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Ошибка сервера ${res.status}`);
  }
  return data.result as DeepSeekResult;
}

export async function checkServerHealth(): Promise<{ ok: boolean; deepseek: boolean }> {
  try {
    const base = await getApiBaseUrl();
    const res = await fetch(`${base}/api/health`, { method: "GET" });
    return await res.json();
  } catch {
    return { ok: false, deepseek: false };
  }
}
