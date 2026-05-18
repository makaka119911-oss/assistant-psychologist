/**
 * Напоминание через 30 минут после сессии.
 */
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/** Запланировать напоминание через 30 мин */
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
