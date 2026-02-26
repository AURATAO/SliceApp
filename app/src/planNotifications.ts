import { getPlan } from "./api";
import {
  ensureNotifPermission,
  scheduleDailyReminders,
  scheduleDailyBless,
  cancelNotifIds,
  DEFAULT_REMINDER_TIMES,
} from "./notifications";
import {
  loadPlanNotifState,
  savePlanNotifState,
  clearPlanNotifState,
} from "./planNotifStorage";
import { getSelectedPlanId, setSelectedPlanId } from "./storage/selectedPlan";

// 取消某個 plan 已排的通知（讀 planNotifState 裡存的 ids）
export async function disablePlanNotifications(planId: string) {
  const state = await loadPlanNotifState(planId);
  if (!state) return;

  const ids = [...state.reminderIds, ...(state.blessId ? [state.blessId] : [])];
  await cancelNotifIds(ids);
  await clearPlanNotifState(planId);
}

// 啟用某個 plan 的通知（MVP：先用 Day 1）
export async function enablePlanNotifications(planId: string) {
  const ok = await ensureNotifPermission();
  if (!ok) return;

  // ✅ 防重複：如果這個 plan 已經有排過，先取消掉再重新排
  await disablePlanNotifications(planId);

  const plan = await getPlan(planId);

  const dayIndex = 0;
  const dayLabel = `Day ${dayIndex + 1}`;

  const taskLine =
    (plan.items as any)?.[dayIndex]?.title ??
    (plan.items as any)?.[dayIndex]?.content ??
    `Work on: ${plan.title}`;

  const reminderIds = await scheduleDailyReminders({
    title: `${dayLabel} — time to slice`,
    body: taskLine,
    times: [...DEFAULT_REMINDER_TIMES], // 9/13/19
  });

  const blessId = await scheduleDailyBless({
    title: `${dayLabel} — it’s okay`,
    body: "Didn’t finish today? It’s fine. Tomorrow we continue — same day until it’s done.",
  });

  await savePlanNotifState(planId, {
    currentDayIndex: dayIndex,
    reminderIds,
    blessId,
  });
}

// ✅ 你要的：選為 Today → cancel 舊 plan → setSelectedPlanId → enable 新 plan
export async function onSelectAsToday(newPlanId: string) {
  const prev = await getSelectedPlanId();

  if (prev && prev !== newPlanId) {
    await disablePlanNotifications(prev);
  }

  await setSelectedPlanId(newPlanId);
  await enablePlanNotifications(newPlanId);
}