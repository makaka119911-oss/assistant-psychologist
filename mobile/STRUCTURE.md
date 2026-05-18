# Структура проекта (mobile)

```
mobile/
├── app/                      # Экраны (Expo Router)
│   ├── _layout.tsx           # Корневой Stack
│   ├── (tabs)/               # Нижние вкладки
│   │   ├── _layout.tsx       # Tab navigator
│   │   ├── index.tsx         # Начать приём
│   │   ├── history.tsx       # История сессий
│   │   └── settings.tsx      # Настройки
│   ├── record.tsx            # Запись + живой разбор
│   └── session/[id].tsx      # Детали сессии + PDF
├── src/
│   ├── components/
│   │   ├── Accordion.tsx     # Аккордеон
│   │   ├── AnalysisView.tsx  # JSON → аккордеоны
│   │   ├── SessionCard.tsx   # Карточка в истории
│   │   ├── VolumeMeter.tsx
│   │   └── PrimaryButton.tsx
│   ├── db/database.ts        # SQLite (id, date, duration, …)
│   ├── hooks/useRecordingSession.ts
│   ├── i18n/translations.ts
│   ├── services/
│   │   ├── audio.ts
│   │   ├── voice.ts
│   │   ├── deepseek.ts
│   │   ├── pdf.ts            # expo-print
│   │   └── settings.ts       # AsyncStorage
│   ├── types/session.ts
│   └── constants/theme.ts
├── assets/
└── package.json
```

Сервер (родительская папка): `server/` — API `/api/analyze`, промпт `server/prompts/system.md`.
