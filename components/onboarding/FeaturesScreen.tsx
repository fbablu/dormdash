// app/components/onboarding/FeaturesScreen.tsx
// Contributors: @Fardeen Bablu
// Time spent: 1 hour

import React from "react";
import { View, Text, StyleSheet, Dimensions, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { CustomSafeAreaView } from "../CustomSafeAreaView";

const { width, height } = Dimensions.get("window");

const FeaturesScreen = () => {
  return (
    <CustomSafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          style={styles.dormdashIcon}
          resizeMode="contain"
          source={require("../../assets/icons/splash-icon-light.png")}
        />
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        {/* Row 1: Order */}
        <View style={styles.row}>
          <View style={styles.leftContent}>
            <Image
              style={styles.stepIcons}
              resizeMode="contain"
              source={require("../../assets/feature-onboarding/step-1.png")}
            />
          </View>
          <View style={styles.rightContent}>
            <Text style={styles.stepTitle}>Order from your faves</Text>
            <Text style={styles.stepDescription}>
              Select from Taste of Nashville participating restaurants.
            </Text>
          </View>
        </View>

        {/* Row 2: Track */}
        <View style={styles.row}>
          <View style={styles.leftContent}>
            <Text style={styles.stepTitle}>Track delivery</Text>
            <Text style={styles.stepDescription}>
              Deliveries made by registered Vandy students.
            </Text>
          </View>
          <View style={styles.rightContent}>
            <View style={styles.rightContent}>
              <Image
                style={styles.stepIcons}
                resizeMode="contain"
                source={require("../../assets/feature-onboarding/step-2.png")}
              />
            </View>
          </View>
        </View>

        {/* Row 3: Enjoy */}
        <View style={styles.row}>
          <View style={styles.leftContent}>
            <View style={styles.leftContent}>
              <Image
                style={styles.stepIcons}
                resizeMode="contain"
                source={require("../../assets/feature-onboarding/step-3.png")}
              />
            </View>
          </View>

          <View style={styles.rightContent}>
            <Text style={styles.stepTitle}>Enjoy direct room service</Text>
            <Text style={styles.stepDescription}>
              Security and convenience straight to your door.
            </Text>
          </View>
        </View>
      </View>
    </CustomSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height * 0.8,
    backgroundColor: "#cfae70",
  },
  header: {
    height: 130,
    backgroundColor: "#cfae70",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -120,
  },
  dormdashIcon: {
    position: "relative",
    marginTop: 10,
    width: 100,
    height: 100,
    bottom: -25,
  },

  stepIcons: {
    position: "relative",
    marginTop: -40,
    marginLeft: -30,
    width: 200,
    height: 200,
    bottom: -25,
  },

  content: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: height * 0.01,
    justifyContent: "space-evenly",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },
  leftContent: {
    flex: 1,
    paddingRight: 10,
  },
  rightContent: {
    flex: 1,
    paddingLeft: 10,
  },

  trackingContainer: {
    backgroundColor: "#cfae70",
  },

  stepTitle: {
    fontSize: 29,
    fontWeight: "600",
    marginBottom: 8,
  },

  stepDescription: {
    fontSize: 20,
    color: "#fff",
    lineHeight: 22,
  },
});

export default FeaturesScreen;
