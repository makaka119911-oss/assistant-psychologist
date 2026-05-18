import { View, Text, StyleSheet } from "react-native";
import type { DeepSeekResult } from "@/types/session";
import type { Locale } from "@/i18n/translations";
import { t } from "@/i18n/translations";
import { Accordion } from "@/components/Accordion";
import { colors, spacing } from "@/constants/theme";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value?.trim() || "—"}</Text>
    </View>
  );
}

function ListField({ label, items }: { label: string; items?: string[] }) {
  const list = items?.filter(Boolean) || [];
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {list.length ? (
        list.map((x, i) => (
          <Text key={i} style={styles.bullet}>
            • {x}
          </Text>
        ))
      ) : (
        <Text style={styles.value}>—</Text>
      )}
    </View>
  );
}

export function AnalysisView({
  data,
  locale = "ru",
  defaultOpenResume = true,
  showTranscript,
  transcript,
}: {
  data: DeepSeekResult | null;
  locale?: Locale;
  defaultOpenResume?: boolean;
  showTranscript?: boolean;
  transcript?: string;
}) {
  if (!data) {
    return (
      <Text style={styles.muted}>
        {locale === "en"
          ? "Analysis will appear during the session (~25 sec after speech starts)"
          : "Разбор появится во время разговора (каждые ~25 сек)"}
      </Text>
    );
  }

  const a = data.anamnesis;
  const p = data.психологический_разбор;
  const r = data.рекомендации_психологу;
  const s = data.сексуальный_анамнез;

  return (
    <View>
      <Accordion title={t(locale, "accordionResume")} defaultOpen={defaultOpenResume}>
        <Text style={styles.resumeText}>{data.краткое_резюме || "—"}</Text>
      </Accordion>

      <Accordion title={t(locale, "accordionAnamnesis")}>
        <Field label="Жалоба" value={a?.жалоба_клиента} />
        <Field label="Длительность проблемы" value={a?.длительность_проблемы} />
        <Field label="Семейное положение" value={a?.семейное_положение} />
        <Field label="Дети" value={a?.дети} />
        <Field label="Работа" value={a?.работа} />
        <Field label="Опыт терапии" value={a?.предыдущий_опыт_терапии} />
        <ListField label="Ключевые факты" items={a?.ключевые_факты} />
      </Accordion>

      <Accordion title={t(locale, "accordionPsych")}>
        <Field label="Эмоциональное состояние" value={p?.эмоциональное_состояние} />
        <ListField label="Паттерны" items={p?.основные_паттерны} />
        <ListField label="Возможные причины" items={p?.возможные_причины} />
        <Field label="Защиты и сопротивление" value={p?.защиты_и_сопротивление} />
      </Accordion>

      <Accordion title={t(locale, "accordionRec")}>
        <Field label="На что обратить внимание" value={r?.на_что_обратить_внимание} />
        <ListField label="Техники" items={r?.техники_интервенции} />
        <ListField label="Уточняющие вопросы" items={r?.уточняющие_вопросы} />
        <Field label="Зоны роста" value={r?.зоны_роста} />
      </Accordion>

      <Accordion title={t(locale, "accordionSex")}>
        <Field label="Ориентация" value={s?.сексуальная_ориентация} />
        <Field label="Партнёр" value={s?.партнёр} />
        <Field label="Удовлетворённость" value={s?.удовлетворённость} />
        <Field label="Травмы / страхи" value={s?.травмы_или_страхи} />
        <Field label="К сексологу" value={s?.обращаться_ли_к_сексологу} />
      </Accordion>

      {showTranscript && (
        <Accordion title={t(locale, "accordionTranscript")}>
          <Text style={styles.transcript}>{transcript || "—"}</Text>
        </Accordion>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.sm },
  label: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  value: { fontSize: 15, color: colors.text, marginTop: 2 },
  bullet: { fontSize: 14, color: colors.text, marginTop: 4, lineHeight: 20 },
  resumeText: { fontSize: 15, lineHeight: 22, color: colors.text },
  transcript: { fontSize: 14, lineHeight: 21, color: colors.text },
  muted: { color: colors.muted, fontStyle: "italic", padding: spacing.sm },
});
