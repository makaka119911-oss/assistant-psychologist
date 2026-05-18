import { useCallback, useState } from "react";
import { View, FlatList, Text, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { listSessions } from "@/db/database";
import type { Session } from "@/types/session";
import { SessionCard } from "@/components/SessionCard";
import { loadSettings } from "@/services/settings";
import { t } from "@/i18n/translations";
import { colors, spacing } from "@/constants/theme";

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [locale, setLocale] = useState<"ru" | "en">("ru");

  const load = useCallback(async () => {
    const s = await loadSettings();
    setLocale(s.locale);
    setSessions(await listSessions(true));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>{t(locale, "historyEmpty")}</Text>
        }
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            locale={locale}
            onPress={() =>
              router.push({
                pathname: "/session/[id]",
                params: { id: String(item.id) },
              })
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.lg },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40, fontSize: 15 },
});
