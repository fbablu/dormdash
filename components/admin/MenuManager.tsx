// components/admin/MenuManager.tsx
// Contributor: @Fardeen Bablu
// Time spent: 1 hour

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MenuEditor from "./MenuEditor";

interface MenuManagerProps {
  restaurantId?: string;
  restaurantName?: string;
  onComplete?: () => void;
}

const MenuManager: React.FC<MenuManagerProps> = ({
  restaurantId,
  restaurantName,
  onComplete,
}) => {
  return (
    <View style={styles.container}>
      <MenuEditor
        restaurantId={restaurantId}
        restaurantName={restaurantName}
        onSave={onComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default MenuManager;
