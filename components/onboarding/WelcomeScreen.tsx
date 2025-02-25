// app/components/onboarding/WelcomeScreen.tsx
import * as React from "react";
import { Image, StyleSheet, View, Text, Dimensions } from "react-native";
import { CustomSafeAreaView } from "../CustomSafeAreaView";

const { width, height } = Dimensions.get("window");

const WelcomeScreen = () => {
  return (
    <CustomSafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          style={styles.dormdashIcon}
          resizeMode="contain"
          source={require("../../assets/icons/splash-icon-light.png")}
        />
      </View>

      {/* Grid Layout Container */}

      <View style={styles.gridContainer}>
        {/* Row 1: Commodore Cash (2-column span) */}
        <View style={[styles.gridItem, styles.colSpan2]}>
          <Image
            style={styles.image}
            resizeMode="contain"
            source={require("../../assets/welcome-restaraunts/ton.png")}
          />
        </View>

        {/* Row 2: ToN and Barista (2 equal columns) */}
        <View style={[styles.gridItem, styles.normalGridItem]}>
          <Image
            style={styles.image}
            resizeMode="contain"
            source={require("../../assets/welcome-restaraunts/satay.png")}
          />
        </View>
        <View style={[styles.gridItem, styles.normalGridItem]}>
          <Image
            style={styles.image}
            resizeMode="contain"
            source={require("../../assets/welcome-restaraunts/barista-parlor.png")}
          />
        </View>

        {/* Row 3: Indian and Cheeserie (2 equal columns) */}
        <View style={[styles.gridItem, styles.normalGridItem]}>
          <View style={styles.bubbleContainer}>
            <Image
              style={styles.image}
              resizeMode="contain"
              source={require("../../assets/welcome-restaraunts/sarabas.png")}
            />
          </View>
        </View>
        <View style={[styles.gridItem, styles.normalGridItem]}>
          <Image
            style={styles.image}
            resizeMode="contain"
            source={require("../../assets/welcome-restaraunts/oscars.png")}
          />
        </View>

        {/* Text Container (2-column span) */}
        <View style={[styles.textContainer, styles.colSpan2]}>
          <Text style={styles.deliveryText}>
            Delivery for ALL Taste of Nashville Restaurants straight to your
            dorm.
          </Text>
        </View>
        {/* Row 4: Hyderabad House (2-column span) */}
        <View style={[styles.gridItem, styles.colSpan2]}>
          <Image
            style={styles.image}
            resizeMode="contain"
            source={require("../../assets/welcome-restaraunts/hyderabad-house.png")}
          />
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

  gridContainer: {
    flex: 1,
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignContent: "flex-start",
  },

  gridItem: {
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "white",
    height: 100,
    borderWidth: 5,
    borderColor: "black",
  },

  normalGridItem: {
    flex: 1,
    minWidth: width * 0.42,
  },

  colSpan2: {
    width: "100%",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  bubbleContainer: {
    flex: 1,
    borderRadius: 25,
    padding: 4,
    backgroundColor: "white",
  },

  textContainer: {
    backgroundColor: "#cfae70",
    borderRadius: 25,
    borderWidth: 5,
    borderColor: "black",
    padding: 10,
    marginVertical: 8,
  },

  deliveryText: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    color: "#000",
  },
});

export default WelcomeScreen;
