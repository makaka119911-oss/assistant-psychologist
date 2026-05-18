/**
 * Веб-приложение «Ассистент психолога»
 * Расшифровка (Chrome) + живой разбор Cerebras
 */
(function () {
  const LIVE_INTERVAL_MS = 25000;
  const MIN_CHARS = 40;
  const MIN_GROWTH = 120;
  const DRAFT_KEY = "psych-assistant-draft-v1";

  const $ = (id) => document.getElementById(id);

  let transcriptEl, statusEl, liveStatusEl, anamnesisEl, analysisEl, clientNameEl;
  let btnStart, btnStop, btnAnalyze, btnExport, btnClear;
  let pillApi, pillSession, pillChars;
  let saveTimer = null;

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

  function updateStatPills() {
    var len = getTranscriptText().length;
    if (pillChars) pillChars.textContent = len + " симв.";
    if (pillSession) {
      pillSession.textContent = listening ? "Сессия: запись" : "Сессия: пауза";
      pillSession.className = listening ? "pill live" : "pill";
    }
  }

  function scheduleSaveDraft() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 400);
  }

  function saveDraft() {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          clientName: clientNameEl ? clientNameEl.value : "",
          lines: lines,
          lastResult: lastResult,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch (e) {
      console.warn("draft save", e);
    }
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d.clientName && clientNameEl) clientNameEl.value = d.clientName;
      if (Array.isArray(d.lines) && d.lines.length) lines = d.lines;
      if (d.lastResult) lastResult = d.lastResult;
      renderTranscript();
      if (lastResult) renderResult(lastResult);
      updateStatPills();
    } catch (e) {
      console.warn("draft load", e);
    }
  }

  function renderTranscript() {
    if (!transcriptEl) return;
    var text = getTranscriptText();
    if (!text) {
      transcriptEl.innerHTML = '<p class="chat-placeholder">Текст появится здесь…</p>';
    } else if (lines.length) {
      transcriptEl.innerHTML = lines
        .map(function (line, i) {
          return (
            '<article class="chat-bubble"><time>Фрагмент ' +
            (i + 1) +
            "</time>" +
            escapeHtml(line) +
            "</article>"
          );
        })
        .join("");
    } else {
      transcriptEl.innerHTML =
        '<article class="chat-bubble">' + escapeHtml(text) + "</article>";
    }
    transcriptEl.scrollTop = transcriptEl.scrollHeight;
    updateStatPills();
    scheduleSaveDraft();
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

  function accordion(title, innerHtml, open) {
    return (
      '<details class="accordion"' +
      (open ? " open" : "") +
      "><summary>" +
      escapeHtml(title) +
      '</summary><div class="accordion-body">' +
      innerHtml +
      "</div></details>"
    );
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

    var anamBody = [
      fieldBlock("Жалоба", a.жалоба_клиента),
      fieldBlock("Длительность", a.длительность_проблемы),
      fieldBlock("Семейное положение", a.семейное_положение),
      fieldBlock("Дети", a.дети),
      fieldBlock("Работа", a.работа),
      fieldBlock("Опыт терапии", a.предыдущий_опыт_терапии),
      renderList("Ключевые факты", a.ключевые_факты),
    ].join("");
    anamnesisEl.innerHTML += accordion("Анамнез", anamBody, true);

    var psychBody = [
      fieldBlock("Эмоциональное состояние", p.эмоциональное_состояние),
      renderList("Паттерны", p.основные_паттерны),
      renderList("Возможные причины", p.возможные_причины),
      fieldBlock("Защиты и сопротивление", p.защиты_и_сопротивление),
    ].join("");

    var recBody = [
      fieldBlock("На что обратить внимание", r.на_что_обратить_внимание),
      renderList("Техники", r.техники_интервенции),
      renderList("Уточняющие вопросы", r.уточняющие_вопросы),
      fieldBlock("Зоны роста", r.зоны_роста),
    ].join("");

    var sexBody = [
      fieldBlock("Ориентация", s.сексуальная_ориентация),
      fieldBlock("Партнёр", s.партнёр),
      fieldBlock("Удовлетворённость", s.удовлетворённость),
      fieldBlock("Травмы / страхи", s.травмы_или_страхи),
      fieldBlock("Обращаться к сексологу", s.обращаться_ли_к_сексологу),
    ].join("");

    analysisEl.innerHTML = [
      accordion("Психологический разбор", psychBody, true),
      '<div class="block-rec">' + accordion("Рекомендации психологу", recBody, true) + "</div>",
      accordion("Сексуальный анамнез", sexBody, false),
    ].join("");
    scheduleSaveDraft();
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
    updateStatPills();
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
    updateStatPills();
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
    if (!silent) setStatus("Обновляем разбор…");
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

  function slugify(s) {
    return String(s || "klient")
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "klient";
  }

  function buildReportMarkdown() {
    var name = clientNameEl ? clientNameEl.value.trim() || "Клиент" : "Клиент";
    var date = new Date().toLocaleString("ru-RU");
    var md = "# Сессия: " + name + "\n\n**Дата:** " + date + "\n\n";
    md += "## Расшифровка\n\n" + (getTranscriptText() || "_пусто_") + "\n\n";

    if (!lastResult) return md + "_Разбор не выполнялся_\n";

    md += "## Резюме\n\n" + (lastResult.краткое_резюме || "—") + "\n\n";
    md += "## Анамнез\n\n```json\n" + JSON.stringify(lastResult.anamnesis || {}, null, 2) + "\n```\n\n";
    md +=
      "## Психологический разбор\n\n```json\n" +
      JSON.stringify(lastResult.психологический_разбор || {}, null, 2) +
      "\n```\n\n";
    md +=
      "## Рекомендации психологу\n\n```json\n" +
      JSON.stringify(lastResult.рекомендации_психологу || {}, null, 2) +
      "\n```\n\n";
    return md;
  }

  function downloadMarkdown(md, prefix) {
    var name = slugify(clientNameEl ? clientNameEl.value : "klient");
    var blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = prefix + "-" + name + "-" + Date.now() + ".md";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportReport() {
    downloadMarkdown(buildReportMarkdown(), "session");
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
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}
    setStatus("Сессия очищена");
    setLiveStatus("");
    updateStatPills();
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
    pillApi = $("pillApi");
    pillSession = $("pillSession");
    pillChars = $("pillChars");

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
    if (btnObsidian) btnObsidian.addEventListener("click", exportObsidian);
    btnClear.addEventListener("click", function () {
      if (confirm("Очистить расшифровку и разбор?")) clearSession();
    });
    if (clientNameEl) {
      clientNameEl.addEventListener("input", scheduleSaveDraft);
    }

    loadDraft();

    fetch("/api/health")
      .then(function (r) {
        return r.json();
      })
      .then(function (h) {
        if (pillApi) {
          if (h.cerebras || h.deepseek) {
            pillApi.textContent = "AI: Cerebras ✓";
            pillApi.className = "pill ok";
          } else {
            pillApi.textContent = "AI: нет ключа";
            pillApi.className = "pill";
          }
        }
        if (h.cerebras || h.deepseek) {
          setStatus("Готово · Chrome · нажмите «Начать приём»");
        } else {
          setStatus("Добавьте CEREBRAS_API_KEY в Vercel и сделайте Redeploy");
        }
        updateStatPills();
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
