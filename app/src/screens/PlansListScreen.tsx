import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
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

type Props = NativeStackScreenProps<RootStackParamList, "Plans">;

const tones = ["teal", "rust", "mustard"] as const;

export default function PlansListScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [err, setErr] = useState<string>("");
  useSliceHeader(navigation, { left: "none", right: "plus" });

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const data = await listPlans();
      setPlans(data);
    } catch (e: any) {
      setErr(e.message ?? "unknown error");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (planId: string) => {
    try {
      setErr("");
      await deletePlan(planId);
      await load();
    } catch (e: any) {
      setErr(e.message ?? "delete failed");
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
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
            const tone = tones[index % tones.length];

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
                    <CollageCard tone={tone}>
                      <Text className="text-charcoal text-[18px] font-bold tracking-[1px]">
                        {item.title}
                      </Text>

                      <View className="mt-2 flex-row justify-between items-center">
                        <Text className="text-charcoal opacity-80">
                          {item.days} DAYS
                        </Text>
                        <Text className="text-charcoal opacity-80">
                          {item.daily_minutes} MIN/DAY
                        </Text>
                      </View>

                      <View className="mt-3 border-t-2 border-charcoal pt-2">
                        <Text className="text-charcoal text-[12px] tracking-[3px] font-bold">
                          TAP TO OPEN →
                        </Text>
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
