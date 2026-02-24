import React, { useCallback, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
  FlatList,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { getPlan, patchDayDone } from "../api";
import type { PlanDay, PlanDetail } from "../types";
import type { RootStackParamList } from "../../App";
import { Screen } from "../ui/Screen";
import { CollageCard } from "../ui/CollageCard";
import { useSliceHeader } from "../ui/useSliceHeader";
import { EditablePlanDayCard } from "../ui/EditablePlanDayCard";
import {
  cancelNotifIds,
  scheduleDailyReminders,
  scheduleDailyBless,
  DEFAULT_REMINDER_TIMES,
  ensureNotifPermission,
} from "../notifications";
import {
  loadPlanNotifState,
  savePlanNotifState,
  clearPlanNotifState,
} from "../planNotifStorage";
import { useRefresh } from "../RefreshContext";

type Props = NativeStackScreenProps<RootStackParamList, "Detail">;

export default function PlanDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [openSlice, setOpenSlice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [err, setErr] = useState("");
  useSliceHeader(navigation, { left: "none", right: "plans" });
  const todaySliceNumber = useMemo(() => {
    const items = plan?.items ?? [];
    const next = items.find((d: any) => !d.is_done);
    return next ? next.day_number : null;
  }, [plan?.items]);
  const { bump } = useRefresh();

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const data = await getPlan(id);
      setPlan(data);
      navigation.setOptions({ title: data.title });
    } catch (e: any) {
      setErr(e.message ?? "unknown error");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [id]),
  );

  const toggleDay = async (day: PlanDay) => {
    const nextDone = !day.is_done;

    try {
      await patchDayDone(id, day.day_number, nextDone);
      bump();

      const fresh = await getPlan(id);

      if (nextDone && day.day_number === todaySliceNumber) {
        const ok = await ensureNotifPermission();
        if (ok) {
          const state = await loadPlanNotifState(id);

          if (state) {
            await cancelNotifIds([
              ...state.reminderIds,
              ...(state.blessId ? [state.blessId] : []),
            ]);
          }

          const nextIndex = day.day_number; // 1-based -> next day 0-based index
          const total = fresh.items.length;

          if (nextIndex < total) {
            const dayLabel = `Day ${nextIndex + 1}`;

            const nextTaskLine =
              (fresh.items as any)?.[nextIndex]?.title ??
              (fresh.items as any)?.[nextIndex]?.content ??
              `Work on: ${fresh.title}`;

            const reminderIds = await scheduleDailyReminders({
              title: `${dayLabel} — time to slice`,
              body: nextTaskLine,
              times: [...DEFAULT_REMINDER_TIMES],
            });

            const blessId = await scheduleDailyBless({
              title: `${dayLabel} — it’s okay`,
              body: "Didn’t finish today? It’s fine. Tomorrow we continue — same day until it’s done.",
            });

            await savePlanNotifState(id, {
              currentDayIndex: nextIndex,
              reminderIds,
              blessId,
            });
          } else {
            await clearPlanNotifState(id);
          }
        }
      }

      await load();
    } catch (e: any) {
      Alert.alert("Update failed", e.message ?? "unknown error");
    }
  };

  if (loading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (!plan) {
    return (
      <Screen>
        <CollageCard tone="paper">
          <Text className="text-charcoal font-bold tracking-[2px]">
            NOT FOUND
          </Text>
          <Text className="text-charcoal opacity-70">
            {err || "Plan not found"}
          </Text>
        </CollageCard>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="relative mb-3">
        <Text className="text-charcoal text-[24px] font-bold tracking-[1px]">
          {plan.title}
        </Text>
        <Text className="text-charcoal opacity-70 tracking-[1px]">
          {plan.days} DAYS · {plan.daily_minutes} MIN/DAY
        </Text>
      </View>

      <FlatList
        data={plan.items}
        keyExtractor={(d) => String(d.day_number)}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => (
          <View className="relative">
            <SliceSummaryCard
              item={item}
              isToday={todaySliceNumber === item.day_number}
              onToggleDone={() => toggleDay(item)}
              onEdit={() =>
                navigation.navigate("DayEditor", {
                  planId: plan.id,
                  dayNumber: item.day_number,
                })
              }
            />
          </View>
        )}
      />
    </Screen>
  );
}

