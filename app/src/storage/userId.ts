import * as SecureStore from "expo-secure-store";

const KEY = "slice_user_id";

export async function getOrCreateUserId(API_BASE: string): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY);
  if (existing) return existing;

  const res = await fetch(`${API_BASE}/auth/anonymous`, { method: "POST" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`auth/anonymous failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  const userId = data.user_id as string;

  await SecureStore.setItemAsync(KEY, userId);
  return userId;
}

export async function clearUserId() {
  await SecureStore.deleteItemAsync(KEY);
}