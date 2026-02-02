import React from "react";
import { View } from "react-native";

type Tone = "rust" | "teal" | "mustard" | "paper";

export function CollageCard({
  children,
  tone = "paper",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  const bg =
    tone === "rust"
      ? "bg-rust"
      : tone === "teal"
        ? "bg-teal"
        : tone === "mustard"
          ? "bg-mustard"
          : "bg-paper";

  return (
    <View className={`border-2 border-charcoal rounded-[12px] p-4 ${bg}`}>
      {children}
    </View>
  );
}
