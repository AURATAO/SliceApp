import { API_BASE } from "./config";
import type { PlanDetail, PlanListItem } from "./types";

export async function listPlans(): Promise<PlanListItem[]> {
  const res = await fetch(`${API_BASE}/plans`);
  if (!res.ok) throw new Error(`listPlans failed: ${res.status}`);
  const data = await res.json();
  return data.plans ?? [];
}

export async function getPlan(id: string): Promise<PlanDetail> {
  const res = await fetch(`${API_BASE}/plans/${id}`);
  if (!res.ok) throw new Error(`getPlan failed: ${res.status}`);
  return await res.json();
}

export async function createPlan(payload: {
  title: string;
  days: number;
  daily_minutes: number;
}): Promise<{ plan_id: string }> {
  const res = await fetch(`${API_BASE}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createPlan failed: ${res.status}`);
  const data = await res.json();
  return { plan_id: data.plan_id };
}

export async function patchDayDone(planId: string, dayNumber: number, isDone: boolean) {
  const res = await fetch(`${API_BASE}/plans/${planId}/days/${dayNumber}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_done: isDone }),
  });
  if (!res.ok) throw new Error(`patchDayDone failed: ${res.status}`);
  return await res.json();
}

