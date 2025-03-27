// app/_layout.tsx
// Contributors: @Fardeen Bablu
// Time spent: 2 hours (ended up having to restart ide and clean cache to remove random tab)
import { Stack } from "expo-router";
import { useEffect, memo } from "react";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import PaymentProvider from "./context/PaymentContext";
import AuthProvider, { useAuth } from "./context/AuthContext";
import OrderProvider from "./context/OrderContext";
import RestaurantInitializer from "@/components/RestaurantInitializer";
import { initializeApiStatus } from "@/lib/api/config";

// Prevent auto-hiding once at startup
SplashScreen.preventAutoHideAsync().catch(() => {});

// Memoize the RestaurantInitializer to prevent rerenders
const MemoizedRestaurantInitializer = memo(RestaurantInitializer);

function RootLayoutNav() {
  const { isLoading, isSignedIn } = useAuth();

  // Handle splash screen and API initialization
  useEffect(() => {
    initializeApiStatus();

    if (!isLoading) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [isLoading]);

  // Handle navigation with debounce to prevent loops
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      router.replace(isSignedIn ? "/(tabs)" : "/onboarding");
    }, 50);

    return () => clearTimeout(timer);
  }, [isLoading, isSignedIn]);

  if (isLoading) return null;

  return (
    <>
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
      {isSignedIn && <MemoizedRestaurantInitializer />}
    </>
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
