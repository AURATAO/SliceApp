import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { CollageCard } from "./CollageCard";
import { patchDayContent } from "../api";

type Tone = "paper" | "teal" | "mustard" | "rust";

type PlanDayStep = {
  title: string;
  minutes: number;
  deliverable?: string;
  done_definition?: string;
};

type PlanDay = {
  day_number: number;
  focus: string;
  steps: PlanDayStep[];
  is_done?: boolean;
};

export function EditablePlanDayCard({
  planId,
  day,
  tone = "paper",
  onSaved,
}: {
  planId: string;
  day: PlanDay;
  tone?: Tone;
  onSaved: () => Promise<void> | void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftFocus, setDraftFocus] = useState(day.focus ?? "");
  const [draftSteps, setDraftSteps] = useState<PlanDayStep[]>(day.steps ?? []);
  const [openDoneIdx, setOpenDoneIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // when parent reloads / day changes
    setDraftFocus(day.focus ?? "");
    setDraftSteps(day.steps ?? []);
    setIsEditing(false);
    setOpenDoneIdx(null);
  }, [day.day_number, day.focus, JSON.stringify(day.steps)]);

  const hasDone = (s: PlanDayStep) =>
    Boolean(s.done_definition && String(s.done_definition).trim().length > 0);

  const save = async () => {
    try {
      setSaving(true);
      await patchDayContent(planId, day.day_number, {
        focus: draftFocus,
        steps: draftSteps,
      });
      setIsEditing(false);
      setOpenDoneIdx(null);
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setDraftFocus(day.focus ?? "");
    setDraftSteps(day.steps ?? []);
    setIsEditing(false);
    setOpenDoneIdx(null);
  };

  const totalMin = useMemo(
    () =>
      (isEditing ? draftSteps : day.steps).reduce(
        (a, s) => a + (s.minutes || 0),
        0,
      ),
    [isEditing, draftSteps, day.steps],
  );

  return (
    <CollageCard tone={tone}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-charcoal font-bold tracking-[2px]">
            DAY {day.day_number}
          </Text>
          <Text className="text-charcoal opacity-70 mt-1">{totalMin} MIN</Text>
        </View>

        {!isEditing ? (
          <Pressable
            onPress={() => {
              setIsEditing(true);
              setOpenDoneIdx(null);
            }}
            hitSlop={10}
          >
            <View className="border-2 border-charcoal rounded-[12px] bg-paper px-3 py-2">
              <Text className="text-charcoal font-bold text-[12px] tracking-[2px]">
                EDIT
              </Text>
            </View>
          </Pressable>
        ) : (
          <View className="flex-row gap-2">
            <Pressable onPress={cancel} hitSlop={10} disabled={saving}>
              <View className="border-2 border-charcoal rounded-[12px] bg-paper px-3 py-2 opacity-90">
                <Text className="text-charcoal font-bold text-[12px] tracking-[2px]">
                  CANCEL
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={save} hitSlop={10} disabled={saving}>
              <View className="border-2 border-charcoal rounded-[12px] bg-mustard px-3 py-2">
                <Text className="text-charcoal font-bold text-[12px] tracking-[2px]">
                  {saving ? "SAVING…" : "SAVE"}
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </View>

      {/* Steps */}
      <Text className="text-charcoal text-[12px] tracking-[3px] font-bold mt-4 mb-2">
        STEPS
      </Text>

      {!isEditing ? (
        <View className="gap-2">
          {(day.steps ?? []).map((s, idx) => {
            const isOpen = openDoneIdx === idx;
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

                  {hasDone(s) ? (
                    <Pressable
                      onPress={() => setOpenDoneIdx(isOpen ? null : idx)}
                      hitSlop={10}
                    >
                      <View className="w-8 h-8 rounded-full border-2 border-charcoal bg-mustard items-center justify-center">
                        <Text className="text-charcoal font-extrabold">i</Text>
                      </View>
                    </Pressable>
                  ) : (
                    <View className="w-8 h-8 opacity-30 items-center justify-center">
                      <Text className="text-charcoal font-extrabold">i</Text>
                    </View>
                  )}
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
              </View>
            );
          })}
        </View>
      ) : (
        <View className="gap-2">
          {draftSteps.map((s, idx) => {
            const isOpen = openDoneIdx === idx;
            return (
              <View
                key={idx}
                className="border-2 border-charcoal rounded-[12px] bg-paper p-3"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-charcoal opacity-70 text-[11px] font-bold tracking-[2px]">
                      STEP {idx + 1}
                    </Text>

                    <TextInput
                      value={s.title ?? ""}
                      onChangeText={(t) => {
                        const next = [...draftSteps];
                        next[idx] = { ...next[idx], title: t };
                        setDraftSteps(next);
                      }}
                      placeholder="Step title"
                      placeholderTextColor="#2C2C2C"
                      className="mt-2 text-charcoal font-bold"
                      multiline
                    />

                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="text-charcoal opacity-70">Minutes</Text>
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
                  </View>

                  <Pressable
                    onPress={() => setOpenDoneIdx(isOpen ? null : idx)}
                    hitSlop={10}
                  >
                    <View className="w-8 h-8 rounded-full border-2 border-charcoal bg-mustard items-center justify-center">
                      <Text className="text-charcoal font-extrabold">i</Text>
                    </View>
                  </Pressable>
                </View>

                {isOpen ? (
                  <View className="mt-3 border-t-2 border-charcoal pt-2">
                    <Text className="text-charcoal opacity-70 mt-3">
                      Deliverable…
                    </Text>
                    <TextInput
                      value={s.deliverable ?? ""}
                      onChangeText={(t) => {
                        const next = [...draftSteps];
                        next[idx] = { ...next[idx], deliverable: t };
                        setDraftSteps(next);
                      }}
                      placeholder="What will exist after this step?"
                      placeholderTextColor="#2C2C2C"
                      className="mt-2 border-2 border-charcoal rounded-[12px] px-3 py-2 bg-paper text-charcoal"
                      multiline
                    />

                    <Text className="text-charcoal opacity-70 text-[12px] tracking-[2px] font-bold">
                      DONE MEANS
                    </Text>
                    <TextInput
                      value={s.done_definition ?? ""}
                      onChangeText={(t) => {
                        const next = [...draftSteps];
                        next[idx] = { ...next[idx], done_definition: t };
                        setDraftSteps(next);
                      }}
                      placeholder="Define what 'done' means..."
                      placeholderTextColor="#2C2C2C"
                      className="mt-2 border-2 border-charcoal rounded-[12px] px-3 py-2 bg-paper text-charcoal"
                      multiline
                    />
                  </View>
                ) : null}
              </View>
            );
          })}

          <Pressable
            onPress={() =>
              setDraftSteps([
                ...draftSteps,
                {
                  title: "New step",
                  minutes: 10,
                  deliverable: "",
                  done_definition: "",
                },
              ])
            }
            hitSlop={10}
          >
            <View className="border-2 border-charcoal rounded-[12px] bg-paper px-4 py-3">
              <Text className="text-charcoal font-bold tracking-[2px] text-[12px]">
                ADD STEP
              </Text>
            </View>
          </Pressable>
        </View>
      )}
    </CollageCard>
  );
}
