/**
 * Веб-приложение «Ассистент психолога»
 * Расшифровка (Chrome) + живой разбор DeepSeek
 */
(function () {
  const LIVE_INTERVAL_MS = 25000;
  const MIN_CHARS = 40;
  const MIN_GROWTH = 120;

  const $ = (id) => document.getElementById(id);

  let transcriptEl, statusEl, liveStatusEl, anamnesisEl, analysisEl, clientNameEl;
  let btnStart, btnStop, btnAnalyze, btnExport, btnClear;

  let recognition = null;
  let listening = false;
  let lines = [];
  let lastResult = null;
  let analyzeTimer = null;
  let analyzing = false;
  let lastAnalyzedLen = 0;
  let lastAnalyzedAt = null;

  function getTranscriptText() {
    return lines.join("\n").trim();
  }

  function renderTranscript() {
    if (!transcriptEl) return;
    transcriptEl.textContent = getTranscriptText() || "Текст появится здесь…";
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function fieldBlock(label, value) {
    const v = Array.isArray(value)
      ? value.filter(Boolean).join(" · ")
      : (value || "").trim() || "—";
    return `<div class="field"><label>${label}</label><div>${escapeHtml(v)}</div></div>`;
  }

  function renderList(label, items) {
    if (!items || !items.length) return fieldBlock(label, "—");
    return `<div class="field"><label>${label}</label><ul class="compact">${items
      .map((x) => `<li>${escapeHtml(x)}</li>`)
      .join("")}</ul></div>`;
  }

  function renderResult(data) {
    if (!data || !anamnesisEl || !analysisEl) return;

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
      '<h3 class="block-title">Анамнез</h3>',
      fieldBlock("Жалоба", a.жалоба_клиента),
      fieldBlock("Длительность", a.длительность_проблемы),
      fieldBlock("Семейное положение", a.семейное_положение),
      fieldBlock("Дети", a.дети),
      fieldBlock("Работа", a.работа),
      fieldBlock("Опыт терапии", a.предыдущий_опыт_терапии),
      renderList("Ключевые факты", a.ключевые_факты),
    ].join("");

    analysisEl.innerHTML = [
      '<h3 class="block-title">Психологический разбор</h3>',
      fieldBlock("Эмоциональное состояние", p.эмоциональное_состояние),
      renderList("Паттерны", p.основные_паттерны),
      renderList("Возможные причины", p.возможные_причины),
      fieldBlock("Защиты и сопротивление", p.защиты_и_сопротивление),
      '<h3 class="block-title">Рекомендации психологу</h3>',
      fieldBlock("На что обратить внимание", r.на_что_обратить_внимание),
      renderList("Техники", r.техники_интервенции),
      renderList("Уточняющие вопросы", r.уточняющие_вопросы),
      fieldBlock("Зоны роста", r.зоны_роста),
      '<h3 class="block-title">Сексуальный анамнез</h3>',
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

  function setStatus(text, live) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = live ? "status live" : "status";
  }

  function setupRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setStatus("Откройте сайт в Google Chrome — здесь нужен Chrome");
      if (btnStart) btnStart.disabled = true;
      return false;
    }

    recognition = new SR();
    recognition.lang = "ru-RU";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = function (event) {
      var chunk = "";
      for (var i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) chunk += event.results[i][0].transcript;
      }
      if (chunk.trim()) {
        lines.push(chunk.trim());
        renderTranscript();
        var len = getTranscriptText().length;
        if (listening && len >= MIN_CHARS && len - lastAnalyzedLen >= MIN_GROWTH && !analyzing) {
          runAnalyze(true);
        }
      }
    };

    recognition.onerror = function (e) {
      if (e.error === "no-speech") return;
      var msg = "Ошибка микрофона";
      if (e.error === "not-allowed") msg = "Разрешите микрофон в браузере";
      else if (e.error === "network") msg = "Нет сети для распознавания речи";
      else msg = "Ошибка: " + e.error;
      setStatus(msg);
      setLiveStatus(msg);
    };

    recognition.onend = function () {
      if (listening) {
        try {
          recognition.start();
        } catch (err) {
          console.warn(err);
        }
      }
    };

    return true;
  }

  async function requestMicrophone() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return true;
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(function (t) {
        t.stop();
      });
      return true;
    } catch (e) {
      setStatus("Разрешите доступ к микрофону");
      setLiveStatus("Микрофон заблокирован");
      return false;
    }
  }

  async function startListening() {
    if (!recognition) {
      setStatus("Распознавание речи недоступно. Используйте Chrome.");
      return;
    }

    setStatus("Запрашиваем микрофон…");
    var ok = await requestMicrophone();
    if (!ok) return;

    listening = true;
    lastAnalyzedLen = 0;
    lastResult = null;
    btnStart.disabled = true;
    btnStop.disabled = false;
    setStatus("Слушаю · разбор обновляется во время разговора", true);
    setLiveStatus("Ждём речь для первого разбора…");

    try {
      recognition.start();
    } catch (e) {
      try {
        recognition.stop();
        recognition.start();
      } catch (e2) {
        setStatus("Не удалось запустить микрофон: " + e2.message);
        listening = false;
        btnStart.disabled = false;
        btnStop.disabled = true;
        return;
      }
    }

    scheduleAutoAnalyze();
    setTimeout(function () {
      runAnalyze(true);
    }, 8000);
  }

  function stopListening() {
    listening = false;
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        /* ignore */
      }
    }
    btnStart.disabled = false;
    btnStop.disabled = true;
    clearInterval(analyzeTimer);
    setStatus("Пауза. Можно нажать «Разбор сейчас»");
    setLiveStatus("");
  }

  function scheduleAutoAnalyze() {
    clearInterval(analyzeTimer);
    analyzeTimer = setInterval(function () {
      if (listening && getTranscriptText().length >= MIN_CHARS) runAnalyze(true);
    }, LIVE_INTERVAL_MS);
  }

  async function runAnalyze(silent) {
    var text = getTranscriptText();
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
      var res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          previous: lastResult,
          sessionMeta: {
            clientName: clientNameEl ? clientNameEl.value.trim() || null : null,
            at: new Date().toISOString(),
          },
        }),
      });
      var data = await res.json();
      if (!data.ok) throw new Error(data.error || "Ошибка API");
      lastResult = data.result;
      lastAnalyzedLen = text.length;
      lastAnalyzedAt = new Date();
      renderResult(lastResult);
      var t = lastAnalyzedAt.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setLiveStatus("✓ Разбор обновлён в " + t);
      if (!silent) setStatus(listening ? "Слушаю · разбор актуален" : "Разбор обновлён", listening);
    } catch (e) {
      setStatus("Ошибка: " + e.message);
      setLiveStatus("Ошибка: " + e.message);
    } finally {
      analyzing = false;
      btnAnalyze.disabled = false;
    }
  }

  function buildReportMarkdown() {
    var name = clientNameEl ? clientNameEl.value.trim() || "Клиент" : "Клиент";
    var date = new Date().toLocaleString("ru-RU");
    var md = "# Сессия: " + name + "\n\nДата: " + date + "\n\n## Расшифровка\n\n" + getTranscriptText() + "\n\n";
    if (!lastResult) return md + "_Разбор не выполнялся_\n";
    md += "## Резюме\n\n" + (lastResult.краткое_резюме || "—") + "\n\n";
    return md;
  }

  function exportReport() {
    var md = buildReportMarkdown();
    var blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "session-" + Date.now() + ".md";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function clearSession() {
    stopListening();
    lines = [];
    lastResult = null;
    lastAnalyzedLen = 0;
    renderTranscript();
    if (anamnesisEl) anamnesisEl.innerHTML = "";
    if (analysisEl) analysisEl.innerHTML = "";
    if (clientNameEl) clientNameEl.value = "";
    setStatus("Сессия очищена");
    setLiveStatus("");
  }

  function init() {
    transcriptEl = $("transcript");
    statusEl = $("status");
    liveStatusEl = $("liveStatus");
    anamnesisEl = $("anamnesis");
    analysisEl = $("analysis");
    clientNameEl = $("clientName");
    btnStart = $("btnStart");
    btnStop = $("btnStop");
    btnAnalyze = $("btnAnalyze");
    btnExport = $("btnExport");
    btnClear = $("btnClear");

    if (!btnStart) {
      console.error("Кнопка btnStart не найдена");
      return;
    }

    setupRecognition();

    btnStart.addEventListener("click", function () {
      startListening();
    });
    btnStop.addEventListener("click", stopListening);
    btnAnalyze.addEventListener("click", function () {
      runAnalyze(false);
    });
    btnExport.addEventListener("click", exportReport);
    btnClear.addEventListener("click", function () {
      if (confirm("Очистить расшифровку и разбор?")) clearSession();
    });

    fetch("/api/health")
      .then(function (r) {
        return r.json();
      })
      .then(function (h) {
        if (h.deepseek) {
          setStatus("Готово · Chrome · нажмите «Начать приём»");
        } else {
          setStatus("Добавьте DEEPSEEK_API_KEY в Vercel и сделайте Redeploy");
        }
      })
      .catch(function () {
        setStatus("Нет связи с сервером");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
