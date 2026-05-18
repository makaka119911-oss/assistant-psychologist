import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useTheme } from "../utils/ThemeContext";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Раскрывающийся блок разбора */
export default function SectionAccordion({ title, children, defaultOpen = false }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable style={styles.head} onPress={toggle}>
        <Text style={[styles.chevron, { color: colors.accent }]}>{open ? "▼" : "▶"}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

export function Field({ label, value }) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value?.trim() || "—"}</Text>
    </View>
  );
}

export function ListField({ label, items }) {
  const { colors } = useTheme();
  const list = items?.filter(Boolean) || [];
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      {list.length ? (
        list.map((x, i) => (
          <Text key={i} style={[styles.bullet, { color: colors.text }]}>
            • {x}
          </Text>
        ))
      ) : (
        <Text style={{ color: colors.muted }}>—</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  head: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  chevron: { width: 16, fontSize: 12 },
  title: { flex: 1, fontSize: 16, fontWeight: "600" },
  body: { paddingHorizontal: 14, paddingBottom: 14 },
  field: { marginBottom: 10 },
  label: { fontSize: 12, fontWeight: "600" },
  value: { fontSize: 15, marginTop: 2, lineHeight: 22 },
  bullet: { fontSize: 14, marginTop: 4, lineHeight: 20 },
});
