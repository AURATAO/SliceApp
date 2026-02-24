import React, { useEffect, useRef } from "react";
import { Animated, Easing, ViewStyle } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

type Props = {
  size?: number;
  style?: ViewStyle;
};

export function SliceSpinner({ size = 72, style }: Props) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        { width: size, height: size, transform: [{ rotate: spin }] },
        style,
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 1024 1024" fill="none">
        <Circle cx="512" cy="512" r="400" stroke="black" strokeWidth="35" />
        <Path
          d="M410 380 C 410 380, 600 350, 650 400 C 680 430, 650 480, 630 500 L 440 750 C 430 765, 410 755, 415 740 L 430 650 C 400 660, 380 630, 395 600 L 410 380 Z"
          stroke="black"
          strokeWidth="25"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <Path
          d="M440 550 Q 420 580, 435 610 M 500 480 Q 480 510, 495 540"
          stroke="black"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <Circle cx="550" cy="460" r="35" stroke="black" strokeWidth="15" />
        <Circle cx="500" cy="580" r="25" stroke="black" strokeWidth="15" />
      </Svg>
    </Animated.View>
  );
}