function SliceSummaryCard({
  item,
  isToday,
  onToggleDone,
  onEdit,
}: {
  item: any;
  isToday: boolean;
  onToggleDone: () => void;
  onEdit: () => void;
}) {
  const [openSteps, setOpenSteps] = useState(false);
  const [openDoneIdx, setOpenDoneIdx] = useState<number | null>(null);

  const totalMin = (item.steps ?? []).reduce(
    (a: number, s: any) => a + (s.minutes || 0),
    0,
  );

  const tone = isToday ? "mustard" : item.is_done ? "paper" : "teal";

  return (
    <View className="relative">
      <CollageCard tone={tone}>
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Text className="text-charcoal text-[16px] font-bold tracking-[2px]">
              SLICE {item.day_number}
            </Text>

            <View className="border-2 border-charcoal rounded-[999px] px-3 py-1 bg-paper">
              <Text className="text-charcoal font-bold tracking-[2px] text-[12px]">
                {totalMin} MIN
              </Text>
            </View>

            {isToday ? (
              <View className="border-2 border-charcoal rounded-[999px] px-3 py-1 bg-rust">
                <Text className="text-charcoal font-bold tracking-[2px] text-[12px]">
                  TODAY
                </Text>
              </View>
            ) : null}
          </View>

          {/* Status pill: TODO / DONE */}
          <Pressable onPress={onToggleDone} hitSlop={10}>
            <View
              className={`border-2 border-charcoal rounded-[999px] px-3 py-1 ${
                item.is_done ? "bg-mustard" : "bg-paper"
              }`}
            >
              <Text className="text-charcoal font-bold tracking-[2px] text-[12px]">
                {item.is_done ? "DONE" : "TODO"}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* OPS toggle */}
        <View className="mt-3">
          <Pressable
            onPress={() => {
              const next = !openSteps;
              setOpenSteps(next);
              if (!next) setOpenDoneIdx(null);
            }}
            hitSlop={10}
          >
            <View className="flex-row items-center justify-between border-t-2 border-charcoal pt-3">
              <Text className="text-charcoal font-bold tracking-[3px] text-[12px] opacity-80">
                OPS
              </Text>
              <Text className="text-charcoal font-bold text-[14px]">
                {openSteps ? "▴" : "▾"}
              </Text>
            </View>
          </Pressable>

          {openSteps ? (
            <View className="mt-2 gap-2">
              {(item.steps ?? []).map((s: any, idx: number) => {
                const isOpen = openDoneIdx === idx;
                const hasDone =
                  s.done_definition &&
                  String(s.done_definition).trim().length > 0;

                return (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      if (!hasDone) return;
                      setOpenDoneIdx(isOpen ? null : idx);
                    }}
                    hitSlop={10}
                  >
                    <View className="border-2 border-charcoal rounded-[12px] bg-paper px-3 py-2">
                      <View className="flex-row items-start justify-between">
                        <Text className="text-charcoal font-bold flex-1 pr-3">
                          {idx + 1}. {s.title}
                        </Text>
                        <Text className="text-charcoal opacity-70 font-bold">
                          {s.minutes}m
                        </Text>
                      </View>

                      {/* Done means accordion (tap the step) */}
                      {isOpen ? (
                        <View className="mt-2 border-t-2 border-charcoal pt-2">
                          {s.deliverable ? (
                            <>
                              <Text className="text-charcoal opacity-70 text-[12px] tracking-[2px] font-bold">
                                DELIVERABLE
                              </Text>
                              <Text className="text-charcoal mt-1">
                                {s.deliverable}
                              </Text>
                            </>
                          ) : null}

                          <Text className="text-charcoal opacity-70 text-[12px] tracking-[2px] font-bold mt-2">
                            DONE MEANS
                          </Text>
                          <Text className="text-charcoal mt-1">
                            {s.done_definition}
                          </Text>
                        </View>
                      ) : null}

                      {!hasDone ? (
                        <Text className="text-charcoal opacity-50 mt-1 text-[12px]">
                          (No done definition)
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}

              {/* ✅ EDIT SLICE button */}
              <Pressable onPress={onEdit} hitSlop={10}>
                <View className="mt-1 border-2 border-charcoal rounded-[12px] bg-charcoal px-4 py-3">
                  <Text className="text-paper font-bold tracking-[2px] text-[12px]">
                    EDIT SLICE →
                  </Text>
                </View>
              </Pressable>
            </View>
          ) : null}
        </View>
      </CollageCard>
    </View>
  );
}
