import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import type { RootStackParamList } from "../../App";
import { getPlan, listPlans, patchDayDone } from "../api";
import type { PlanDay, PlanDetail, PlanListItem } from "../types";

import { Screen } from "../ui/Screen";
import { CollageCard } from "../ui/CollageCard";
import { BrutalButton } from "../ui/BrutalButton";
import { Marks } from "../ui/Marks";
import { VerticalLabel } from "../ui/VerticalLabel";
import { AppHeader } from "../ui/AppHeader";

type Props = NativeStackScreenProps<RootStackParamList, "Today">;

function pickLatestPlan(plans: PlanListItem[]) {
  const sorted = [...plans].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return tb - ta;
  });
  return sorted[0] ?? null;
}

export default function TodayScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [plan, setPlan] = useState<PlanDetail | null>(null);

  const doneDays = useMemo(() => {
    if (!plan) return 0;
    return plan.items.filter((d) => d.is_done).length;
  }, [plan]);

  const remainingDays = useMemo(() => {
    if (!plan) return 0;
    return Math.max(plan.days - doneDays, 0);
  }, [plan, doneDays]);

  const todayDay: PlanDay | null = useMemo(() => {
    if (!plan) return null;
    return plan.items.find((d) => !d.is_done) ?? null;
  }, [plan]);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const plans = await listPlans();
      const latest = pickLatestPlan(plans);

      if (!latest) {
        setPlan(null);
        return;
      }

      const detail = await getPlan(latest.id);
      setPlan(detail);
    } catch (e: any) {
      setErr(e?.message ?? "unknown error");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const markDoneToday = async () => {
    if (!plan || !todayDay) return;
    await patchDayDone(plan.id, todayDay.day_number, true);
    await load();
  };

  if (loading) {
    return (
      <Screen>
        {/* <AppHeader
          title="SLICE"
          onPressLeft={() => navigation.navigate("Create")}
          onPressRight={() => navigation.navigate("Plans")}
        /> */}

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  // No plan yet
  if (!plan) {
    return (
      <Screen>
        {/* <AppHeader
          title="SLICE"
          onPressLeft={() => navigation.navigate("Create")}
          onPressRight={() => navigation.navigate("Plans")}
        /> */}

        <View className="relative mb-3">
          <Marks />
          <Text className="text-charcoal text-[32px] font-bold tracking-[2px]">
            TODAY
          </Text>
          <Text className="text-charcoal opacity-70 tracking-[1px]">
            Give me a goal. I’ll cut it into 7 days. You just do Day 1.
          </Text>
        </View>

        <CollageCard tone="paper">
          <Text className="text-charcoal font-bold tracking-[2px]">
            NO PLAN YET
          </Text>
          <Text className="text-charcoal opacity-70 mt-1">
            Tap ＋ to create your first 7-day Slice.
          </Text>
        </CollageCard>

        <View className="mt-4">
          <BrutalButton
            label="Create a plan"
            tone="charcoal"
            onPress={() => navigation.navigate("Create")}
          />
        </View>
      </Screen>
    );
  }

  // Completed
  if (!todayDay) {
    return (
      <Screen>
        {/* <AppHeader
          title="SLICE"
          onPressLeft={() => navigation.navigate("Create")}
          onPressRight={() => navigation.navigate("Plans")}
        /> */}

        <View className="relative mb-3">
          <Marks />
          <Text className="text-charcoal text-[28px] font-bold tracking-[2px]">
            COMPLETED
          </Text>
          <Text className="text-charcoal opacity-70 tracking-[1px]">
            You finished “{plan.title}”. That’s a full Slice.
          </Text>
        </View>

        <CollageCard tone="mustard">
          <Text className="text-charcoal font-bold tracking-[2px]">
            YOU DID IT
          </Text>
          <Text className="text-charcoal opacity-80 mt-2">
            Want to start a new 7-day goal?
          </Text>

          <View className="mt-4">
            <BrutalButton
              label="Create next plan"
              tone="charcoal"
              onPress={() => navigation.navigate("Create")}
            />
          </View>

          <View className="mt-3">
            <BrutalButton
              label="View the week"
              tone="teal"
              onPress={() => navigation.navigate("Detail", { id: plan.id })}
            />
          </View>
        </CollageCard>
      </Screen>
    );
  }

  // Normal Today
  return (
    <Screen>
      {/* <AppHeader
        title="SLICE"
        onPressLeft={() => navigation.navigate("Create")}
        onPressRight={() => navigation.navigate("Plans")}
      /> */}

      <View className="relative mb-3">
        <Marks />
        <Text className="text-charcoal text-[32px] font-bold tracking-[2px] ">
          TODAY
        </Text>

        <Text className="text-charcoal opacity-80 tracking-[1px] mt-4">
          Only <Text className="font-bold">{remainingDays}</Text> day
          {remainingDays === 1 ? "" : "s"} left — “{plan.title}” will be done.
        </Text>

        <Text className="text-charcoal opacity-60 tracking-[1px] mt-1">
          Day {todayDay.day_number} / {plan.days} · {plan.daily_minutes} min
        </Text>
      </View>

      <View className="relative">
        <VerticalLabel text="EXECUTE" />

        <CollageCard tone="teal">
          <View className="flex-row justify-between items-center">
            <Text className="text-charcoal text-[16px] font-bold tracking-[1px]">
              DAY {todayDay.day_number}
            </Text>

            <View className="border-2 border-charcoal rounded-[999px] px-3 py-1 bg-paper">
              <Text className="text-charcoal font-bold tracking-[2px] text-[12px]">
                WEEK VIEW →
              </Text>
            </View>
          </View>

          <Text className="text-charcoal text-[12px] tracking-[3px] font-bold mt-3">
            TODAY'S MISSION
          </Text>
          <Text className="text-charcoal mt-2 font-bold">{todayDay.focus}</Text>

          <View className="mt-3 border-t-2 border-charcoal pt-2">
            <Text className="text-charcoal text-[12px] tracking-[3px] font-bold mb-2">
              STEPS
            </Text>

            {todayDay.steps.map((s, idx) => (
              <Text key={idx} className="text-charcoal opacity-90">
                • {s.title} ({s.minutes}m)
              </Text>
            ))}
          </View>

          <View className="mt-4">
            <BrutalButton
              label="Mark today as done"
              tone="mustard"
              onPress={markDoneToday}
            />
          </View>

          <Text className="mt-2 text-charcoal opacity-60 text-[12px] tracking-[1px]">
            Finish today → tomorrow’s task shows automatically.
          </Text>

          {/* Quick link to the week */}
          <View className="mt-3">
            <BrutalButton
              label="Open week"
              tone="charcoal"
              onPress={() => navigation.navigate("Detail", { id: plan.id })}
            />
          </View>
        </CollageCard>
      </View>

      {err ? (
        <View className="mt-3 border-2 border-charcoal rounded-[12px] bg-paper p-3">
          <Text className="text-charcoal font-bold">ERROR</Text>
          <Text className="text-charcoal opacity-80">{err}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
