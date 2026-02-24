import AsyncStorage from "@react-native-async-storage/async-storage";

export type PlanNotifState = {
  currentDayIndex: number; // 0-based
  reminderIds: string[];   // 9/13/19
  blessId?: string;        // 21:30
};

const keyFor = (planId: string) => `plan_notif_state:${planId}`;

export async function loadPlanNotifState(planId: string): Promise<PlanNotifState | null> {
  const raw = await AsyncStorage.getItem(keyFor(planId));
  return raw ? (JSON.parse(raw) as PlanNotifState) : null;
}

export async function savePlanNotifState(planId: string, state: PlanNotifState) {
  await AsyncStorage.setItem(keyFor(planId), JSON.stringify(state));
}

export async function clearPlanNotifState(planId: string) {
  await AsyncStorage.removeItem(keyFor(planId));
}
