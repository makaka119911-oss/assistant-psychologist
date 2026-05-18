/** GET /api/health — проверка сервера и ключа DeepSeek */
export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  res.status(200).json({
    ok: true,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    platform: "vercel",
  });
}
