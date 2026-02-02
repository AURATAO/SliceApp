import React, { useCallback, useState } from "react";
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
import { Marks } from "../ui/Marks";
import { VerticalLabel } from "../ui/VerticalLabel";

type Props = NativeStackScreenProps<RootStackParamList, "Detail">;

export default function PlanDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [err, setErr] = useState("");

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
    try {
      await patchDayDone(id, day.day_number, !day.is_done);
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
        <Marks />
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
            <VerticalLabel text="CHECKLIST" />
            <Pressable onPress={() => toggleDay(item)}>
              <CollageCard tone={item.is_done ? "paper" : "teal"}>
                <View className="flex-row justify-between items-center">
                  <Text className="text-charcoal text-[16px] font-bold tracking-[1px]">
                    DAY {item.day_number}
                  </Text>

                  <View
                    className={`border-2 border-charcoal rounded-[999px] px-3 py-1 ${item.is_done ? "bg-mustard" : "bg-paper"}`}
                  >
                    <Text className="text-charcoal font-bold tracking-[2px] text-[12px]">
                      {item.is_done ? "DONE" : "OPEN"}
                    </Text>
                  </View>
                </View>

                <Text className="text-charcoal mt-2 font-bold">
                  {item.focus}
                </Text>

                <View className="mt-3 border-t-2 border-charcoal pt-2">
                  {item.steps.map((s, idx) => (
                    <Text key={idx} className="text-charcoal opacity-90">
                      • {s.title} ({s.minutes}m)
                    </Text>
                  ))}
                </View>

                <Text className="mt-2 text-charcoal opacity-60 text-[12px] tracking-[2px] font-bold">
                  TAP TO TOGGLE →
                </Text>
              </CollageCard>
            </Pressable>
          </View>
        )}
      />
    </Screen>
  );
}
