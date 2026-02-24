import React, { useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  View,
  Modal,
  Pressable,
  Keyboard,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createPlan } from "../api";
import type { SplitterMeta, PlanDetail } from "../types";
import type { RootStackParamList } from "../../App";
import { Screen } from "../ui/Screen";
import { CollageCard } from "../ui/CollageCard";
import { BrutalButton } from "../ui/BrutalButton";
import { Marks } from "../ui/Marks";
import { useSliceHeader } from "../ui/useSliceHeader";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import LoadingOverlay from "../ui/LoadingOverlay";
import {
  ensureNotifPermission,
  scheduleDailyReminders,
  scheduleDailyBless,
  DEFAULT_REMINDER_TIMES,
} from "../notifications";
import { savePlanNotifState } from "../planNotifStorage";
import { useRefresh } from "../RefreshContext";

type Props = NativeStackScreenProps<RootStackParamList, "Create">;

export default function CreatePlanScreen({ navigation }: Props) {
  const [title, setTitle] = useState("Build portfolio");
  const [days, setDays] = useState("7");
  const [minutes, setMinutes] = useState("30");
  const [loading, setLoading] = useState(false);
  useSliceHeader(navigation, { left: "none", right: "plans" });

  const [meta, setMeta] = useState<SplitterMeta | null>(null);
  const [createdPlan, setCreatedPlan] = useState<PlanDetail | null>(null);
  const [show, setShow] = useState(false);
  const { bump } = useRefresh();

  const onCreate = async () => {
    const d = Number(days);
    const m = Number(minutes);

    if (!title.trim() || !Number.isFinite(d) || !Number.isFinite(m)) {
      Alert.alert("Invalid input", "Please fill title/days/minutes correctly.");
      return;
    }

    setLoading(true);
    try {
      const res = await createPlan({
        title: title.trim(),
        days: d,
        daily_minutes: m,
      });

      // ✅ (A) Schedule Day 1 notifications RIGHT AFTER create success
      const ok = await ensureNotifPermission();
      if (ok) {
        const dayIndex = 0;
        const dayLabel = `Day ${dayIndex + 1}`;

        // 你目前 PlanDay 可能沒有 title，MVP 先用 plan.title 也很合理
        const taskLine =
          (res.plan as any)?.items?.[dayIndex]?.steps?.[0]?.title ??
          `Work on: ${res.plan.title}`;

        const reminderIds = await scheduleDailyReminders({
          title: `${dayLabel} — time to slice`,
          body: taskLine,
          times: [...DEFAULT_REMINDER_TIMES],
        });

        const blessId = await scheduleDailyBless({
          title: `${dayLabel} — it’s okay`,
          body: "Didn’t finish today? It’s fine. Tomorrow we continue — same day until it’s done.",
        });

        await savePlanNotifState(res.plan.id, {
          currentDayIndex: dayIndex,
          reminderIds,
          blessId,
        });
      }

      // ✅ show meta modal
      setMeta(res.meta);
      setCreatedPlan(res.plan);
      setShow(true);
      bump();
    } catch (e: any) {
      Alert.alert("Create failed", e.message ?? "unknown error");
    } finally {
      Keyboard.dismiss();
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={16}
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="relative">
          <Marks />
          <Text className="text-charcoal text-[28px] font-bold tracking-[2px]">
            NEW PLAN
          </Text>
          <Text className="text-charcoal opacity-70 tracking-[1px] mb-3">
            Cut the big thing into 7 days.
          </Text>
        </View>

        <View className="gap-3">
          <CollageCard tone="mustard">
            <Text className="text-charcoal font-bold tracking-[2px] mb-2">
              TITLE
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              className="border-2 border-charcoal rounded-[10px] bg-paper px-3 py-3 text-charcoal"
              placeholder="e.g. Build portfolio"
              placeholderTextColor="#2C2C2C"
            />
          </CollageCard>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <CollageCard tone="teal">
                <Text className="text-charcoal font-bold tracking-[2px] mb-2">
                  DAYS
                </Text>
                <TextInput
                  value={days}
                  onChangeText={setDays}
                  keyboardType="number-pad"
                  className="border-2 border-charcoal rounded-[10px] bg-paper px-3 py-3 text-charcoal"
                  placeholder="7"
                  placeholderTextColor="#2C2C2C"
                />
              </CollageCard>
            </View>

            <View className="flex-1">
              <CollageCard tone="rust">
                <Text className="text-charcoal font-bold tracking-[2px] mb-2">
                  MIN/DAY
                </Text>
                <TextInput
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="number-pad"
                  className="border-2 border-charcoal rounded-[10px] bg-paper px-3 py-3 text-charcoal"
                  placeholder="30"
                  placeholderTextColor="#2C2C2C"
                />
              </CollageCard>
            </View>
          </View>

          <BrutalButton
            label={loading ? "Creating..." : "Generate"}
            onPress={onCreate}
            tone="charcoal"
            disabled={loading}
          />

          <Text className="text-charcoal opacity-60 text-[12px] tracking-[1px]">
            Tip: keep it small. Momentum beats motivation.
          </Text>

          <Modal visible={show} transparent animationType="fade">
            <View className="flex-1 items-center justify-center bg-black/40 px-5">
              <View className="w-full border-2 border-charcoal rounded-[16px] bg-paper p-4">
                <Text className="text-charcoal text-[12px] tracking-[3px] font-bold">
                  SPLITTER QUOTE
                </Text>
                <Text className="text-charcoal text-[18px] font-bold mt-2">
                  “{meta?.splitter_quote}”
                </Text>

                {meta?.changed ? (
                  <View className="mt-4">
                    <Text className="text-charcoal text-[12px] tracking-[3px] font-bold opacity-70">
                      DE-SCOPE MODE
                    </Text>
                    <Text className="text-charcoal mt-2">
                      {meta?.why_this_adjustment}
                    </Text>
                    <Text className="text-charcoal mt-2 opacity-70">
                      Final goal:{" "}
                      <Text className="font-bold">{meta?.final_goal}</Text>
                    </Text>
                  </View>
                ) : (
                  <View className="mt-4">
                    <Text className="text-charcoal opacity-70">
                      Goal locked:{" "}
                      <Text className="font-bold">{meta?.final_goal}</Text>
                    </Text>
                  </View>
                )}

                <View className="mt-5 flex-row justify-between">
                  <Pressable
                    onPress={() => {
                      setShow(false);
                      navigation.navigate("Plans"); // 或 Today
                    }}
                  >
                    <View className="border-2 border-charcoal rounded-[999px] px-4 py-2 bg-paper">
                      <Text className="text-charcoal font-bold tracking-[2px]">
                        LATER
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      const id = createdPlan?.id;
                      setShow(false);

                      if (id) navigation.navigate("Detail", { id });
                      else navigation.navigate("Today");
                    }}
                  >
                    <View className="border-2 border-charcoal rounded-[999px] px-4 py-2 bg-mustard">
                      <Text className="text-charcoal font-bold tracking-[2px]">
                        START →
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </View>
        <View style={{ height: 40 }} />
      </KeyboardAwareScrollView>
      <LoadingOverlay visible={loading} label="CUTTING YOUR PLAN…" />
    </Screen>
  );
}
