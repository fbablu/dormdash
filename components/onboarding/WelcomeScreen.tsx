// app/components/onboarding/WelcomeScreen.tsx
import * as React from "react";
import { Image, StyleSheet, View, Text, Dimensions } from "react-native";
import { CustomSafeAreaView } from "../CustomSafeAreaView";

const { width, height } = Dimensions.get("window");

const WelcomeScreen = () => {
  return (
    <CustomSafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dormdash}>DormDash</Text>
      </View>

      <View style={styles.imagesContainer}>
        <Image
          style={styles.tonIcon}
          resizeMode="cover"
          source={require("../../assets/welcome-restaraunts/ton.png")}
        />

        <Image
          style={styles.commodoreCashIcon}
          resizeMode="cover"
          source={require("../../assets/welcome-restaraunts/commodore-cash.png")}
        />

        <Image
          style={styles.baristaParlorIcon}
          resizeMode="cover"
          source={require("../../assets/welcome-restaraunts/barista-parlor.png")}
        />

        <View style={styles.sarabasBubble}>
          <View style={styles.bubble} />
          <Image
            style={styles.sarabasIcon}
            resizeMode="cover"
            source={require("../../assets/welcome-restaraunts/sarabas.png")}
          />
        </View>

        <Image
          style={styles.grilledCheeserieIcon}
          resizeMode="cover"
          source={require("../../assets/welcome-restaraunts/grilled-cheeserie.png")}
        />

        <Image
          style={styles.hyderabadHouseIcon}
          resizeMode="cover"
          source={require("../../assets/welcome-restaraunts/hyderabad-house.png")}
        />
      </View>

      <View style={styles.welcomeTextContainer}>
        <Text style={styles.deliveryForAll}>
          Delivery for ALL Taste of Nashville Restaurants straight to your dorm.
        </Text>
      </View>
    </CustomSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height * 0.8,
    backgroundColor: "#fff",
  },
  header: {
    height: 120,
    backgroundColor: "#cfae70",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -100,
  },
  dormdash: {
    fontSize: 40,
    fontWeight: "600",
    fontStyle: "italic",
    color: "#000",
    marginTop: 20,
  },
  imagesContainer: {
    flex: 1,
    position: "relative",
  },
  tonIcon: {
    position: "absolute",
    top: 28,
    right: 20,
    width: 191,
    height: 100,
    borderRadius: 31,
  },
  commodoreCashIcon: {
    position: "absolute",
    top: 39,
    left: 15,
    width: 164,
    height: 198,
    borderRadius: 36,
  },
  baristaParlorIcon: {
    position: "absolute",
    top: 139,
    right: 40,
    width: 150,
    height: 163,
    borderRadius: 52,
  },
  sarabasBubble: {
    position: "absolute",
    top: 249,
    left: 19,
    width: 164,
    height: 161,
  },
  bubble: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "#000",
    backgroundColor: "#fff",
  },
  sarabasIcon: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 158,
    height: 150,
    borderRadius: 161,
  },
  grilledCheeserieIcon: {
    position: "absolute",
    top: 313,
    right: 20,
    width: 177,
    height: 88,
    borderRadius: 22,
  },
  hyderabadHouseIcon: {
    position: "absolute",
    top: 449,
    left: 26,
    width: 341,
    height: 109,
    borderRadius: 30,
  },
  welcomeTextContainer: {
    position: "absolute",
    bottom: 100,
    left: 19,
    right: 19,
    backgroundColor: "#cfae70",
    borderRadius: 24,
    borderWidth: 5,
    borderColor: "#000",
    padding: 15,
  },
  deliveryForAll: {
    fontSize: 25,
    fontWeight: "600",
    textAlign: "center",
    color: "#000",
  },
});

export default WelcomeScreen;
