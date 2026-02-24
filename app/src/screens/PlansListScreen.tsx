import React, { useCallback, useState, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import "react-native-gesture-handler";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { listPlans } from "../api";
import type { PlanListItem } from "../types";
import type { RootStackParamList } from "../../App";
import { Screen } from "../ui/Screen";
import { CollageCard } from "../ui/CollageCard";
import { VerticalLabel } from "../ui/VerticalLabel";
import { Marks } from "../ui/Marks";
import { useSliceHeader } from "../ui/useSliceHeader";
import { StateCard } from "../ui/StateCard";
import { Swipeable } from "react-native-gesture-handler";
import { deletePlan } from "../api";
import { getSelectedPlanId, setSelectedPlanId } from "../storage/selectedPlan";
import { getPlan } from "../api";
import { useRefresh } from "../RefreshContext";

type Props = NativeStackScreenProps<RootStackParamList, "Plans">;

const tones = ["teal", "rust", "mustard"] as const;

export default function PlansListScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [err, setErr] = useState<string>("");
  useSliceHeader(navigation, { left: "none", right: "plus" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { refreshKey, bump } = useRefresh();
  const didLoadRef = useRef(false);
  type PlanRow = PlanListItem & { is_completed: boolean };

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const list = await listPlans();
      const sid = await getSelectedPlanId();
      setSelectedId(sid);

      const settled = await Promise.allSettled(
        list.map(async (p) => {
          const detail = await getPlan(p.id);
          const doneCount = detail.items.filter((d) => d.is_done).length;
          const is_completed = doneCount >= detail.days;
          return { ...p, is_completed };
        }),
      );

      const rows: PlanRow[] = settled.map((r, idx) => {
        if (r.status === "fulfilled") return r.value;
        return { ...list[idx], is_completed: false };
      });

      rows.sort((a, b) => {
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        return 0;
      });

      setPlans(rows);
    } catch (e: any) {
      setErr(e?.message ?? "unknown error");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (planId: string) => {
    try {
      setErr("");
      await deletePlan(planId);
      bump();
    } catch (e: any) {
      setErr(e.message ?? "delete failed");
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!didLoadRef.current) {
        didLoadRef.current = true;
        load();
        return;
      }
      load();
    }, [refreshKey]),
  );

  return (
    <Screen>
      <View className="mb-3">
        <Text className="text-charcoal text-[32px] font-bold tracking-[2px]">
          SLICE
        </Text>
        <Text className="text-charcoal opacity-70 tracking-[1px]">
          Retro-Future Success · 7-Day Checklist
        </Text>
      </View>

      {err ? (
        <StateCard
          tone="rust"
          title="Network / Server error"
          message={err}
          actionLabel="Retry"
          onAction={load}
        />
      ) : null}

      {loading ? (
        <StateCard
          tone="paper"
          title="Loading"
          message="Fetching plans..."
          loading
        />
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item, index }) => {
            const isSelected = selectedId === item.id;
            const isCompleted = item.is_completed;

            const RightActions = () => (
              <Pressable onPress={() => onDelete(item.id)} hitSlop={10}>
                <View className="h-full justify-center items-center px-5 border-2 border-charcoal rounded-[12px] bg-rust">
                  <Text className="text-charcoal font-bold tracking-[2px]">
                    DELETE
                  </Text>
                  <Text className="text-charcoal opacity-70 text-[11px] mt-1">
                    swipe
                  </Text>
                </View>
              </Pressable>
            );

            return (
              <Swipeable
                renderRightActions={RightActions}
                rightThreshold={40}
                overshootRight={false}
              >
                <View className="relative">
                  <VerticalLabel text="WEEK PLAN" />
                  <Marks />
                  <Pressable
                    onPress={() =>
                      navigation.navigate("Detail", { id: item.id })
                    }
                  >
                    <CollageCard tone={isSelected ? "mustard" : "paper"}>
                      {/* ✅ Completed: fade the whole card */}
                      <View className={isCompleted ? "opacity-40" : ""}>
                        <View className="flex-row items-start justify-between gap-3">
                          <Text className="text-charcoal text-[18px] font-bold tracking-[1px] flex-1">
                            {item.title}
                          </Text>

                          {/* ✅ disable selector if completed */}
                          {!isCompleted ? (
                            <Pressable
                              onPress={async () => {
                                await setSelectedPlanId(item.id);
                                setSelectedId(item.id);
                                bump();
                                navigation.navigate("Today");
                              }}
                              hitSlop={10}
                            >
                              <View
                                className={`w-9 h-9 rounded-full border-2 border-charcoal items-center justify-center ${
                                  isSelected ? "bg-teal" : "bg-paper"
                                }`}
                              >
                                {isSelected ? (
                                  <Text className="text-[16px] font-extrabold text-paper">
                                    ✓
                                  </Text>
                                ) : null}
                              </View>
                            </Pressable>
                          ) : (
                            <View className="w-9 h-9 rounded-full border-2 border-charcoal opacity-30 items-center justify-center">
                              <Text className="text-[12px] font-bold text-charcoal">
                                ✓
                              </Text>
                            </View>
                          )}
                        </View>

                        <View className="mt-2 flex-row justify-between items-center">
                          <Text className="text-charcoal opacity-80">
                            {item.days} DAYS
                          </Text>
                          <Text className="text-charcoal opacity-80">
                            {item.daily_minutes} MIN/DAY
                          </Text>
                        </View>

                        {/* ✅ show completed label */}
                        {isCompleted ? (
                          <View className="mt-3 border-t-2 border-charcoal pt-2 flex-row items-center justify-between">
                            <Text className="text-charcoal text-[12px] tracking-[3px] font-bold opacity-80">
                              COMPLETED ✓
                            </Text>
                            <Text className="text-charcoal text-[12px] tracking-[3px] font-bold opacity-60">
                              TAP TO REVIEW →
                            </Text>
                          </View>
                        ) : (
                          <View className="mt-3 border-t-2 border-charcoal pt-2">
                            <Text className="text-charcoal text-[12px] tracking-[3px] font-bold">
                              TAP TO OPEN →
                            </Text>
                          </View>
                        )}
                      </View>
                    </CollageCard>
                  </Pressable>
                </View>
              </Swipeable>
            );
          }}
          ListEmptyComponent={
            <StateCard
              tone="mustard"
              title="No plans"
              message="Tap + to create your first 7-day Slice."
              actionLabel="Create"
              onAction={() => navigation.navigate("Create")}
            />
          }
        />
      )}
    </Screen>
  );
}
