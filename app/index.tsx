// lib/api/config.ts
// Contributor: @Fardeen Bablu
// Time spent: 10 mins

import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

export const CustomText = ({ children }: PropsWithChildren) => (
  <Text>{children}</Text>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CustomText;
