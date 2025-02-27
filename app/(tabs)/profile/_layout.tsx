import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Profile",
        }}
      />
      <Stack.Screen
        name="favorites"
        options={{
          title: "My Favorites",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
