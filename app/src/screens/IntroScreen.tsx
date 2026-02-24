import React, { useMemo, useRef, useState } from "react";
import { View, Text, Dimensions, FlatList, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { GeoIcon } from "../ui/GeoIcon";

const { width } = Dimensions.get("window");

type Slide = {
  key: string;
  tag: string;
  title: string;
  subtitle: string;
  icon: "target" | "grid" | "bolt";
};

export default function IntroScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const slides: Slide[] = useMemo(
    () => [
      {
        key: "s1",
        tag: "CUT",
        title: "Big goal → 7 slices.",
        subtitle: "You don’t need motivation — you need a shape.",
        icon: "target",
      },
      {
        key: "s2",
        tag: "OPS",
        title: "Do 1 = pass.",
        subtitle: "Do 2 = bonus. Do 3 = hero. Bad days still count.",
        icon: "grid",
      },
      {
        key: "s3",
        tag: "MOVE",
        title: "Today shows up first.",
        subtitle: "One slice. One tap. Done.",
        icon: "bolt",
      },
    ],
    [],
  );

  const goNext = () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      navigation.replace("Today");
    }
  };

  return (
    <View className="flex-1 bg-paper">
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 px-6 justify-center">
            <View className="items-center mb-6">
              <GeoIcon variant={item.icon} />
            </View>

            <View className="border-2 border-charcoal rounded-[18px] overflow-hidden">
              <View className="bg-paper p-5">
                <Text className="text-charcoal font-extrabold tracking-[5px] text-[12px] opacity-70">
                  {item.tag}
                </Text>
                <Text className="text-charcoal text-[30px] font-extrabold mt-2">
                  {item.title}
                </Text>
                <Text className="text-charcoal opacity-80 mt-3 text-[16px]">
                  {item.subtitle}
                </Text>

                <View className="mt-5 border-t-2 border-charcoal pt-3 flex-row items-center justify-between">
                  <Text className="text-charcoal opacity-60 tracking-[2px] text-[12px] font-bold">
                    SWIPE →
                  </Text>
                  <Text className="text-charcoal font-extrabold tracking-[2px] text-[12px]">
                    {index + 1}/{slides.length}
                  </Text>
                </View>
              </View>
            </View>

            {/* dots */}
            <View className="flex-row justify-center gap-2 mt-6">
              {slides.map((_, i) => (
                <View
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full border-2 border-charcoal ${
                    i === index ? "bg-mustard" : "bg-paper"
                  }`}
                />
              ))}
            </View>

            {/* button */}
            <Pressable onPress={goNext} className="mt-8 items-center">
              <View className="border-2 border-charcoal rounded-[999px] px-6 py-3 bg-mustard">
                <Text className="text-charcoal font-extrabold tracking-[2px]">
                  {index === slides.length - 1 ? "START" : "NEXT"}
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
