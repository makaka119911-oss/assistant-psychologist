import {
  Pressable,
  Text,
  StyleSheet,
  type PressableProps,
  ActivityIndicator,
} from "react-native";
import { colors, spacing } from "@/constants/theme";

type Props = PressableProps & {
  title: string;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
};

export function PrimaryButton({
  title,
  variant = "primary",
  loading,
  disabled,
  style,
  ...rest
}: Props) {
  const bg =
    variant === "danger"
      ? colors.danger
      : variant === "secondary"
        ? colors.accentSoft
        : colors.accent;
  const color = variant === "secondary" ? colors.accent : "#fff";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed ? 0.9 : 1 },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[styles.text, { color }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    alignItems: "center",
    minWidth: 160,
  },
  text: {
    fontSize: 17,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
