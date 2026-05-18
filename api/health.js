/** GET /api/health — проверка сервера и ключа Cerebras */
export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  const cerebras = !!process.env.CEREBRAS_API_KEY;
  res.status(200).json({
    ok: true,
    cerebras,
    model: process.env.CEREBRAS_MODEL || "llama3.1-8b",
    provider: "cerebras",
    /** @deprecated */
    deepseek: cerebras,
    platform: "vercel",
  });
}
