import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { createSession } from "@/db/database";
import { colors, spacing } from "@/constants/theme";
import { loadSettings } from "@/services/settings";
import { t } from "@/i18n/translations";

export default function HomeScreen() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [locale, setLocale] = useState<"ru" | "en">("ru");

  const startSession = async () => {
    const settings = await loadSettings();
    setLocale(settings.locale);
    const session = await createSession(clientName.trim());
    router.push({
      pathname: "/record",
      params: {
        id: String(session.id),
        clientName: clientName.trim(),
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.hero}>
        {locale === "en"
          ? "Live transcript · anamnesis · analysis during the session"
          : "Расшифровка и разбор в реальном времени во время приёма"}
      </Text>
      <Text style={styles.label}>{t(locale, "clientName")}</Text>
      <TextInput
        style={styles.input}
        placeholder={t(locale, "clientNameOptional")}
        placeholderTextColor={colors.muted}
        value={clientName}
        onChangeText={setClientName}
      />
      <Pressable style={styles.bigRed} onPress={startSession}>
        <Text style={styles.bigRedText}>{t(locale, "startSession")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg },
  hero: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: spacing.lg },
  label: { fontWeight: "600", marginBottom: 6, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: colors.card,
    marginBottom: spacing.lg,
  },
  bigRed: {
    backgroundColor: colors.danger,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
  },
  bigRedText: { color: "#fff", fontSize: 20, fontWeight: "700" },
});
