import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { listPlans } from "../api";
import type { PlanListItem } from "../types";
import type { RootStackParamList } from "../../App";
import { Screen } from "../ui/Screen";
import { CollageCard } from "../ui/CollageCard";
import { VerticalLabel } from "../ui/VerticalLabel";
import { Marks } from "../ui/Marks";

type Props = NativeStackScreenProps<RootStackParamList, "Plans">;

const tones = ["teal", "rust", "mustard"] as const;

export default function PlansListScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [err, setErr] = useState<string>("");

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

  useEffect(() => {
    navigation.setOptions({
      title: "Slice",
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate("Create")}>
          <View className="border-2 border-charcoal rounded-[10px] px-3 py-1 bg-mustard">
            <Text className="text-charcoal font-bold text-[16px]">＋</Text>
          </View>
        </Pressable>
      ),
    });
  }, [navigation]);

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
        <View className="border-2 border-charcoal rounded-[12px] bg-paper p-3 mb-3">
          <Text className="text-charcoal font-bold">ERROR</Text>
          <Text className="text-charcoal opacity-80">{err}</Text>
        </View>
      ) : null}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item, index }) => (
            <View className="relative">
              <VerticalLabel text="WEEK PLAN" />
              <Marks />
              <Pressable
                onPress={() => navigation.navigate("Detail", { id: item.id })}
              >
                <CollageCard tone={tones[index % tones.length]}>
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
          )}
          ListEmptyComponent={
            <CollageCard tone="paper">
              <Text className="text-charcoal font-bold tracking-[2px]">
                NO PLANS YET
              </Text>
              <Text className="text-charcoal opacity-70 mt-1">
                Tap ＋ to create one.
              </Text>
            </CollageCard>
          }
        />
      )}
    </Screen>
  );
}
