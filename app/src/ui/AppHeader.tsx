import React from "react";
import { Pressable, Text, View } from "react-native";

export function AppHeader({
  title = "SLICE",
  onPressLeft,
  onPressRight,
}: {
  title?: string;
  onPressLeft: () => void; // +
  onPressRight: () => void; // plans
}) {
  return (
    <View className="flex-row items-center justify-between pt-2 pb-3">
      {/* Left: + */}
      <Pressable onPress={onPressLeft} hitSlop={12}>
        <View className="w-12 h-12 rounded-[16px] bg-mustard border-2 border-charcoal items-center justify-center">
          <Text className="text-charcoal text-[22px] font-bold">＋</Text>
        </View>
      </Pressable>

      {/* Center: title */}
      <Text className="text-charcoal text-[20px] font-bold tracking-[3px]">
        {title}
      </Text>

      {/* Right: Plans */}
      <Pressable onPress={onPressRight} hitSlop={12}>
        <View className="px-4 h-12 rounded-[999px] bg-paper border-2 border-charcoal items-center justify-center">
          <Text className="text-charcoal text-[12px] font-bold tracking-[4px]">
            PLANS
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
