// app/_layout.tsx
// Contributors: @Fardeen Bablu
// Time spent: 10 minutes

import { Stack } from "expo-router";
import { useEffect } from "react";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { PaymentProvider } from "./context/PaymentContext";

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    router.replace("/onboarding");
  }, []);

  return (
    <PaymentProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PaymentProvider>
  );
}
