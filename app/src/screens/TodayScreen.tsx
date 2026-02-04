import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import type { RootStackParamList } from "../../App";
import { getPlan, listPlans, patchDayDone } from "../api";
import type { PlanDay, PlanDetail, PlanListItem } from "../types";
import { useSliceHeader } from "../ui/useSliceHeader";
import { Screen } from "../ui/Screen";
import { CollageCard } from "../ui/CollageCard";
import { BrutalButton } from "../ui/BrutalButton";
import { Marks } from "../ui/Marks";
import { VerticalLabel } from "../ui/VerticalLabel";
import { patchDayContent } from "../api";

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
  const [isEditing, setIsEditing] = useState(false);
  const [draftFocus, setDraftFocus] = useState("");
  const [draftSteps, setDraftSteps] = useState<any[]>([]);
  const [openDoneIdx, setOpenDoneIdx] = useState<number | null>(null);

  useSliceHeader(navigation, { left: "none", right: "plans" });

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

  useEffect(() => {
    if (!todayDay) return;
    setDraftFocus(todayDay.focus ?? "");
    setDraftSteps(todayDay.steps ?? []);
  }, [todayDay?.day_number]);

  const markDoneToday = async () => {
    if (!plan || !todayDay) return;
    await patchDayDone(plan.id, todayDay.day_number, true);
    await load();
  };

  const saveToday = async () => {
    if (!plan || !todayDay) return;

    await patchDayContent(plan.id, todayDay.day_number, {
      focus: draftFocus,
      steps: draftSteps,
    });

    setIsEditing(false);
    await load();
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

  // No plan yet
  if (!plan) {
    return (
      <Screen>
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={10}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 140 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="relative mb-3">
            <Marks />
            <Text className="text-charcoal text-[32px] font-bold tracking-[2px] ">
              TODAY
            </Text>

            <Text className="text-charcoal opacity-80 tracking-[1px] mt-4">
              Only <Text className="font-bold">{remainingDays}</Text> day
              {remainingDays === 1 ? "" : "s"} left — “{plan.title}” will be
              done.
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

                <View className="flex-row gap-2">
                  {!isEditing ? (
                    <BrutalButton
                      label="Edit"
                      tone="teal"
                      onPress={() => setIsEditing(true)}
                    />
                  ) : (
                    <>
                      <BrutalButton
                        label="Cancel"
                        tone="teal"
                        onPress={() => {
                          setIsEditing(false);
                          setDraftFocus(todayDay.focus ?? "");
                          setDraftSteps(todayDay.steps ?? []);
                        }}
                      />
                      <BrutalButton
                        label="Save"
                        tone="mustard"
                        onPress={saveToday}
                      />
                    </>
                  )}
                </View>
              </View>

              <Text className="text-charcoal text-[12px] tracking-[3px] font-bold mt-3">
                TODAY'S MISSION
              </Text>
              {!isEditing ? (
                <Text className="text-charcoal mt-2 font-bold">
                  {todayDay.focus}
                </Text>
              ) : (
                <TextInput
                  value={draftFocus}
                  onChangeText={setDraftFocus}
                  placeholder="Write today's focus..."
                  placeholderTextColor="#2C2C2C"
                  className="mt-2 border-2 border-charcoal rounded-[12px] px-3 py-2 bg-paper text-charcoal"
                />
              )}

              <View className="mt-3 border-t-2 border-charcoal pt-2">
                <Text className="text-charcoal text-[12px] tracking-[3px] font-bold mb-2">
                  STEPS
                </Text>

                {!isEditing ? (
                  <View className="gap-2">
                    {todayDay.steps.map((s, idx) => {
                      const isOpen = openDoneIdx === idx;
                      const hasDone = Boolean(
                        s.done_definition &&
                        String(s.done_definition).trim().length > 0,
                      );

                      return (
                        <View
                          key={idx}
                          className="border-2 border-charcoal rounded-[12px] bg-paper p-3"
                        >
                          <View className="flex-row items-start justify-between gap-3">
                            <View className="flex-1">
                              <Text className="text-charcoal font-bold">
                                {idx + 1}. {s.title}
                              </Text>
                              <Text className="text-charcoal opacity-70 mt-1">
                                {s.minutes} min
                              </Text>
                            </View>

                            {/* info icon */}
                            {hasDone ? (
                              <Pressable
                                onPress={() =>
                                  setOpenDoneIdx(isOpen ? null : idx)
                                }
                                hitSlop={10}
                              >
                                <View className="w-8 h-8 rounded-full border-2 border-charcoal bg-mustard items-center justify-center">
                                  <Text className="text-charcoal font-extrabold">
                                    i
                                  </Text>
                                </View>
                              </Pressable>
                            ) : (
                              <View className="w-8 h-8 opacity-30 items-center justify-center">
                                <Text className="text-charcoal font-extrabold">
                                  i
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* accordion */}
                          {isOpen ? (
                            <View className="mt-3 border-t-2 border-charcoal pt-2">
                              <Text className="text-charcoal opacity-70 text-[12px] tracking-[2px] font-bold">
                                DONE MEANS
                              </Text>
                              <Text className="text-charcoal mt-1">
                                {s.done_definition}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View className="gap-2">
                    {draftSteps.map((s, idx) => (
                      <View
                        key={idx}
                        className="border-2 border-charcoal rounded-[12px] bg-paper p-3"
                      >
                        <Text className="text-charcoal text-[11px] font-bold tracking-[2px] opacity-70">
                          STEP {idx + 1}
                        </Text>

                        <TextInput
                          value={s.title ?? ""}
                          onChangeText={(t) => {
                            const next = [...draftSteps];
                            next[idx] = { ...next[idx], title: t };
                            setDraftSteps(next);
                          }}
                          placeholder="Step title (what to do)"
                          placeholderTextColor="#2C2C2C"
                          className="mt-2 text-charcoal font-bold"
                          multiline
                        />

                        <View className="flex-row items-center justify-between mt-2">
                          <Text className="text-charcoal opacity-70">
                            Minutes
                          </Text>
                          <TextInput
                            value={String(s.minutes ?? "")}
                            onChangeText={(t) => {
                              const n = parseInt(t || "0", 10);
                              const next = [...draftSteps];
                              next[idx] = {
                                ...next[idx],
                                minutes: Number.isFinite(n) ? n : 0,
                              };
                              setDraftSteps(next);
                            }}
                            keyboardType="number-pad"
                            className="border-2 border-charcoal rounded-[10px] px-3 py-2 bg-paper text-charcoal w-[90px] text-right"
                          />
                        </View>

                        <Text className="text-charcoal opacity-70 mt-3">
                          Done means…
                        </Text>
                        <TextInput
                          value={s.done_definition ?? ""}
                          onChangeText={(t) => {
                            const next = [...draftSteps];
                            next[idx] = { ...next[idx], done_definition: t };
                            setDraftSteps(next);
                          }}
                          placeholder="How do you know this step is done?"
                          placeholderTextColor="#2C2C2C"
                          className="mt-2 border-2 border-charcoal rounded-[12px] px-3 py-2 bg-paper text-charcoal"
                          multiline
                        />
                      </View>
                    ))}

                    <BrutalButton
                      label="Add step"
                      tone="teal"
                      onPress={() =>
                        setDraftSteps([
                          ...draftSteps,
                          {
                            title: "New step",
                            minutes: 10,
                            done_definition: "",
                          },
                        ])
                      }
                    />
                  </View>
                )}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
