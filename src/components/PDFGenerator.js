/**
 * PDF-отчёт через expo-print (без сторонних серверов).
 */
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { parseAnalysis } from "../services/StorageService";

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function listHtml(items) {
  const a = items?.filter(Boolean) || [];
  return a.length ? a.map((x) => `<li>${esc(x)}</li>`).join("") : "<li>—</li>";
}

export function buildHtml(session, analysis) {
  const date = new Date(session.date).toLocaleString("ru-RU");
  const name = session.clientName || "Клиент";
  const a = analysis?.anamnesis;
  const p = analysis?.психологический_разбор;
  const r = analysis?.рекомендации_психологу;
  const s = analysis?.сексуальный_анамнез;

  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"/>
<style>
body{font-family:Georgia,serif;padding:24px;color:#2c2a26}
.header{border-bottom:3px solid #5b7c6e;padding-bottom:14px;margin-bottom:20px}
.logo{font-size:20px;font-weight:bold;color:#5b7c6e}
.meta{font-size:12px;color:#666;margin-top:6px}
h2{font-size:13px;color:#5b7c6e;text-transform:uppercase;margin:20px 0 8px}
.resume{background:#e8f0ec;padding:12px;border-radius:8px}
.box{background:#f5f4f2;padding:12px;white-space:pre-wrap;font-size:12px}
td{padding:6px;border-bottom:1px solid #ddd;font-size:13px}
</style></head><body>
<div class="header">
<div class="logo">◆ Ассистент психолога</div>
<div class="meta">${esc(date)} · ${session.durationMinutes} мин${name !== "Клиент" ? ` · ${esc(name)}` : ""}</div>
</div>
<h2>Краткое резюме</h2><div class="resume">${esc(analysis?.краткое_резюме || "—")}</div>
<h2>Анамнез</h2>
<table>
<tr><td>Жалоба</td><td>${esc(a?.жалоба_клиента)}</td></tr>
<tr><td>Длительность</td><td>${esc(a?.длительность_проблемы)}</td></tr>
<tr><td>Семья</td><td>${esc(a?.семейное_положение)}</td></tr>
<tr><td>Дети</td><td>${esc(a?.дети)}</td></tr>
<tr><td>Работа</td><td>${esc(a?.работа)}</td></tr>
</table>
<ul>${listHtml(a?.ключевые_факты)}</ul>
<h2>Психологический разбор</h2>
<p>${esc(p?.эмоциональное_состояние)}</p>
<ul>${listHtml(p?.основные_паттерны)}</ul>
<ul>${listHtml(p?.возможные_причины)}</ul>
<h2>Рекомендации</h2>
<p>${esc(r?.на_что_обратить_внимание)}</p>
<ul>${listHtml(r?.техники_интервенции)}</ul>
<ul>${listHtml(r?.уточняющие_вопросы)}</ul>
<h2>Сексуальный анамнез</h2>
<p>${esc(s?.сексуальная_ориентация)} · ${esc(s?.партнёр)} · ${esc(s?.удовлетворённость)}</p>
<h2>Расшифровка</h2><div class="box">${esc(session.transcript)}</div>
<p style="font-size:10px;color:#999;margin-top:24px">Конфиденциально. Не является медицинским диагнозом.</p>
</body></html>`;
}

export async function exportSessionPdf(session) {
  const analysis = parseAnalysis(session);
  const html = buildHtml(session, analysis);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Отчёт сессии",
    });
  }
  return uri;
}
