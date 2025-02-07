// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect } from "react";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    router.replace('/onboarding');
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}