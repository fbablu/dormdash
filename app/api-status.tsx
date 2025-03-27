// app/api-status.tsx
import ApiStatusDashboard from "@/components/ApiStatusDashboard";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ApiStatusScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ApiStatusDashboard />
    </SafeAreaView>
  );
}
