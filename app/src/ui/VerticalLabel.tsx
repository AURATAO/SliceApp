import React from "react";
import { Text, View } from "react-native";

export function VerticalLabel({ text }: { text: string }) {
  return (
    <View className="absolute -left-5 top-16">
      <Text className="-rotate-90 text-charcoal text-[11px] tracking-[5px] font-bold">
        {text.toUpperCase()}
      </Text>
    </View>
  );
}
