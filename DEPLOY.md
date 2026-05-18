# Деплой на Vercel + GitHub

## GitHub

Репозиторий: https://github.com/makaka119911-oss/assistant-psychologist

## Vercel

1. Зайти на https://vercel.com → **Add New Project** → Import из GitHub `assistant-psychologist`
2. **Environment Variables** (обязательно):
   - `DEEPSEEK_API_KEY` = ваш ключ `sk-...`
   - опционально: `DEEPSEEK_MODEL` = `deepseek-chat`
3. Deploy

После деплоя откройте сайт в **Chrome** → «Начать приём» → разрешите микрофон.

## Локально (как на Vercel)

```bash
npm install -g vercel
vercel dev
```

В `.env.local` (для vercel dev):
```
DEEPSEEK_API_KEY=sk-...
```

## Важно для браузера

- Нужен **Chrome** (Web Speech API)
- Микрофон по **HTTPS** — на Vercel это автоматически
- Ключ DeepSeek только на сервере Vercel (в настройках проекта), не в коде
