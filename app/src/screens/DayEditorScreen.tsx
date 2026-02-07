import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { Screen } from "../ui/Screen";
import { Marks } from "../ui/Marks";
import { StateCard } from "../ui/StateCard";
import { EditablePlanDayCard } from "../ui/EditablePlanDayCard";
import { getPlan } from "../api";

export default function DayEditorScreen({ route, navigation }: any) {
  const { planId, dayNumber } = route.params;

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [plan, setPlan] = React.useState<any>(null);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const data = await getPlan(planId);
      setPlan(data);
    } catch (e: any) {
      setErr(e.message ?? "failed to load");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    navigation.setOptions({ title: "SLICE" });
    load();
  }, [planId]);

  const day = useMemo(() => {
    return (
      plan?.items?.find((d: any) => d.day_number === Number(dayNumber)) ?? null
    );
  }, [plan, dayNumber]);

  if (loading) {
    return (
      <Screen>
        <StateCard
          tone="paper"
          title="Loading"
          message="Opening editor..."
          loading
        />
      </Screen>
    );
  }

  if (err) {
    return (
      <Screen>
        <StateCard
          tone="rust"
          title="Error"
          message={err}
          actionLabel="Retry"
          onAction={load}
        />
      </Screen>
    );
  }

  if (!day) {
    return (
      <Screen>
        <StateCard
          tone="mustard"
          title="Not found"
          message="This slice does not exist."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="relative mb-3">
        <Marks />
        <Text className="text-charcoal text-[24px] font-bold tracking-[2px]">
          EDIT SLICE {day.day_number}
        </Text>
      </View>

      <EditablePlanDayCard
        planId={plan.id}
        day={day}
        tone="teal"
        onSaved={load}
      />
    </Screen>
  );
}
