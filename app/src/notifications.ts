import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const DEFAULT_REMINDER_TIMES = [
  { hour: 9, minute: 0 },
  { hour: 13, minute: 0 },
  { hour: 19, minute: 0 },
] as const;

export const DEFAULT_BLESS_TIME = { hour: 21, minute: 30 } as const;

// Newer expo-notifications types require shouldShowBanner/shouldShowList.
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotifPermission() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== "granted") return false;
  }

  // Android channel (safe to call repeatedly)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return true;
}

export type ReminderTime = { hour: number; minute: number };

function calendarTrigger(t: ReminderTime): Notifications.NotificationTriggerInput {
  return {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    hour: t.hour,
    minute: t.minute,
    repeats: true,
  };
}

export async function scheduleDailyReminders(params: {
  title: string;
  body: string;
  times: ReminderTime[];
}) {
  const ids: string[] = [];

  for (const t of params.times) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        sound: true,
      },
      trigger: calendarTrigger(t),
    });
    ids.push(id);
  }

  return ids;
}

export async function scheduleDailyBless(params: {
  title: string;
  body: string;
  hour?: number;
  minute?: number;
}) {
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: params.title, body: params.body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: params.hour ?? DEFAULT_BLESS_TIME.hour,
      minute: params.minute ?? DEFAULT_BLESS_TIME.minute,
      repeats: true,
    },
  });

  return id;
}

export async function cancelNotifIds(ids: string[]) {
  await Promise.all(
    ids.filter(Boolean).map((id) => Notifications.cancelScheduledNotificationAsync(id))
  );
}
