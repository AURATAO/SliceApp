import { useEffect } from "react";
import { Pressable, Text } from "react-native";

type AnyNav = {
  setOptions: (opts: any) => void;
  navigate: (name: string, params?: any) => void;
};

type LeftMode = "plus" | "none";
type RightMode = "plans" | "plus" | "none";

function PlusCircle({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={12}>
      <Text
        style={{
          width: 40,
          height: 40,

          textAlign: "center",
          textAlignVertical: "center", // Android
          lineHeight: 36, // iOS centering
          color: "#2C2C2C",
          fontSize: 24,
          fontWeight: "900",
        }}
      >
        +
      </Text>
    </Pressable>
  );
}

export function useSliceHeader(
  navigation: AnyNav,
  opts?: { left?: LeftMode; right?: RightMode },
) {
  const left = opts?.left ?? "none";
  const right = opts?.right ?? "none";

  useEffect(() => {
    navigation.setOptions({
      headerBackVisible: false, // ✅ no iOS "< SLICE"
      headerShadowVisible: false,
      headerStyle: { backgroundColor: "#E8E2D0" },

      // tappable title → go Today
      headerTitle: () => (
        <Pressable onPress={() => navigation.navigate("Today")} hitSlop={10}>
          <Text style={{ color: "#2C2C2C", fontWeight: "800", fontSize: 16 }}>
            SLICE
          </Text>
        </Pressable>
      ),

      headerLeft:
        left === "plus"
          ? () => <PlusCircle onPress={() => navigation.navigate("Create")} />
          : () => null,

      headerRight:
        right === "plans"
          ? () => (
              <Pressable
                onPress={() => navigation.navigate("Plans")}
                hitSlop={12}
              >
                <Text
                  style={{ color: "#2C2C2C", fontSize: 12, fontWeight: "800" }}
                >
                  PLANS
                </Text>
              </Pressable>
            )
          : right === "plus"
            ? () => <PlusCircle onPress={() => navigation.navigate("Create")} />
            : () => null,
    });
  }, [navigation, left, right]);
}
