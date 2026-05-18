# Ассистент психолога — мобильное приложение

React Native (Expo SDK 52) для Android и iOS.

## Возможности MVP

- **Начать приём** — запись аудио + распознавание речи (русский, `@react-native-voice/voice`)
- **Визуализация громкости** во время записи
- **Пауза / продолжить / закончить**
- **Фоновая запись** — `expo-av` + `UIBackgroundModes: audio` (iOS); на Android нужна dev-сборка
- **SQLite** — история сессий на устройстве
- **DeepSeek** — анализ через ваш ПК-сервер (`npm start` в корне проекта)
- **PDF** — экспорт отчёта (`expo-print` + «Поделиться»)

## Перед запуском

1. На **ПК** в папке `Ассистент психолог`:

```powershell
copy .env.example .env
# DEEPSEEK_API_KEY=sk-...
npm start
```

2. Узнай **IP компьютера** в Wi‑Fi: `ipconfig` → IPv4 (например `192.168.1.100`).

3. В приложении: **Настройки** → адрес `http://192.168.1.100:3780` → «Проверить связь».

## Установка и сборка

```powershell
cd mobile
npm install
node scripts/create-assets.mjs
npx expo prebuild
npx expo run:android
# или
npx expo run:ios
```

> **Expo Go** не поддерживает `@react-native-voice/voice` — нужна **development build** (`expo run:android`).

## Структура

| Путь | Назначение |
|------|------------|
| `app/` | Экраны (Expo Router) |
| `src/db/` | SQLite сессии |
| `src/services/` | Аудио, голос, API, PDF |
| `src/hooks/useRecordingSession.ts` | Логика приёма |

Промпт DeepSeek: `../server/prompts/system.md` (общий с веб-версией).

## Whisper (позже)

Если качество `@react-native-voice/voice` не устроит — добавить на сервер `POST /api/transcribe` (OpenAI Whisper) и отправлять файл после сессии.
