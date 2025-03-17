// app/_layout.tsx
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
      <Stack.Screen name="restaurant/[id]" 
        options={{
          presentation: 'card',
          animation: 'slide_from_right'
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