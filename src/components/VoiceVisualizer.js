import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../utils/ThemeContext";

const BARS = 22;

/** Полоски громкости микрофона */
export default function VoiceVisualizer({ level = 0 }) {
  const { colors } = useTheme();
  const active = Math.round(level * BARS);

  return (
    <View style={styles.wrap}>
      {Array.from({ length: BARS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              height: 10 + (i % 4) * 5,
              backgroundColor: i < active ? colors.danger : colors.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
    height: 44,
    marginVertical: 16,
  },
  bar: { width: 7, borderRadius: 4 },
});
