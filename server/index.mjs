import "dotenv/config";
import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeTranscript } from "./cerebras.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const PORT = Number(process.env.PORT || 3780);

const app = express();
const HOST = process.env.HOST || "0.0.0.0";

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: "2mb" }));
app.use(express.static(join(root, "public")));

app.get("/api/health", (_req, res) => {
  const cerebras = !!process.env.CEREBRAS_API_KEY;
  res.json({
    ok: true,
    cerebras,
    model: process.env.CEREBRAS_MODEL || "llama3.1-8b",
    provider: "cerebras",
    deepseek: cerebras,
  });
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { transcript, previous, sessionMeta, options } = req.body || {};
    if (!transcript || String(transcript).trim().length < 30) {
      res.status(400).json({ ok: false, error: "Слишком мало текста для анализа (минимум ~30 символов)" });
      return;
    }
    const result = await analyzeTranscript({
      transcript: String(transcript),
      previous: previous || null,
      sessionMeta: sessionMeta || {},
      options: options || {},
    });
    res.json({ ok: true, result });
  } catch (e) {
    console.error("[analyze]", e);
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`[Ассистент психолог] http://127.0.0.1:${PORT} (LAN: http://<IP>:${PORT})`);
  if (!process.env.CEREBRAS_API_KEY) {
    console.warn("[!] Создай .env с CEREBRAS_API_KEY");
  }
});
