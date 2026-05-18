import { Pressable, Text, View, StyleSheet } from "react-native";
import type { Session } from "@/types/session";
import type { Locale } from "@/i18n/translations";
import { t } from "@/i18n/translations";
import { colors, spacing } from "@/constants/theme";

export function SessionCard({
  session,
  locale = "ru",
  onPress,
}: {
  session: Session;
  locale?: Locale;
  onPress: () => void;
}) {
  const date = new Date(session.date).toLocaleString(locale === "en" ? "en-US" : "ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const name = session.clientName || t(locale, "noName");
  const dur = session.durationMinutes || 0;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.duration}>
          {dur} {t(locale, "duration")}
        </Text>
      </View>
      <Text style={styles.date}>{date}</Text>
      {session.transcript ? (
        <Text style={styles.preview} numberOfLines={2}>
          {session.transcript}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  duration: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "600",
  },
  date: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  preview: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 8,
  },
});
