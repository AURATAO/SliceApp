import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { CollageCard } from "./CollageCard";

type Tone = "paper" | "teal" | "mustard" | "rust";

export function StateCard({
  tone = "paper",
  title,
  message,
  loading,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  tone?: Tone;
  title: string;
  message?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <CollageCard tone={tone}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-charcoal font-bold tracking-[2px]">
            {title.toUpperCase()}
          </Text>
          {message ? (
            <Text className="text-charcoal opacity-70 mt-2">{message}</Text>
          ) : null}
        </View>
        {loading ? <ActivityIndicator /> : null}
      </View>

      {(actionLabel && onAction) || (secondaryLabel && onSecondary) ? (
        <View className="mt-4 flex-row gap-2">
          {actionLabel && onAction ? (
            <Pressable onPress={onAction} hitSlop={10}>
              <View className="border-2 border-charcoal rounded-[12px] bg-mustard px-4 py-2">
                <Text className="text-charcoal font-bold tracking-[2px] text-[12px]">
                  {actionLabel.toUpperCase()}
                </Text>
              </View>
            </Pressable>
          ) : null}

          {secondaryLabel && onSecondary ? (
            <Pressable onPress={onSecondary} hitSlop={10}>
              <View className="border-2 border-charcoal rounded-[12px] bg-paper px-4 py-2">
                <Text className="text-charcoal font-bold tracking-[2px] text-[12px]">
                  {secondaryLabel.toUpperCase()}
                </Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </CollageCard>
  );
}
