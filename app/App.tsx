import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TodayScreen from "./src/screens/TodayScreen";
import PlansListScreen from "./src/screens/PlansListScreen";
import CreatePlanScreen from "./src/screens/CreatePlanScreen";
import PlanDetailScreen from "./src/screens/PlanDetailScreen";

import "./global.css";

export type RootStackParamList = {
  Today: undefined;
  Plans: undefined;
  Create: undefined;
  Detail: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
