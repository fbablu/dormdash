// app/_layout.tsx
// Contributors: @Fardeen Bablu
// Time spent: 2 hours (ended up having to restart ide and clean cache to remove random tab)

import { Stack } from "expo-router";
import { useEffect } from "react";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import PaymentProvider from "./context/PaymentContext";
import AuthProvider, { useAuth } from "./context/AuthContext";
import OrderProvider from "./context/OrderContext";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoading, isSignedIn } = useAuth();

  useEffect(() => {
    // Hide splash screen once auth state is determined
    const hideSplash = async () => {
      if (!isLoading) {
        await SplashScreen.hideAsync();
      }
    };

    hideSplash();
  }, [isLoading]);

  useEffect(() => {
    // Redirect based on auth state
    if (!isLoading) {
      if (isSignedIn) {
        router.replace("/(tabs)");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [isLoading, isSignedIn]);

  // If still loading, return nothing
  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="restaurant/[id]"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaymentProvider>
        <OrderProvider>
          <RootLayoutNav />
        </OrderProvider>
      </PaymentProvider>
    </AuthProvider>
  );
}
