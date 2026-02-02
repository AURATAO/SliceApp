import React from "react";
import { Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#E8E2D0" }}>
      <View className="flex-1 px-4 ">
        {/* Optional grain overlay (如果你還沒放 grain.png，就先把這段註解掉) */}
        {/* <Image
          source={require("../../assets/grain.png")}
          resizeMode="repeat"
          className="absolute inset-0 opacity-70"
        /> */}
        {children}
      </View>
    </SafeAreaView>
  );
}
