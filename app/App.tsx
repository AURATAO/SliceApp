import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import TodayScreen from "./src/screens/TodayScreen";
import PlansListScreen from "./src/screens/PlansListScreen";
import CreatePlanScreen from "./src/screens/CreatePlanScreen";
import PlanDetailScreen from "./src/screens/PlanDetailScreen";
import DayEditorScreen from "./src/screens/DayEditorScreen";

import "./global.css";

export type RootStackParamList = {
  Today: undefined;
  Plans: undefined;
  Create: undefined;
  Detail: { id: string };
  DayEditor: { planId: string; dayNumber: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Today">
            <Stack.Screen name="Today" component={TodayScreen} />
            <Stack.Screen name="Plans" component={PlansListScreen} />
            <Stack.Screen
              name="Create"
              component={CreatePlanScreen}
              options={{ title: "Create" }}
            />
            <Stack.Screen
              name="Detail"
              component={PlanDetailScreen}
              options={{ title: "Week" }}
            />
            <Stack.Screen name="DayEditor" component={DayEditorScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
