import React, { useEffect } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { SliceSpinner } from "./SliceSpinner";

export default function LoadingScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const t = setTimeout(() => {
      navigation.replace("Today");
    }, 250);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <SliceSpinner size={88} />
    </View>
  );
}
