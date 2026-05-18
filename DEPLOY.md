# Деплой на Vercel + GitHub

## GitHub

Репозиторий: https://github.com/makaka119911-oss/assistant-psychologist

## Vercel

1. Зайти на https://vercel.com → **Add New Project** → Import из GitHub `assistant-psychologist`
2. **Environment Variables** (обязательно):
   - `CEREBRAS_API_KEY` = ключ с [cloud.cerebras.ai](https://cloud.cerebras.ai)
   - опционально: `CEREBRAS_MODEL` = `llama3.1-8b`
3. Deploy

После деплоя откройте сайт в **Chrome** → «Начать приём» → разрешите микрофон.

## Локально (как на Vercel)

```bash
npm install -g vercel
vercel dev
```

В `.env.local` (для vercel dev):
```
CEREBRAS_API_KEY=csk-...
```

## Важно для браузера

- Нужен **Chrome** (Web Speech API)
- Микрофон по **HTTPS** — на Vercel это автоматически
- Ключ Cerebras только на сервере Vercel (в настройках проекта), не в коде
