/**
 * Уведомления: напоминание после сессии + foreground при записи (Android).
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const RECORDING_NOTIFICATION_ID = "psych-active-recording";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("recording", {
      name: "Запись приёма",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/** Пока идёт приём — не даём системе убить запись */
export async function showRecordingNotification(callMode) {
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: RECORDING_NOTIFICATION_ID,
      content: {
        title: "Идёт приём",
        body: callMode
          ? "Режим звонка: держите громкую связь включённой"
          : "Запись и расшифровка активны",
        sticky: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === "android" ? { channelId: "recording" } : {}),
      },
      trigger: null,
    });
  } catch (e) {
    console.warn("[notify recording]", e);
  }
}

export async function hideRecordingNotification() {
  try {
    await Notifications.dismissNotificationAsync(RECORDING_NOTIFICATION_ID);
  } catch {
    /* ignore */
  }
}

export async function scheduleSessionReminder(sessionId) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Ассистент психолога",
        body: "Напиши заметки, пока свежо ✍️",
        data: { sessionId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 30 * 60,
      },
    });
  } catch (e) {
    console.warn("[notify]", e);
  }
}
