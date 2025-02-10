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
            <View style={styles.stepIconContainer}>
              <Text style={styles.stepNumber}>1</Text>
              <Feather name="menu" size={32} color="black" />
            </View>
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
            <View style={[styles.stepIconContainer, styles.trackingContainer]}>
              <Text style={styles.stepNumber}>2</Text>
              <Feather name="map-pin" size={32} color="black" />
            </View>
          </View>
        </View>

        {/* Row 3: Enjoy */}
        <View style={styles.row}>
          <View style={styles.leftContent}>
            <View style={styles.stepIconContainer}>
              <Text style={styles.stepNumber}>3</Text>
              <Feather name="users" size={32} color="black" />
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.05,
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
  stepIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#ffffff",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000000",
  },
  trackingContainer: {
    backgroundColor: "#cfae70",
  },
  stepNumber: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#ffffff",
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: "center",
    lineHeight: 30,
    fontSize: 16,
    fontWeight: "bold",
    borderWidth: 2,
    borderColor: "#000000",
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 40,
  },
});

export default FeaturesScreen;
