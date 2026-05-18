import React from "react";
import { Text, StyleSheet } from "react-native";
import SectionAccordion, { Field, ListField } from "./SectionAccordion";
import { useTheme } from "../utils/ThemeContext";

/** JSON DeepSeek → аккордеоны */
export default function AnalysisBlocks({ data, showTranscript, transcript }) {
  const { colors } = useTheme();

  if (!data) {
    return (
      <Text style={[styles.muted, { color: colors.muted }]}>
        Разбор появится во время приёма или после подключения к интернету.
      </Text>
    );
  }

  const a = data.anamnesis;
  const p = data.психологический_разбор;
  const r = data.рекомендации_психологу;
  const s = data.сексуальный_анамнез;

  return (
    <>
      <SectionAccordion title="Краткое резюме" defaultOpen>
        <Text style={{ color: colors.text, lineHeight: 22 }}>{data.краткое_резюме || "—"}</Text>
      </SectionAccordion>
      <SectionAccordion title="Анамнез">
        <Field label="Жалоба" value={a?.жалоба_клиента} />
        <Field label="Длительность" value={a?.длительность_проблемы} />
        <Field label="Семейное положение" value={a?.семейное_положение} />
        <Field label="Дети" value={a?.дети} />
        <Field label="Работа" value={a?.работа} />
        <Field label="Опыт терапии" value={a?.предыдущий_опыт_терапии} />
        <ListField label="Ключевые факты" items={a?.ключевые_факты} />
      </SectionAccordion>
      <SectionAccordion title="Психологический разбор">
        <Field label="Эмоции" value={p?.эмоциональное_состояние} />
        <ListField label="Паттерны" items={p?.основные_паттерны} />
        <ListField label="Причины" items={p?.возможные_причины} />
        <Field label="Защиты" value={p?.защиты_и_сопротивление} />
      </SectionAccordion>
      <SectionAccordion title="Рекомендации">
        <Field label="Внимание" value={r?.на_что_обратить_внимание} />
        <ListField label="Техники" items={r?.техники_интервенции} />
        <ListField label="Вопросы" items={r?.уточняющие_вопросы} />
        <Field label="Зоны роста" value={r?.зоны_роста} />
      </SectionAccordion>
      <SectionAccordion title="Сексуальный анамнез">
        <Field label="Ориентация" value={s?.сексуальная_ориентация} />
        <Field label="Партнёр" value={s?.партнёр} />
        <Field label="Удовлетворённость" value={s?.удовлетворённость} />
        <Field label="Травмы / страхи" value={s?.травмы_или_страхи} />
        <Field label="К сексологу" value={s?.обращаться_ли_к_сексологу} />
      </SectionAccordion>
      {showTranscript ? (
        <SectionAccordion title="Расшифровка">
          <Text style={{ color: colors.text, lineHeight: 21, fontSize: 14 }}>{transcript || "—"}</Text>
        </SectionAccordion>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  muted: { fontStyle: "italic", padding: 8 },
});
