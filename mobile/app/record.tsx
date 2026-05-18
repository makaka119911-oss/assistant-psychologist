import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getSession } from "@/db/database";
import { VolumeMeter } from "@/components/VolumeMeter";
import { PrimaryButton } from "@/components/PrimaryButton";
import { AnalysisView } from "@/components/AnalysisView";
import { useRecordingSession } from "@/hooks/useRecordingSession";
import { loadSettings } from "@/services/settings";
import { t } from "@/i18n/translations";
import { colors, spacing } from "@/constants/theme";

export default function RecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; clientName?: string }>();
  const sessionId = Number(params.id);
  const clientName = params.clientName || "";
  const [locale, setLocale] = useState<"ru" | "en">("ru");
  const [ready, setReady] = useState(false);

  const {
    phase,
    meter,
    transcript,
    liveAnalysis,
    analyzingLive,
    lastAnalyzedAt,
    error,
    start,
    pause,
    resume,
    finish,
    refreshAnalysis,
  } = useRecordingSession(sessionId, clientName);

  useEffect(() => {
    (async () => {
      const settings = await loadSettings();
      setLocale(settings.locale);
      if (sessionId) await getSession(sessionId);
      setReady(true);
    })();
  }, [sessionId]);

  useEffect(() => {
    if (ready && phase === "idle" && sessionId) start();
  }, [ready, phase, start, sessionId]);

  const onFinish = async () => {
    Alert.alert(
      locale === "en" ? "End session?" : "Закончить приём?",
      "",
      [
        { text: locale === "en" ? "Cancel" : "Отмена", style: "cancel" },
        {
          text: locale === "en" ? "End" : "Закончить",
          style: "destructive",
          onPress: async () => {
            await finish();
            router.replace({
              pathname: "/session/[id]",
              params: { id: String(sessionId) },
            });
          },
        },
      ],
    );
  };

  if (!ready || !sessionId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const isRecording = phase === "recording";
  const isPaused = phase === "paused";

  const liveLabel = analyzingLive
    ? "⏳ …"
    : lastAnalyzedAt
      ? `✓ ${new Date(lastAnalyzedAt).toLocaleTimeString(locale === "en" ? "en-US" : "ru-RU", { hour: "2-digit", minute: "2-digit" })}`
      : t(locale, "liveHint");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {clientName ? <Text style={styles.client}>{clientName}</Text> : null}
      <VolumeMeter level={isRecording ? meter : 0} />
      <View style={styles.liveBanner}>
        {analyzingLive && <ActivityIndicator size="small" color={colors.accent} />}
        <Text style={styles.liveText}>
          {t(locale, "liveAnalysis")} · {liveLabel}
        </Text>
      </View>

      {(isRecording || isPaused) && (
        <View style={styles.row}>
          {isRecording ? (
            <PrimaryButton title="⏸" variant="secondary" onPress={pause} />
          ) : (
            <PrimaryButton title="▶" onPress={resume} />
          )}
          <PrimaryButton
            title="🔄"
            variant="secondary"
            onPress={() => refreshAnalysis()}
            disabled={analyzingLive}
          />
          <PrimaryButton title="■" variant="danger" onPress={onFinish} />
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.section}>{t(locale, "liveAnalysis")}</Text>
      <AnalysisView data={liveAnalysis} locale={locale} defaultOpenResume />

      <Text style={styles.section}>{t(locale, "transcript")}</Text>
      <Text style={styles.transcript}>{transcript || "…"}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  client: { fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 8 },
  liveBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accentSoft,
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.sm,
  },
  liveText: { fontSize: 13, color: colors.accent },
  row: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: spacing.md },
  section: {
    marginTop: spacing.md,
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
  },
  transcript: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  error: { color: colors.danger, textAlign: "center" },
});
