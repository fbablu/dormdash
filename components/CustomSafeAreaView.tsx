// app/components/CustomSafeAreaView.tsx
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleProp, ViewStyle } from "react-native";

interface CustomSafeAreaViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const CustomSafeAreaView = ({
  children,
  style,
}: CustomSafeAreaViewProps) => (
  <SafeAreaView edges={["top", "left", "right", "bottom"]} style={style}>
    {children}
  </SafeAreaView>
);
