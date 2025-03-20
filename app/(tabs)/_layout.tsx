// app/(tabs)/_layout.tsx
// Contributors: @Fardeen Bablu
// Time spent: 10 minutes
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "#cfae70",
          height: 71,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="deliver"
        options={{
          title: "Deliver",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Feather name="package" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "My Orders",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Feather name="list" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
