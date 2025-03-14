// app/(tabs)/profile/_layout.tsx
// Contributors: @Fardeen Bablu
// Time spent: 10 minutes

import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Profile",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="favorites"
        options={{
          title: "My Favorites",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="payment"
        options={{
          title: "Payment Methods",
          headerShown: false,
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="address"
        options={{
          title: "Addresses",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="myinfo"
        options={{
          title: "My Information",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
