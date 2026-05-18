const $ = (id) => document.getElementById(id);

const transcriptEl = $("transcript");
const statusEl = $("status");
const liveStatusEl = $("liveStatus");
const anamnesisEl = $("anamnesis");
const analysisEl = $("analysis");
const clientNameEl = $("clientName");

const btnStart = $("btnStart");
const btnStop = $("btnStop");
const btnAnalyze = $("btnAnalyze");
const btnExport = $("btnExport");
const btnClear = $("btnClear");

let recognition = null;
let listening = false;
let lines = [];
let lastResult = null;
let analyzeTimer = null;
let analyzing = false;
let lastAnalyzedLen = 0;
let lastAnalyzedAt = null;

const LIVE_INTERVAL_MS = 25_000;
const MIN_CHARS = 40;
const MIN_GROWTH = 120;

function getTranscriptText() {
  return lines.join("\n").trim();
}

function renderTranscript() {
  transcriptEl.textContent = getTranscriptText() || "Текст появится здесь…";
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

function fieldBlock(label, value) {
  const v = Array.isArray(value)
    ? value.filter(Boolean).join(" · ")
    : (value || "").trim() || "—";
  return `<div class="field"><label>${label}</label><div>${escapeHtml(v)}</div></div>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderList(label, items) {
  if (!items?.length) return fieldBlock(label, "—");
  return `<div class="field"><label>${label}</label><ul class="compact">${items.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div>`;
}

function renderResult(data) {
  if (!data) return;

  if (data.краткое_резюме) {
    anamnesisEl.innerHTML = `<div class="resume">${escapeHtml(data.краткое_резюме)}</div>`;
  } else {
    anamnesisEl.innerHTML = "";
  }

  const a = data.anamnesis || {};
  const p = data.психологический_разбор || {};
  const r = data.рекомендации_психологу || {};
  const s = data.сексуальный_анамнез || {};

  anamnesisEl.innerHTML += [
    "<h3 class=\"block-title\">Анамнез</h3>",
    fieldBlock("Жалоба", a.жалоба_клиента),
    fieldBlock("Длительность", a.длительность_проблемы),
    fieldBlock("Семейное положение", a.семейное_положение),
    fieldBlock("Дети", a.дети),
    fieldBlock("Работа", a.работа),
    fieldBlock("Опыт терапии", a.предыдущий_опыт_терапии),
    renderList("Ключевые факты", a.ключевые_факты),
  ].join("");

  analysisEl.innerHTML = [
    "<h3 class=\"block-title\">Психологический разбор</h3>",
    fieldBlock("Эмоциональное состояние", p.эмоциональное_состояние),
    renderList("Паттерны", p.основные_паттерны),
    renderList("Возможные причины", p.возможные_причины),
    fieldBlock("Защиты и сопротивление", p.защиты_и_сопротивление),
    "<h3 class=\"block-title\">Рекомендации психологу</h3>",
    fieldBlock("На что обратить внимание", r.на_что_обратить_внимание),
    renderList("Техники", r.техники_интервенции),
    renderList("Уточняющие вопросы", r.уточняющие_вопросы),
    fieldBlock("Зоны роста", r.зоны_роста),
    "<h3 class=\"block-title\">Сексуальный анамнез</h3>",
    fieldBlock("Ориентация", s.сексуальная_ориентация),
    fieldBlock("Партнёр", s.партнёр),
    fieldBlock("Удовлетворённость", s.удовлетворённость),
    fieldBlock("Травмы / страхи", s.травмы_или_страхи),
    fieldBlock("Обращаться к сексологу", s.обращаться_ли_к_сексологу),
  ].join("");
}

function setLiveStatus(text) {
  if (liveStatusEl) liveStatusEl.textContent = text;
}

function setStatus(text, live = false) {
  statusEl.textContent = text;
  statusEl.className = live ? "status live" : "status";
}

function setupRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    setStatus("Нужен Chrome: Web Speech API не поддерживается");
    btnStart.disabled = true;
    return;
  }

  recognition = new SR();
  recognition.lang = "ru-RU";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let chunk = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) chunk += r[0].transcript;
    }
    if (chunk.trim()) {
      lines.push(chunk.trim());
      renderTranscript();
      const len = getTranscriptText().length;
      if (
        listening &&
        len >= MIN_CHARS &&
        len - lastAnalyzedLen >= MIN_GROWTH &&
        !analyzing
      ) {
        runAnalyze(true);
      }
    }
  };

  recognition.onerror = (e) => {
    if (e.error === "no-speech") return;
    setStatus(`Ошибка микрофона: ${e.error}`);
  };

  recognition.onend = () => {
    if (listening) {
      try {
        recognition.start();
      } catch {
        /* restart */
      }
    }
  };
}

function startListening() {
  if (!recognition) return;
  listening = true;
  lastAnalyzedLen = 0;
  lastResult = null;
  btnStart.disabled = true;
  btnStop.disabled = false;
  setStatus("Слушаю · разбор обновляется во время разговора", true);
  setLiveStatus("Ждём речь для первого разбора…");
  try {
    recognition.start();
  } catch {
    recognition.stop();
    recognition.start();
  }
  scheduleAutoAnalyze();
  setTimeout(() => runAnalyze(true), 8000);
}

function stopListening() {
  listening = false;
  if (recognition) recognition.stop();
  btnStart.disabled = false;
  btnStop.disabled = true;
  clearInterval(analyzeTimer);
  setStatus("Пауза. Можно нажать «Обновить разбор»");
  setLiveStatus("");
}

function scheduleAutoAnalyze() {
  clearInterval(analyzeTimer);
  analyzeTimer = setInterval(() => {
    if (listening && getTranscriptText().length >= MIN_CHARS) runAnalyze(true);
  }, LIVE_INTERVAL_MS);
}

async function runAnalyze(silent = false) {
  const text = getTranscriptText();
  if (text.length < MIN_CHARS) {
    if (!silent) setStatus("Мало текста — подождите, пока клиент скажет больше");
    return;
  }
  if (analyzing) return;
  analyzing = true;
  btnAnalyze.disabled = true;
  if (!silent) setStatus("Обновляем разбор DeepSeek…");
  setLiveStatus("⏳ Обновляем разбор…");

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: text,
        previous: lastResult,
        sessionMeta: {
          clientName: clientNameEl.value.trim() || null,
          at: new Date().toISOString(),
        },
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Ошибка API");
    lastResult = data.result;
    lastAnalyzedLen = text.length;
    lastAnalyzedAt = new Date();
    renderResult(lastResult);
    const t = lastAnalyzedAt.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setLiveStatus(`✓ Разбор обновлён в ${t} · следующий через ~25 сек`);
    if (!silent) {
      setStatus(listening ? "Слушаю · разбор актуален" : "Разбор обновлён", listening);
    }
  } catch (e) {
    setStatus(`Ошибка: ${e.message}`);
    setLiveStatus(`Ошибка: ${e.message}`);
  } finally {
    analyzing = false;
    btnAnalyze.disabled = false;
  }
}

function buildReportMarkdown() {
  const name = clientNameEl.value.trim() || "Клиент";
  const date = new Date().toLocaleString("ru-RU");
  let md = `# Сессия: ${name}\n\nДата: ${date}\n\n## Расшифровка\n\n${getTranscriptText()}\n\n`;
  if (!lastResult) return md + "_Разбор не выполнялся_\n";

  md += `## Резюме\n\n${lastResult.краткое_резюме || "—"}\n\n`;
  const a = lastResult.anamnesis || {};
  md += "## Анамнез\n\n";
  md += `- Жалоба: ${a.жалоба_клиента || "—"}\n`;
  md += `- Длительность: ${a.длительность_проблемы || "—"}\n`;
  md += `- Семья: ${a.семейное_положение || "—"}\n`;
  md += `- Дети: ${a.дети || "—"}\n`;
  md += `- Работа: ${a.работа || "—"}\n`;
  md += `- Терапия: ${a.предыдущий_опыт_терапии || "—"}\n`;
  if (a.ключевые_факты?.length) {
    md += `- Факты: ${a.ключевые_факты.join("; ")}\n`;
  }
  return md;
}

function exportReport() {
  const md = buildReportMarkdown();
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `session-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function clearSession() {
  stopListening();
  lines = [];
  lastResult = null;
  lastAnalyzedLen = 0;
  renderTranscript();
  anamnesisEl.innerHTML = "";
  analysisEl.innerHTML = "";
  clientNameEl.value = "";
  setStatus("Сессия очищена");
  setLiveStatus("");
}

btnStart.addEventListener("click", startListening);
btnStop.addEventListener("click", stopListening);
btnAnalyze.addEventListener("click", () => runAnalyze(false));
btnExport.addEventListener("click", exportReport);
btnClear.addEventListener("click", () => {
  if (confirm("Очистить расшифровку и разбор?")) clearSession();
});

setupRecognition();

fetch("/api/health")
  .then((r) => r.json())
  .then((h) => {
    if (!h.deepseek) {
      setStatus("Сервер без DEEPSEEK_API_KEY — создай .env и перезапусти npm start");
    }
  })
  .catch(() => setStatus("Сервер не запущен — npm start в папке проекта"));
