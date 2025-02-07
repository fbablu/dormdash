// app/components/onboarding/FeaturesScreen.tsx
import * as React from "react";
import { StyleSheet, View, Text, Image } from "react-native";

const FeaturesScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>How It Works</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.featureItem}>
          <Image
            style={styles.icon}
            source={require("../../assets/icons/ios-light.png")}
          />
          <Text style={styles.featureText}>
            Order from your favorite ToN restaurants
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Image
            style={styles.icon}
            source={require("../../assets/icons/ios-light.png")}
          />
          <Text style={styles.featureText}>Pay with Commodore Cash</Text>
        </View>
        <View style={styles.featureItem}>
          <Image
            style={styles.icon}
            source={require("../../assets/icons/ios-light.png")}
          />
          <Text style={styles.featureText}>
            Get it delivered right to your dorm
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#000",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#cfae70",
    padding: 20,
    borderRadius: 15,
    gap: 20,
  },
  icon: {
    width: 50,
    height: 50,
  },
  featureText: {
    fontSize: 18,
    fontWeight: "500",
    flex: 1,
  },
});

export default FeaturesScreen;
