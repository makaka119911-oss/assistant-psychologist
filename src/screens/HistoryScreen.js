import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { listSessions } from "../services/StorageService";
import { useTheme } from "../utils/ThemeContext";

/** Список всех завершённых сессий */
export default function HistoryScreen({ navigation }) {
  const { colors } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setSessions(await listSessions());
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.muted }]}>Сессий пока нет</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate("Analysis", { sessionId: item.id })}
          >
            <View style={styles.row}>
              <Text style={[styles.name, { color: colors.text }]}>
                {item.clientName || "Без имени"}
              </Text>
              <Text style={[styles.dur, { color: colors.accent }]}>
                {item.durationMinutes} мин
              </Text>
            </View>
            <Text style={[styles.date, { color: colors.muted }]}>
              {new Date(item.date).toLocaleString("ru-RU")}
            </Text>
            {item.pendingAnalysis ? (
              <Text style={[styles.pending, { color: colors.danger }]}>⏳ Ждёт анализа</Text>
            ) : null}
            {item.transcript ? (
              <Text style={[styles.preview, { color: colors.muted }]} numberOfLines={2}>
                {item.transcript}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  empty: { textAlign: "center", marginTop: 48, fontSize: 15 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 17, fontWeight: "600", flex: 1 },
  dur: { fontSize: 13, fontWeight: "600" },
  date: { fontSize: 13, marginTop: 4 },
  pending: { fontSize: 12, marginTop: 6, fontWeight: "600" },
  preview: { fontSize: 13, marginTop: 8 },
});
