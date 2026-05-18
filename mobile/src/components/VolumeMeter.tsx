import { View, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

const BARS = 24;

export function VolumeMeter({ level }: { level: number }) {
  const active = Math.round(level * BARS);
  return (
    <View style={styles.wrap}>
      {Array.from({ length: BARS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            i < active ? styles.barOn : styles.barOff,
            { height: 12 + (i % 5) * 6 },
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
    height: 48,
    marginVertical: 16,
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  barOn: {
    backgroundColor: colors.danger,
  },
  barOff: {
    backgroundColor: colors.border,
  },
});
