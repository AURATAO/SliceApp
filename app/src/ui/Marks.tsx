import React from "react";
import { Text, View } from "react-native";

export function Marks() {
  return (
    <View className="absolute right-3 top-3 opacity-70">
      <Text className="text-charcoal text-[10px] tracking-[6px]">+ + +</Text>
      <Text className="text-charcoal text-[10px] tracking-[6px]">• • • •</Text>
      <Text className="text-charcoal text-[12px]">⊕</Text>
    </View>
  );
}
