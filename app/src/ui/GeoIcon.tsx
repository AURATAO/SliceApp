import React from "react";
import { View, Text } from "react-native";

type Variant = "target" | "grid" | "bolt";

export function GeoIcon({ variant }: { variant: Variant }) {
  if (variant === "target") {
    return (
      <View className="w-[110px] h-[110px] rounded-full border-2 border-charcoal items-center justify-center bg-paper">
        <View className="w-[76px] h-[76px] rounded-full border-2 border-charcoal items-center justify-center bg-mustard">
          <View className="w-[40px] h-[40px] rounded-full border-2 border-charcoal bg-paper" />
        </View>
        <View className="absolute w-2 h-2 rounded-full bg-charcoal" />
      </View>
    );
  }

  if (variant === "grid") {
    return (
      <View className="w-[110px] h-[110px] border-2 border-charcoal bg-teal rounded-[14px] p-3">
        <View className="flex-row justify-between">
          <View className="w-6 h-6 border-2 border-charcoal bg-paper rounded-[6px]" />
          <View className="w-6 h-6 border-2 border-charcoal bg-paper rounded-[6px]" />
          <View className="w-6 h-6 border-2 border-charcoal bg-paper rounded-[6px]" />
        </View>
        <View className="flex-row justify-between mt-3">
          <View className="w-6 h-6 border-2 border-charcoal bg-paper rounded-[6px]" />
          <View className="w-6 h-6 border-2 border-charcoal bg-paper rounded-[6px]" />
          <View className="w-6 h-6 border-2 border-charcoal bg-paper rounded-[6px]" />
        </View>
        <View className="flex-row justify-between mt-3">
          <View className="w-6 h-6 border-2 border-charcoal bg-paper rounded-[6px]" />
          <View className="w-6 h-6 border-2 border-charcoal bg-paper rounded-[6px]" />
          <View className="w-6 h-6 border-2 border-charcoal bg-paper rounded-[6px]" />
        </View>
      </View>
    );
  }

  // bolt
  return (
    <View className="w-[110px] h-[110px] border-2 border-charcoal bg-rust rounded-[14px] items-center justify-center">
      <View className="border-2 border-charcoal bg-paper rounded-[10px] px-4 py-3 -rotate-6">
        <Text className="text-charcoal font-extrabold text-[22px] tracking-[2px]">
          +++
        </Text>
      </View>
      <View className="absolute bottom-3 right-3 w-3 h-3 bg-charcoal rounded-full" />
    </View>
  );
}
