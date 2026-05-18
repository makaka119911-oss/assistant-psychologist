import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Pressable,
} from "react-native";
import { PrimaryButton } from "@/components/PrimaryButton";
import {
  loadSettings,
  saveSettings,
  type AppSettings,
} from "@/services/settings";
import { checkServerHealth } from "@/services/deepseek";
import { t, type Locale } from "@/i18n/translations";
import { colors, spacing } from "@/constants/theme";

export default function SettingsScreen() {
  const [s, setS] = useState<AppSettings | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [health, setHealth] = useState("—");

  useEffect(() => {
    loadSettings().then(setS);
  }, []);

  if (!s) return null;

  const loc = s.locale;

  const patch = (p: Partial<AppSettings>) => setS((prev) => (prev ? { ...prev, ...p } : prev));

  const save = async () => {
    await saveSettings(s);
    Alert.alert(t(loc, "saved"), "");
  };

  const test = async () => {
    await saveSettings(s);
    const h = await checkServerHealth();
    if (h.ok && (h.deepseek || s.deepseekApiKey)) {
      setHealth("✓ OK");
    } else if (h.ok) {
      setHealth("Сервер OK, добавьте ключ в настройках или .env");
    } else {
      setHealth("✗ Нет связи с сервером");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>{t(loc, "apiKey")}</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex]}
          value={s.deepseekApiKey}
          onChangeText={(v) => patch({ deepseekApiKey: v })}
          placeholder="sk-..."
          secureTextEntry={!showKey}
          autoCapitalize="none"
        />
        <Pressable style={styles.eye} onPress={() => setShowKey((x) => !x)}>
          <Text>{showKey ? "🙈" : "👁"}</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>{t(loc, "apiKeyHint")}</Text>

      <Text style={styles.label}>{t(loc, "serverUrl")}</Text>
      <TextInput
        style={styles.input}
        value={s.apiBaseUrl}
        onChangeText={(v) => patch({ apiBaseUrl: v })}
        autoCapitalize="none"
      />

      <Text style={styles.label}>{t(loc, "model")}</Text>
      <View style={styles.chips}>
        {(["deepseek-chat", "deepseek-coder"] as const).map((m) => (
          <Pressable
            key={m}
            style={[styles.chip, s.model === m && styles.chipOn]}
            onPress={() => patch({ model: m })}
          >
            <Text style={[styles.chipText, s.model === m && styles.chipTextOn]}>{m}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>
        {t(loc, "temperature")}: {s.temperature.toFixed(1)}
      </Text>
      <View style={styles.tempRow}>
        {[0.3, 0.45, 0.6, 0.75].map((v) => (
          <Pressable
            key={v}
            style={[styles.chip, Math.abs(s.temperature - v) < 0.05 && styles.chipOn]}
            onPress={() => patch({ temperature: v })}
          >
            <Text
              style={[
                styles.chipText,
                Math.abs(s.temperature - v) < 0.05 && styles.chipTextOn,
              ]}
            >
              {v}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t(loc, "autoAnalyzeLive")}</Text>
        <Switch
          value={s.autoAnalyzeLive}
          onValueChange={(v) => patch({ autoAnalyzeLive: v })}
          trackColor={{ true: colors.accent }}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t(loc, "autoAnalyzeAfter")}</Text>
        <Switch
          value={s.autoAnalyzeAfter}
          onValueChange={(v) => patch({ autoAnalyzeAfter: v })}
          trackColor={{ true: colors.accent }}
        />
      </View>

      <Text style={styles.label}>{t(loc, "language")}</Text>
      <View style={styles.chips}>
        {(["ru", "en"] as Locale[]).map((l) => (
          <Pressable
            key={l}
            style={[styles.chip, s.locale === l && styles.chipOn]}
            onPress={() => patch({ locale: l })}
          >
            <Text style={[styles.chipText, s.locale === l && styles.chipTextOn]}>
              {l === "ru" ? "Русский" : "English"}
            </Text>
          </Pressable>
        ))}
      </View>

      <PrimaryButton title={t(loc, "testConnection")} variant="secondary" onPress={test} />
      <Text style={styles.status}>{health}</Text>
      <PrimaryButton title={t(loc, "save")} onPress={save} style={{ marginTop: spacing.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 48 },
  label: { fontWeight: "600", color: colors.text, marginTop: spacing.md, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.card,
  },
  flex: { flex: 1 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  eye: { padding: 12 },
  hint: { fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 13, color: colors.text },
  chipTextOn: { color: "#fff" },
  tempRow: { flexDirection: "row", gap: 8, marginBottom: spacing.sm },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingVertical: 8,
  },
  switchLabel: { flex: 1, fontSize: 15, color: colors.text, paddingRight: 12 },
  status: { textAlign: "center", marginTop: spacing.sm, color: colors.accent },
});
