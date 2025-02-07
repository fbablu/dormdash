// app/(tabs)/index.tsx
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    router.replace("/onboarding");
  }, []);

  return (
    <View style={styles.container}>
      <Text>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
