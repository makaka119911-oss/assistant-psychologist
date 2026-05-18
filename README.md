# Ассистент психолога

Приложение для психолога: запись приёма, расшифровка речи, анамнез и разбор через **DeepSeek**.

> Данные клиентов хранятся **только на телефоне**. В интернет отправляется только текст расшифровки для анализа (DeepSeek).

## Структура проекта

```
Ассистент психолог/
├── App.js                 # Точка входа
├── app.json               # Настройки Expo
├── package.json
├── babel.config.js
├── server/                # Сервер на ПК (опционально)
│   ├── index.mjs
│   └── prompts/system.md
├── public/                # Веб-версия в браузере
└── src/
    ├── screens/
    │   ├── RecordScreen.js      # Запись приёма
    │   ├── AnalysisScreen.js    # Разбор сессии
    │   ├── HistoryScreen.js     # История
    │   └── SettingsScreen.js    # Настройки
    ├── components/
    │   ├── VoiceVisualizer.js
    │   ├── SectionAccordion.js
    │   ├── AnalysisBlocks.js
    │   └── PDFGenerator.js
    ├── services/
    │   ├── DeepSeekService.js
    │   ├── StorageService.js
    │   ├── AudioService.js
    │   └── NotificationService.js
    └── utils/
        ├── constants.js
        └── ThemeContext.js
```

---

## 1. Установка (один раз, на компьютере)

Нужны: [Node.js](https://nodejs.org/) (LTS), телефон и ПК в одной Wi‑Fi.

```powershell
cd "c:\Users\Ягодка\Desktop\my project\Ассистент психолог"
node scripts/create-assets.mjs
npm install
```

### Ключ DeepSeek

1. Скопируйте `.env.example` → `.env`
2. Вставьте ключ: `DEEPSEEK_API_KEY=sk-...`

### Сервер на ПК (рекомендуется)

```powershell
npm run server
```

Узнайте IP компьютера: `ipconfig` → IPv4 (например `192.168.1.100`).

В приложении на телефоне: **Настройки** → адрес `http://192.168.1.100:3780`

Либо введите API-ключ прямо в настройках телефона (без ПК).

---

## 2. Запуск для разработки / теста

```powershell
npm start
```

Отсканируйте QR в **Expo Go** — для полного функционала (микрофон, распознавание) лучше собрать APK (см. ниже).

---

## 3. Сборка APK для Android (для жены)

### Вариант A — EAS Build (проще, нужен аккаунт Expo)

```powershell
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

После сборки скачайте **APK** по ссылке из терминала и отправьте на телефон (Telegram / почта). Установите: разрешить «из неизвестных источников».

### Вариант B — локально (нужен Android Studio)

```powershell
npm run prebuild
npm run android
```

APK будет в `android/app/build/outputs/apk/`.

---

## 4. iOS (если есть Mac)

```bash
npm run prebuild
npm run ios
```

Или `eas build -p ios` (нужен Apple Developer, ~99$/год для установки на чужие телефоны).

---

## Как пользоваться (для психолога)

1. **Приём** → красная кнопка «Начать приём»
2. Во время разговора смотрите **живой разбор** (аккордеоны)
3. **Закончить** → откроется сессия, можно ввести **имя клиента**
4. **История** — все прошлые сессии
5. **Экспорт PDF** — отчёт одной кнопкой
6. Нет интернета? Запись сохранится → в **Истории** нажмите «Анализ» позже
7. Через **30 минут** придёт напоминание: «Напиши заметки, пока свежо»
8. **Тёмная тема** — в Настройках

---

## Офлайн

| Функция | Без интернета |
|---------|----------------|
| Запись аудио (диктофон) | ✅ |
| Распознавание речи | ⚠️ зависит от телефона |
| Анализ DeepSeek | ❌ → кнопка позже в Истории |

---

## Папка `mobile/`

Старая версия на Expo Router. Актуальное приложение — **в корне** (`App.js` + `src/`).
