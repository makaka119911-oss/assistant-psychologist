import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AnalysisBlocks from "../components/AnalysisBlocks";
import { exportSessionPdf } from "../components/PDFGenerator";
import {
  getSession,
  updateSession,
  parseAnalysis,
} from "../services/StorageService";
import * as DeepSeek from "../services/DeepSeekService";
import { useTheme } from "../utils/ThemeContext";
import { ERRORS } from "../utils/constants";

/** Результат сессии: разбор, имя клиента, PDF */
export default function AnalysisScreen({ route }) {
  const sessionId = route.params?.sessionId;
  const { colors } = useTheme();
  const [session, setSession] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!sessionId) return;
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
    await updateSession(sessionId, { clientName: clientName.trim() });
    Alert.alert("Сохранено", "Имя клиента обновлено");
    load();
  };

  const runAnalysis = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const result = await DeepSeek.analyzePendingSession({
        ...session,
        clientName: clientName.trim(),
      });
      await updateSession(sessionId, {
        analysis: result,
        pendingAnalysis: false,
        status: "done",
      });
      setAnalysis(result);
      Alert.alert("Готово", "Разбор обновлён");
      load();
    } catch (e) {
      Alert.alert("Не удалось", e.message || ERRORS.apiFailed);
    } finally {
      setLoading(false);
    }
  };

  const onExport = async () => {
    try {
      setExporting(true);
      await exportSessionPdf({ ...session, clientName: clientName.trim() || session.clientName });
    } catch (e) {
      Alert.alert("PDF", e.message);
    } finally {
      setExporting(false);
    }
  };

  if (!session) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.pad}>
      <Text style={[styles.date, { color: colors.muted }]}>
        {new Date(session.date).toLocaleString("ru-RU")} · {session.durationMinutes} мин
      </Text>

      {session.pendingAnalysis && (
        <View style={[styles.banner, { backgroundColor: colors.accentSoft }]}>
          <Text style={{ color: colors.accent, flex: 1 }}>
            Ожидает анализа (был офлайн или ошибка сети)
          </Text>
          <Pressable
            style={[styles.smallBtn, { backgroundColor: colors.accent }]}
            onPress={runAnalysis}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: "#fff" }}>Анализ</Text>
            )}
          </Pressable>
        </View>
      )}

      <Text style={[styles.label, { color: colors.text }]}>Имя клиента</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        value={clientName}
        onChangeText={setClientName}
        placeholder="Можно ввести после сессии"
        placeholderTextColor={colors.muted}
      />
      <Pressable style={[styles.btn, { backgroundColor: colors.accentSoft }]} onPress={saveName}>
        <Text style={{ color: colors.accent, textAlign: "center" }}>Сохранить имя</Text>
      </Pressable>

      <Pressable
        style={[styles.btn, { backgroundColor: colors.accent, marginTop: 12, opacity: exporting ? 0.6 : 1 }]}
        onPress={onExport}
        disabled={exporting}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
          {exporting ? "PDF…" : "📄 Экспорт отчёта"}
        </Text>
      </Pressable>

      <AnalysisBlocks data={analysis} showTranscript transcript={session.transcript} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  date: { marginBottom: 12 },
  label: { fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 8 },
  btn: { padding: 14, borderRadius: 12 },
  banner: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, marginBottom: 12, gap: 8 },
  smallBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
});
