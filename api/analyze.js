import { analyzeTranscript } from "../server/cerebras.mjs";

export const config = {
  maxDuration: 60,
};

/** POST /api/analyze — разбор расшифровки через Cerebras */
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Только POST" });
    return;
  }

  try {
    const { transcript, previous, sessionMeta, options } = req.body || {};

    if (!transcript || String(transcript).trim().length < 30) {
      res.status(400).json({
        ok: false,
        error: "Слишком мало текста для анализа (минимум ~30 символов)",
      });
      return;
    }

    const result = await analyzeTranscript({
      transcript: String(transcript),
      previous: previous || null,
      sessionMeta: sessionMeta || {},
      options: options || {},
    });

    res.status(200).json({ ok: true, result });
  } catch (e) {
    console.error("[analyze]", e);
    res.status(500).json({
      ok: false,
      error: String(e.message || e),
    });
  }
}
