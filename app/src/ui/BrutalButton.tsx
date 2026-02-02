import React from "react";
import { Pressable, Text, View } from "react-native";

export function BrutalButton({
  label,
  onPress,
  tone = "charcoal",
  disabled,
}: {
  label: string;
  onPress: () => void;
  tone?: "charcoal" | "rust" | "teal" | "mustard";
  disabled?: boolean;
}) {
  const bg =
    tone === "rust"
      ? "bg-rust"
      : tone === "teal"
        ? "bg-teal"
        : tone === "mustard"
          ? "bg-mustard"
          : "bg-charcoal";

  const text = tone === "charcoal" ? "text-paper" : "text-charcoal";

  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <View
        className={`border-2 border-charcoal rounded-[12px] px-4 py-3 ${bg} ${disabled ? "opacity-60" : ""}`}
      >
        <Text className={`text-[14px] tracking-[2px] font-bold ${text}`}>
          {label.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}
