// app/src/api.ts
import { API_BASE } from "./config";
import type { PlanDetail, PlanListItem, CreatePlanResponse } from "./types";

/**
 * fetchJSON: adds timeout + better error messages
 */
async function fetchJSON<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 60000
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const contentType = res.headers.get("content-type") || "";
    const isJSON = contentType.includes("application/json");

    // Read body once (success or error) for clearer debugging
    if (!res.ok) {
      let body = "";
      try {
        body = isJSON ? JSON.stringify(await res.json()) : await res.text();
      } catch {
        body = "";
      }
      throw new Error(
        `${options.method ?? "GET"} ${url} -> ${res.status}${body ? ` | ${body}` : ""}`,
      );
    }

    // Successful response
    if (isJSON) return (await res.json()) as T;
    return (await res.text()) as unknown as T;
  } catch (e: any) {
    // Timeout / abort
    if (e?.name === "AbortError") {
      throw new Error(
        `Request timeout (${timeoutMs}ms): ${options.method ?? "GET"} ${url}`,
      );
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export async function listPlans(): Promise<PlanListItem[]> {
  const data = await fetchJSON<{ plans?: PlanListItem[] }>(`${API_BASE}/plans`);
  return data.plans ?? [];
}

export async function getPlan(id: string): Promise<PlanDetail> {
  return await fetchJSON<PlanDetail>(`${API_BASE}/plans/${id}`);
}

export async function createPlan(payload: {
  title: string;
  days: number;
  daily_minutes: number;
}): Promise<CreatePlanResponse> {
  return await fetchJSON<CreatePlanResponse>(`${API_BASE}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function patchDayDone(
  planId: string,
  dayNumber: number,
  isDone: boolean,
) {
  return await fetchJSON(`${API_BASE}/plans/${planId}/days/${dayNumber}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_done: isDone }),
  });
}

export async function patchDayContent(
  planId: string,
  dayNumber: number,
  payload: { focus?: string; steps?: any[] },
) {
  return await fetchJSON(`${API_BASE}/plans/${planId}/days/${dayNumber}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deletePlan(planId: string) {
  await fetchJSON(`${API_BASE}/plans/${planId}`, { method: "DELETE" });
  return true;
}
