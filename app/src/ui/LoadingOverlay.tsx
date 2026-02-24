import React from "react";
import { Modal, View, Text } from "react-native";
import { SliceSpinner } from "./SliceSpinner";

type Props = {
  visible: boolean;
  label?: string;
};

export default function LoadingOverlay({ visible, label }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-[320px] border-2 border-charcoal rounded-[16px] bg-paper p-5 items-center">
          <SliceSpinner size={88} />
          {label ? (
            <Text className="mt-4 text-charcoal font-bold tracking-[2px] text-[12px] text-center">
              {label}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
