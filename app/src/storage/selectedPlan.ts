import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "slice:selectedPlanId";

export async function getSelectedPlanId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function setSelectedPlanId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, id);
  } catch {}
}

export async function clearSelectedPlanId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
