import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { DeepSeekResult, Session } from "@/types/session";
import { parseAnalysis } from "@/db/database";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function listHtml(items?: string[]): string {
  const list = items?.filter(Boolean) || [];
  if (!list.length) return "<li>—</li>";
  return list.map((x) => `<li>${esc(x)}</li>`).join("");
}

export function buildReportHtml(session: Session, data: DeepSeekResult | null): string {
  const date = new Date(session.date).toLocaleString("ru-RU");
  const name = session.clientName || "Клиент";
  const a = data?.anamnesis;
  const p = data?.психологический_разбор;
  const r = data?.рекомендации_психологу;
  const s = data?.сексуальный_анамнез;

  return `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"/>
<style>
  @page { margin: 20mm; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #2c2a26; padding: 0; margin: 0; }
  .header { border-bottom: 3px solid #5b7c6e; padding-bottom: 16px; margin-bottom: 24px; }
  .logo { font-size: 22px; font-weight: bold; color: #5b7c6e; letter-spacing: 0.5px; }
  .meta { font-size: 12px; color: #6b6560; margin-top: 8px; }
  h2 { font-size: 14px; color: #5b7c6e; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 10px; border-left: 4px solid #5b7c6e; padding-left: 10px; }
  p, li { font-size: 13px; line-height: 1.55; }
  .resume { background: #e8f0ec; padding: 14px; border-radius: 8px; font-size: 14px; }
  .box { background: #faf9f7; padding: 12px; border-radius: 6px; white-space: pre-wrap; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 4px; border-bottom: 1px solid #e0dbd4; vertical-align: top; font-size: 13px; }
  td:first-child { font-weight: 600; width: 38%; color: #6b6560; }
  .footer { margin-top: 32px; font-size: 10px; color: #999; text-align: center; }
</style></head><body>
  <div class="header">
    <div class="logo">◆ Ассистент психолога</div>
    <div class="meta">Отчёт сессии · ${esc(date)} · ${session.durationMinutes} мин</div>
    ${name !== "Клиент" ? `<div class="meta">Клиент: <strong>${esc(name)}</strong></div>` : ""}
  </div>

  <h2>Краткое резюме</h2>
  <div class="resume">${esc(data?.краткое_резюме || "—")}</div>

  <h2>Анамнез</h2>
  <table>
    <tr><td>Жалоба</td><td>${esc(a?.жалоба_клиента || "—")}</td></tr>
    <tr><td>Длительность</td><td>${esc(a?.длительность_проблемы || "—")}</td></tr>
    <tr><td>Семейное положение</td><td>${esc(a?.семейное_положение || "—")}</td></tr>
    <tr><td>Дети</td><td>${esc(a?.дети || "—")}</td></tr>
    <tr><td>Работа</td><td>${esc(a?.работа || "—")}</td></tr>
    <tr><td>Терапия</td><td>${esc(a?.предыдущий_опыт_терапии || "—")}</td></tr>
  </table>
  <ul>${listHtml(a?.ключевые_факты)}</ul>

  <h2>Психологический разбор</h2>
  <p><strong>Состояние:</strong> ${esc(p?.эмоциональное_состояние || "—")}</p>
  <p><strong>Паттерны:</strong></p><ul>${listHtml(p?.основные_паттерны)}</ul>
  <p><strong>Причины:</strong></p><ul>${listHtml(p?.возможные_причины)}</ul>
  <p><strong>Защиты:</strong> ${esc(p?.защиты_и_сопротивление || "—")}</p>

  <h2>Рекомендации психологу</h2>
  <p>${esc(r?.на_что_обратить_внимание || "—")}</p>
  <p><strong>Техники:</strong></p><ul>${listHtml(r?.техники_интервенции)}</ul>
  <p><strong>Вопросы:</strong></p><ul>${listHtml(r?.уточняющие_вопросы)}</ul>
  <p><strong>Зоны роста:</strong> ${esc(r?.зоны_роста || "—")}</p>

  <h2>Сексуальный анамнез</h2>
  <table>
    <tr><td>Ориентация</td><td>${esc(s?.сексуальная_ориентация || "—")}</td></tr>
    <tr><td>Партнёр</td><td>${esc(s?.партнёр || "—")}</td></tr>
    <tr><td>Удовлетворённость</td><td>${esc(s?.удовлетворённость || "—")}</td></tr>
    <tr><td>Травмы / страхи</td><td>${esc(s?.травмы_или_страхи || "—")}</td></tr>
    <tr><td>К сексологу</td><td>${esc(s?.обращаться_ли_к_сексологу || "—")}</td></tr>
  </table>

  <h2>Расшифровка</h2>
  <div class="box">${esc(session.transcript || "—")}</div>

  <p class="footer">Конфиденциально · инструмент помощи специалисту, не медицинский диагноз</p>
</body></html>`;
}

export async function exportSessionPdf(session: Session): Promise<void> {
  const analysis = parseAnalysis(session);
  const html = buildReportHtml(session, analysis);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Отчёт сессии",
    });
  }
}
