import React, { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { createPlan } from "../api";
import type { RootStackParamList } from "../../App";
import { Screen } from "../ui/Screen";
import { CollageCard } from "../ui/CollageCard";
import { BrutalButton } from "../ui/BrutalButton";
import { Marks } from "../ui/Marks";

type Props = NativeStackScreenProps<RootStackParamList, "Create">;

export default function CreatePlanScreen({ navigation }: Props) {
  const [title, setTitle] = useState("Build portfolio");
  const [days, setDays] = useState("7");
  const [minutes, setMinutes] = useState("30");
  const [loading, setLoading] = useState(false);

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
      navigation.replace("Detail", { id: res.plan_id });
    } catch (e: any) {
      Alert.alert("Create failed", e.message ?? "unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
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
      </View>
    </Screen>
  );
}
