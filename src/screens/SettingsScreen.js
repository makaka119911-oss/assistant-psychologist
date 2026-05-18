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
} from "react-native";
import { loadSettings, saveSettings } from "../services/StorageService";
import * as DeepSeek from "../services/DeepSeekService";
import { useTheme } from "../utils/ThemeContext";
import { DEFAULT_SETTINGS } from "../utils/constants";

/** Настройки: ключ, модель, тема, автоанализ */
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
      const res = await fetch(`${s.apiBaseUrl}/api/health`);
      const data = await res.json();
      setHealth(data.ok ? (data.deepseek || s.deepseekApiKey ? "✓ Всё готово" : "Нужен API-ключ") : "Ошибка сервера");
    } catch {
      setHealth("Не удалось подключиться к серверу");
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={styles.pad}>
      <Text style={[styles.hint, { color: colors.muted }]}>
        Данные клиентов хранятся только на телефоне. В сеть уходит только текст для DeepSeek.
      </Text>

      <Text style={[styles.label, { color: colors.text }]}>API-ключ DeepSeek</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={s.deepseekApiKey}
          onChangeText={(v) => patch({ deepseekApiKey: v })}
          secureTextEntry={!showKey}
          placeholder="sk-…"
          autoCapitalize="none"
        />
        <Pressable onPress={() => setShowKey((x) => !x)} style={styles.eye}>
          <Text>{showKey ? "🙈" : "👁"}</Text>
        </Pressable>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Адрес сервера (ПК в Wi‑Fi)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        value={s.apiBaseUrl}
        onChangeText={(v) => patch({ apiBaseUrl: v })}
        autoCapitalize="none"
      />
      <Pressable style={[styles.btn, { backgroundColor: colors.accentSoft }]} onPress={testServer}>
        <Text style={{ color: colors.accent, textAlign: "center" }}>Проверить связь</Text>
      </Pressable>
      {health ? <Text style={[styles.health, { color: colors.accent }]}>{health}</Text> : null}

      <Text style={[styles.label, { color: colors.text }]}>Модель</Text>
      <View style={styles.chips}>
        {["deepseek-chat", "deepseek-coder"].map((m) => (
          <Pressable
            key={m}
            style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.card }, s.model === m && { backgroundColor: colors.accent }]}
            onPress={() => patch({ model: m })}
          >
            <Text style={{ color: s.model === m ? "#fff" : colors.text, fontSize: 12 }}>{m}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Температура: {s.temperature}</Text>
      <View style={styles.chips}>
        {[0.3, 0.45, 0.6, 0.75].map((t) => (
          <Pressable
            key={t}
            style={[styles.chip, { borderColor: colors.border }, s.temperature === t && { backgroundColor: colors.accent }]}
            onPress={() => patch({ temperature: t })}
          >
            <Text style={{ color: s.temperature === t ? "#fff" : colors.text }}>{t}</Text>
          </Pressable>
        ))}
      </View>

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
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>Сохранить</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 20, paddingBottom: 40 },
  hint: { lineHeight: 20, marginBottom: 16 },
  label: { fontWeight: "600", marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  eye: { padding: 10 },
  btn: { padding: 14, borderRadius: 12, marginTop: 8 },
  health: { textAlign: "center", marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  switchRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
});
