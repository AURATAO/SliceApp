import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { Text, View, ScrollView, Pressable, Modal } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import {
  getSelectedPlanId,
  clearSelectedPlanId,
} from "../storage/selectedPlan";
import type { RootStackParamList } from "../../App";
import { getPlan, listPlans, patchDayDone } from "../api";
import type { PlanDay, PlanDetail, PlanListItem } from "../types";
import { useSliceHeader } from "../ui/useSliceHeader";
import { Screen } from "../ui/Screen";
import { CollageCard } from "../ui/CollageCard";
import { BrutalButton } from "../ui/BrutalButton";
import { VerticalLabel } from "../ui/VerticalLabel";
import { patchDayContent } from "../api";
import { StateCard } from "../ui/StateCard";
import { pickCongratsText } from "../ui/quotes";
import ConfettiCannon from "react-native-confetti-cannon";
import { useRefresh } from "../RefreshContext";

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
  const [openOps, setOpenOps] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsText, setCongratsText] = useState<string>("");
  const [congratsTitle, setCongratsTitle] = useState<string>("NICE CUT");
  const [willCompletePlan, setWillCompletePlan] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { refreshKey } = useRefresh();
  const didLoadRef = useRef(false);
  const { bump } = useRefresh();

  const todayDay: PlanDay | null = useMemo(() => {
    if (!plan) return null;
    return plan.items.find((d) => !d.is_done) ?? null;
  }, [plan]);

  const totalMin = useMemo(() => {
    const steps = todayDay?.steps ?? [];
    return steps.reduce((a: number, s: any) => a + (s.minutes || 0), 0);
  }, [todayDay?.steps]);

  useSliceHeader(navigation, { left: "none", right: "plans" });

  const doneDays = useMemo(() => {
    if (!plan) return 0;
    return plan.items.filter((d) => d.is_done).length;
  }, [plan]);

  const remainingDays = useMemo(() => {
    if (!plan) return 0;
    return Math.max(plan.days - doneDays, 0);
  }, [plan, doneDays]);

  const isPlanCompleted = (p: PlanDetail) =>
    p.items.filter((d) => d.is_done).length >= p.days;

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const sid = await getSelectedPlanId();

      // 1) Try selected plan first
      if (sid) {
        try {
          const detail = await getPlan(sid);

          // ✅ if selected plan is completed -> clear selection and fallback
          if (!isPlanCompleted(detail)) {
            setPlan(detail);
            return;
          }
          await clearSelectedPlanId();
        } catch {
          await clearSelectedPlanId();
        }
      }

      // 2) Fallback: find latest ACTIVE plan (not completed)
      const list = await listPlans();

      // try newest-first, find the first active one
      for (const p of list) {
        try {
          const detail = await getPlan(p.id);
          if (!isPlanCompleted(detail)) {
            setPlan(detail);
            return;
          }
        } catch {
          // ignore and continue
        }
      }

      // 3) No active plans found -> show empty state
      setPlan(null);
    } catch (e: any) {
      setErr(e?.message ?? "unknown error");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    if (!todayDay) return;
    setDraftFocus(todayDay.focus ?? "");
    setDraftSteps(todayDay.steps ?? []);
  }, [todayDay?.day_number]);

  useEffect(() => {
    setOpenOps(false);
    setOpenDoneIdx(null);
  }, [todayDay?.day_number]);

  const markDoneToday = async () => {
    if (!plan || !todayDay) return;

    try {
      setErr("");

      const doneDaysNow = plan.items.filter((d) => d.is_done).length;
      const willComplete = doneDaysNow + 1 >= plan.days;
      const remainingBefore = Math.max(plan.days - doneDaysNow, 0);

      await patchDayDone(plan.id, todayDay.day_number, true);

      bump();

      // congrats text
      const picked = pickCongratsText(remainingBefore, willComplete);
      setCongratsTitle(willComplete ? "COMPLETED" : "DONE");
      setCongratsText(picked.text);
      setWillCompletePlan(willComplete);

      // ✅ show effect first
      if (willComplete) {
        setShowConfetti(true);
        setShowCongrats(true);
        // setTimeout(() => setShowCongrats(true), 600);
      } else {
        setShowCongrats(true);
      }

      // ❌ do NOT load here
    } catch (e: any) {
      setErr(e?.message ?? "mark done failed");
    }
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
        <View className="mb-3">
          <Text className="text-charcoal text-[32px] font-bold tracking-[2px]">
            TODAY
          </Text>
          <Text className="text-charcoal opacity-70 tracking-[1px]">
            Loading your Slice...
          </Text>
        </View>

        <StateCard
          tone="paper"
          title="Loading"
          message="Fetching your latest plan."
          loading
        />
      </Screen>
    );
  }

  //Error 狀態
  if (err && !plan) {
    return (
      <Screen>
        <View className="mb-3">
          <Text className="text-charcoal text-[32px] font-bold tracking-[2px]">
            TODAY
          </Text>
          <Text className="text-charcoal opacity-70 tracking-[1px]">
            Something blocked your Slice.
          </Text>
        </View>

        <StateCard
          tone="rust"
          title="Network / Server error"
          message={err}
          actionLabel="Retry"
          onAction={load}
          secondaryLabel="Create plan"
          onSecondary={() => navigation.navigate("Create")}
        />
      </Screen>
    );
  }

  // No plan yet
  if (!plan) {
    return (
      <Screen>
        <View className="mb-3">
          <Text className="text-charcoal text-[32px] font-bold tracking-[2px]">
            TODAY
          </Text>
          <Text className="text-charcoal opacity-70 tracking-[1px]">
            No plan yet — make one Slice and start Day 1.
          </Text>
        </View>

        <StateCard
          tone="mustard"
          title="No plan yet"
          message="Create a 7-day plan, then your first task appears here automatically."
          actionLabel="Create"
          onAction={() => navigation.navigate("Create")}
          secondaryLabel="Open plans"
          onSecondary={() => navigation.navigate("Plans")}
        />
      </Screen>
    );
  }

  // Completed
  if (!todayDay) {
    return (
      <Screen>
        {showConfetti ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
            }}
          >
            <ConfettiCannon
              count={120}
              origin={{ x: 200, y: 0 }}
              fadeOut
              autoStart
              onAnimationEnd={() => setShowConfetti(false)}
            />
          </View>
        ) : null}
        <View className="relative mb-3">
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
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="relative mb-3">
          <Text className="text-charcoal text-[32px] font-bold tracking-[2px]">
            TODAY
          </Text>

          <Text className="text-charcoal opacity-80 tracking-[1px] mt-4">
            Only <Text className="font-bold">{remainingDays}</Text> day
            {remainingDays === 1 ? "" : "s"} left — “{plan.title}” will be done.
          </Text>

          <Text className="text-charcoal opacity-60 tracking-[1px] mt-1">
            Slice {todayDay.day_number} / {plan.days} · {plan.daily_minutes}{" "}
            min/day
          </Text>
        </View>

        <View className="relative">
          <VerticalLabel text="EXECUTE" />

          {/* ✅ Compact Today Card */}
          <CollageCard tone="teal">
            {/* header row */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Text className="text-charcoal text-[16px] font-bold tracking-[2px]">
                  SLICE {todayDay.day_number}
                </Text>

                <View className="border-2 border-charcoal rounded-[999px] px-3 py-1 bg-paper">
                  <Text className="text-charcoal font-bold tracking-[2px] text-[12px]">
                    {totalMin} MIN
                  </Text>
                </View>
              </View>

              {/* tiny edit */}
              <Pressable
                onPress={() =>
                  navigation.navigate("DayEditor", {
                    planId: plan.id,
                    dayNumber: todayDay.day_number,
                  })
                }
                hitSlop={10}
              >
                <View className="border-2 border-charcoal rounded-[999px] px-3 py-1 bg-paper">
                  <Text className="text-charcoal font-bold tracking-[2px] text-[12px]">
                    EDIT
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* OPS toggle */}
            <View className="mt-3">
              <Pressable
                onPress={() => {
                  const next = !openOps;
                  setOpenOps(next);
                  if (!next) setOpenDoneIdx(null);
                }}
                hitSlop={10}
              >
                <View className="flex-row items-center justify-between border-t-2 border-charcoal pt-3">
                  <Text className="text-charcoal font-bold tracking-[3px] text-[12px] opacity-80">
                    OPS
                  </Text>
                  <Text className="text-charcoal font-bold text-[14px]">
                    {openOps ? "▴" : "▾"}
                  </Text>
                </View>
              </Pressable>

              {openOps ? (
                <View className="mt-2 gap-2">
                  {(todayDay.steps ?? []).map((s: any, idx: number) => {
                    const hasDone =
                      s.done_definition &&
                      String(s.done_definition).trim().length > 0;
                    const isOpen = openDoneIdx === idx;

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
                </View>
              ) : null}
            </View>

            {/* CTAs */}
            <View className="mt-4">
              <BrutalButton
                label="Mark today as done"
                tone="mustard"
                onPress={markDoneToday}
              />
            </View>

            <View className="mt-3">
              <BrutalButton
                label="Open week"
                tone="charcoal"
                onPress={() => navigation.navigate("Detail", { id: plan.id })}
              />
            </View>

            <Text className="mt-2 text-charcoal opacity-60 text-[12px] tracking-[1px]">
              Done today → tomorrow updates automatically.
            </Text>
          </CollageCard>
        </View>

        {err ? (
          <View className="mt-3">
            <StateCard
              tone="rust"
              title="Something went wrong"
              message={err}
              actionLabel="Retry"
              onAction={load}
            />
          </View>
        ) : null}
        <Modal visible={showCongrats} transparent animationType="fade">
          <View className="flex-1 items-center justify-center bg-black/40 px-5">
            <View className="w-full border-2 border-charcoal rounded-[16px] bg-paper p-4">
              <Text className="text-charcoal text-[12px] tracking-[3px] font-bold">
                {congratsTitle}
              </Text>

              <Text className="text-charcoal text-[22px] font-bold mt-2">
                {congratsText}
              </Text>

              <Text className="text-charcoal opacity-70 mt-2">
                {willCompletePlan
                  ? `You finished “${plan?.title ?? ""}”.`
                  : "Tomorrow auto-loads. Keep it moving."}
              </Text>

              <View className="mt-5 flex-row justify-between">
                <Pressable
                  onPress={async () => {
                    setShowCongrats(false);
                  }}
                  hitSlop={10}
                >
                  <View className="border-2 border-charcoal rounded-[999px] px-4 py-2 bg-paper">
                    <Text className="text-charcoal font-bold tracking-[2px]">
                      OK
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={async () => {
                    setShowCongrats(false);

                    if (plan?.id)
                      navigation.navigate("Detail", { id: plan.id });
                  }}
                  hitSlop={10}
                >
                  <View className="border-2 border-charcoal rounded-[999px] px-4 py-2 bg-mustard">
                    <Text className="text-charcoal font-bold tracking-[2px]">
                      OPEN WEEK →
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </Screen>
  );
}
