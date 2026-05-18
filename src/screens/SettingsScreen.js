import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { loadSettings, saveSettings } from "../services/StorageService";
import * as DeepSeek from "../services/DeepSeekService";
import { useTheme } from "../utils/ThemeContext";
import { DEFAULT_SETTINGS, DEFAULT_API_URL } from "../utils/constants";

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const [s, setS] = useState({ ...DEFAULT_SETTINGS });
  const [showKey, setShowKey] = useState(false);
  const [health, setHealth] = useState("");

  useEffect(() => {
    loadSettings().then(setS);
  }, []);

  const patch = (p) => setS((prev) => ({ ...prev, ...p }));

  const onSave = async () => {
    await saveSettings(s);
    Alert.alert("Сохранено", "Настройки обновлены");
  };

  const testServer = async () => {
    await saveSettings(s);
    try {
      const online = await DeepSeek.isOnline();
      if (!online) {
        setHealth("Нет интернета");
        return;
      }
      const res = await fetch(`${s.apiBaseUrl.replace(/\/$/, "")}/api/health`);
      const data = await res.json();
      if (!data.ok) {
        setHealth("Ошибка сервера");
        return;
      }
      if (data.cerebras || data.deepseek || s.deepseekApiKey) {
        setHealth(`✓ AI готов (${data.model || "llama3.1-8b"})`);
      } else {
        setHealth("На сервере нет ключа — добавьте свой ниже");
      }
    } catch {
      setHealth("Не удалось подключиться");
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.pad}>
      <Text style={[styles.hint, { color: colors.muted }]}>
        Данные клиентов только на телефоне. В интернет уходит текст расшифровки для разбора (Cerebras через
        ваш сервер).
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>Сервер анализа</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        value={s.apiBaseUrl}
        onChangeText={(v) => patch({ apiBaseUrl: v })}
        autoCapitalize="none"
        placeholder={DEFAULT_API_URL}
      />
      <Pressable style={[styles.btn, { backgroundColor: colors.accentSoft }]} onPress={testServer}>
        <Text style={{ color: colors.accent, textAlign: "center", fontWeight: "600" }}>Проверить связь</Text>
      </Pressable>
      {health ? <Text style={[styles.health, { color: colors.accent }]}>{health}</Text> : null}

      <Text style={[styles.label, { color: colors.text }]}>Свой API-ключ Cerebras (необязательно)</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={s.deepseekApiKey}
          onChangeText={(v) => patch({ deepseekApiKey: v })}
          secureTextEntry={!showKey}
          placeholder="csk-… только если свой ключ"
          autoCapitalize="none"
        />
        <Pressable onPress={() => setShowKey((x) => !x)} style={styles.eye}>
          <Text>{showKey ? "🙈" : "👁"}</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => Linking.openURL("https://cloud.cerebras.ai")}>
        <Text style={[styles.link, { color: colors.accent }]}>Получить ключ на cloud.cerebras.ai</Text>
      </Pressable>

      <View style={styles.switchRow}>
        <Text style={{ color: colors.text, flex: 1 }}>Живой разбор во время приёма</Text>
        <Switch value={s.autoAnalyzeLive} onValueChange={(v) => patch({ autoAnalyzeLive: v })} />
      </View>
      <View style={styles.switchRow}>
        <Text style={{ color: colors.text, flex: 1 }}>Анализ после окончания</Text>
        <Switch value={s.autoAnalyzeAfter} onValueChange={(v) => patch({ autoAnalyzeAfter: v })} />
      </View>
      <View style={styles.switchRow}>
        <Text style={{ color: colors.text, flex: 1 }}>Тёмная тема</Text>
        <Switch value={isDark} onValueChange={toggleTheme} />
      </View>

      <Pressable style={[styles.btn, { backgroundColor: colors.accent, marginTop: 24 }]} onPress={onSave}>
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>Сохранить</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, paddingBottom: 40 },
  hint: { lineHeight: 20, marginBottom: 16, fontSize: 14 },
  label: { fontWeight: "600", marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 6, padding: 12, fontSize: 15 },
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  eye: { padding: 10 },
  btn: { padding: 12, borderRadius: 6, marginTop: 8 },
  health: { textAlign: "center", marginTop: 8, fontWeight: "600" },
  link: { marginTop: 8, fontSize: 13 },
  switchRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
});
