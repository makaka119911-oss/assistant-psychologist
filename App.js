import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "./src/utils/ThemeContext";
import RecordScreen from "./src/screens/RecordScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import AnalysisScreen from "./src/screens/AnalysisScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.accent },
        headerTintColor: "#fff",
        tabBarActiveTintColor: colors.accent,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="RecordTab"
        component={RecordScreen}
        options={{ title: "Приём", tabBarLabel: "Приём", headerTitle: "Ассистент психолога" }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{ title: "История", tabBarLabel: "История" }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: "Настройки", tabBarLabel: "Настройки" }}
      />
    </Tab.Navigator>
  );
}

function Nav() {
  const { colors, isDark } = useTheme();
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bg,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
  <>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator>
          <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="Analysis"
            component={AnalysisScreen}
            options={{ title: "Сессия", headerStyle: { backgroundColor: colors.accent }, headerTintColor: "#fff" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Nav />
    </ThemeProvider>
  );
}
