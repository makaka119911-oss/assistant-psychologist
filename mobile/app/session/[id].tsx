import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { getSession, parseAnalysis, updateSession } from "@/db/database";
import type { Session, DeepSeekResult } from "@/types/session";
import { AnalysisView } from "@/components/AnalysisView";
import { PrimaryButton } from "@/components/PrimaryButton";
import { exportSessionPdf } from "@/services/pdf";
import { loadSettings } from "@/services/settings";
import { t } from "@/i18n/translations";
import { colors, spacing } from "@/constants/theme";

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Number(id);
  const [session, setSession] = useState<Session | null>(null);
  const [analysis, setAnalysis] = useState<DeepSeekResult | null>(null);
  const [clientName, setClientName] = useState("");
  const [locale, setLocale] = useState<"ru" | "en">("ru");
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!sessionId) return;
    const settings = await loadSettings();
    setLocale(settings.locale);
    const s = await getSession(sessionId);
    setSession(s);
    setClientName(s?.clientName || "");
    setAnalysis(s ? parseAnalysis(s) : null);
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const saveName = async () => {
    if (!session) return;
    await updateSession(session.id, { clientName: clientName.trim() });
    await load();
    Alert.alert(t(locale, "saved"), "");
  };

  const onExport = async () => {
    if (!session) return;
    try {
      setExporting(true);
      await exportSessionPdf({ ...session, clientName: clientName.trim() || session.clientName });
    } catch (e) {
      Alert.alert("Ошибка", e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  if (!session) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.date}>
        {new Date(session.date).toLocaleString(locale === "en" ? "en-US" : "ru-RU")} ·{" "}
        {session.durationMinutes} {t(locale, "duration")}
      </Text>

      <Text style={styles.label}>{t(locale, "clientNameOptional")}</Text>
      <TextInput
        style={styles.input}
        value={clientName}
        onChangeText={setClientName}
        placeholder={t(locale, "noName")}
      />
      <PrimaryButton title={t(locale, "save")} variant="secondary" onPress={saveName} />

      <PrimaryButton
        title={t(locale, "exportPdf")}
        loading={exporting}
        onPress={onExport}
        style={{ marginVertical: spacing.md }}
      />

      {session.status === "processing" && (
        <View style={styles.banner}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.bannerText}>…</Text>
        </View>
      )}

      <AnalysisView
        data={analysis}
        locale={locale}
        showTranscript
        transcript={session.transcript}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  date: { color: colors.muted, marginBottom: spacing.md },
  label: { fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  banner: {
    flexDirection: "row",
    gap: 10,
    padding: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  bannerText: { color: colors.accent },
});
