import { Tabs } from "expo-router";
import { colors } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.accent },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Приём", tabBarLabel: "Приём" }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "История", tabBarLabel: "История" }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Настройки", tabBarLabel: "Настройки" }}
      />
    </Tabs>
  );
}
