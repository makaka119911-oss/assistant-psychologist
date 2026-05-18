import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import VoiceVisualizer from "../components/VoiceVisualizer";
import AnalysisBlocks from "../components/AnalysisBlocks";
import * as AudioService from "../services/AudioService";
import * as DeepSeek from "../services/DeepSeekService";
import { createSession, updateSession, loadSettings } from "../services/StorageService";
import { scheduleSessionReminder, setupNotifications } from "../services/NotificationService";
import { useTheme } from "../utils/ThemeContext";
import { LIVE_ANALYZE_MS, MIN_TEXT_CHARS, ERRORS } from "../utils/constants";

/**
 * Главный экран — запись приёма и живой разбор.
 */
export default function RecordScreen({ navigation }) {
  const { colors } = useTheme();
  const [phase, setPhase] = useState("idle"); // idle | recording | paused | processing
  const [meter, setMeter] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [liveStatus, setLiveStatus] = useState("");
  const [sessionId, setSessionId] = useState(null);

  const lastResult = useRef(null);
  const lastLen = useRef(0);
  const analyzing = useRef(false);
  const timerRef = useRef(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    setupNotifications();
    loadSettings().then((s) => {
      settingsRef.current = s;
    });
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      deactivateKeepAwake();
    };
  }, []);

  const runAnalyze = async () => {
    const text = (transcript || AudioService.getLiveTranscript()).trim();
    if (text.length < MIN_TEXT_CHARS || analyzing.current || phase !== "recording") return;
    if (!settingsRef.current?.autoAnalyzeLive) return;

    analyzing.current = true;
    setLiveStatus("Обновляем разбор…");
    try {
      const online = await DeepSeek.isOnline();
      if (!online) {
        setLiveStatus("Нет сети — запись продолжается");
        return;
      }
      const result = await DeepSeek.analyzeTranscript(text, {}, lastResult.current);
      lastResult.current = result;
      lastLen.current = text.length;
      setAnalysis(result);
      if (sessionId) {
        await updateSession(sessionId, { transcript: text, analysis: result });
      }
      setLiveStatus(`Обновлено ${new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`);
    } catch (e) {
      setLiveStatus(e.message || ERRORS.apiFailed);
    } finally {
      analyzing.current = false;
    }
  };

  const start = async () => {
    try {
      const session = await createSession("");
      setSessionId(session.id);
      await activateKeepAwakeAsync();
      await AudioService.startSession(setMeter, (text) => setTranscript(text));
      setPhase("recording");
      setLiveStatus("Слушаю…");
      timerRef.current = setInterval(runAnalyze, LIVE_ANALYZE_MS);
      setTimeout(runAnalyze, 8000);
    } catch (e) {
      Alert.alert("Ошибка", e.message);
    }
  };

  const pause = async () => {
    clearInterval(timerRef.current);
    await AudioService.pauseSession();
    setPhase("paused");
    setLiveStatus("Пауза");
  };

  const resume = async () => {
    await AudioService.resumeSession();
    setPhase("recording");
    timerRef.current = setInterval(runAnalyze, LIVE_ANALYZE_MS);
    setLiveStatus("Слушаю…");
    runAnalyze();
  };

  const finish = async () => {
    clearInterval(timerRef.current);
    setPhase("processing");
    deactivateKeepAwake();
    const settings = settingsRef.current || (await loadSettings());

    try {
      const { transcript: t, audioUri } = await AudioService.stopSession();
      const text = (t || transcript).trim();
      const endedAt = new Date().toISOString();

      await updateSession(sessionId, {
        transcript: text,
        audioUri,
        endedAt,
      });

      if (text.length < 30) {
        await updateSession(sessionId, { status: "error", errorMessage: ERRORS.tooShort });
        Alert.alert("Мало текста", ERRORS.tooShort);
        setPhase("idle");
        return;
      }

      const online = await DeepSeek.isOnline();
      if (online && settings.autoAnalyzeAfter) {
        const result = await DeepSeek.analyzeTranscript(text, {}, lastResult.current);
        await updateSession(sessionId, {
          analysis: result,
          status: "done",
          pendingAnalysis: false,
        });
        await scheduleSessionReminder(sessionId);
        navigation.replace("Analysis", { sessionId });
      } else {
        await updateSession(sessionId, {
          status: "done",
          pendingAnalysis: !online,
        });
        await scheduleSessionReminder(sessionId);
        Alert.alert(
          online ? "Готово" : "Сохранено офлайн",
          online
            ? "Сессия сохранена."
            : ERRORS.noInternet,
          [{ text: "OK", onPress: () => navigation.replace("Analysis", { sessionId }) }],
        );
      }
    } catch (e) {
      await updateSession(sessionId, {
        status: "error",
        errorMessage: e.message,
        pendingAnalysis: true,
      });
      Alert.alert("Ошибка", e.message);
      navigation.replace("Analysis", { sessionId });
    }
  };

  const confirmEnd = () => {
    Alert.alert("Закончить приём?", "Сессия будет сохранена.", [
      { text: "Отмена", style: "cancel" },
      { text: "Закончить", style: "destructive", onPress: finish },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.pad}>
      {phase === "idle" ? (
        <Pressable style={[styles.bigBtn, { backgroundColor: colors.danger }]} onPress={start}>
          <Text style={styles.bigBtnText}>Начать приём</Text>
        </Pressable>
      ) : (
        <>
          <VoiceVisualizer level={phase === "recording" ? meter : 0} />
          <Text style={[styles.status, { color: colors.danger }]}>
            {phase === "processing" ? "Сохранение…" : phase === "paused" ? "Пауза" : "● Запись"}
          </Text>
          <Text style={[styles.live, { color: colors.accent }]}>{liveStatus}</Text>
          {phase === "processing" ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.row}>
              {phase === "recording" ? (
                <Pressable style={[styles.btn, { backgroundColor: colors.accentSoft }]} onPress={pause}>
                  <Text style={{ color: colors.accent }}>⏸ Пауза</Text>
                </Pressable>
              ) : (
                <Pressable style={[styles.btn, { backgroundColor: colors.accent }]} onPress={resume}>
                  <Text style={{ color: "#fff" }}>▶ Продолжить</Text>
                </Pressable>
              )}
              <Pressable style={[styles.btn, { backgroundColor: colors.danger }]} onPress={confirmEnd}>
                <Text style={{ color: "#fff" }}>■ Закончить</Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      <Text style={[styles.h2, { color: colors.accent }]}>Живой разбор</Text>
      <AnalysisBlocks data={analysis} />

      <Text style={[styles.h2, { color: colors.accent }]}>Расшифровка</Text>
      <Text style={[styles.transcript, { color: colors.muted }]}>{transcript || "…"}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, paddingBottom: 40 },
  bigBtn: { paddingVertical: 28, borderRadius: 16, alignItems: "center", marginTop: 40 },
  bigBtnText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  status: { textAlign: "center", fontWeight: "700", fontSize: 16 },
  live: { textAlign: "center", fontSize: 13, marginVertical: 8 },
  row: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 16 },
  btn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  h2: { marginTop: 20, marginBottom: 8, fontWeight: "700", fontSize: 12, textTransform: "uppercase" },
  transcript: { fontSize: 14, lineHeight: 20 },
});
