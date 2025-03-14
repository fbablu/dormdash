import * as React from "react";
import { Text, StyleSheet, View, Pressable } from "react-native";
import { Image } from "expo-image";
import Rectangle18 from "../assets/rectangle-18.svg";
import Generallocationpin from "../assets/general--location-pin.svg";
import Generaledit from "../assets/general--edit.svg";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, ParamListBase } from "@react-navigation/native";
import Line12 from "../assets/line-12.svg";
import { Color, FontFamily, FontSize, Border } from "../GlobalStyles";

const Address = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <View style={styles.address}>
      <Text style={[styles.addresses, styles.addressesLayout]}>Addresses</Text>
      <View style={[styles.addressChild, styles.addressBorder]} />
      <Text
        style={[styles.exploreNearbySavedContainer, styles.searchForAnTypo]}
      >
        <Text style={styles.exploreNearbySavedAdd}>{`
Explore Nearby






Saved Addresses

 `}</Text>
        <Text style={styles.text}>{` `}</Text>
        <Text style={styles.text1}>{`   

    `}</Text>
      </Text>
      <View style={[styles.addressItem, styles.addressBorder]} />
      <Text style={[styles.useCurrentLocation, styles.westEndAveTypo]}>
        Use Current location
      </Text>
      <Text style={[styles.westEndAve, styles.westEndAveTypo]}>
        2401 West End Ave, Nashville, TN 37203, USA
      </Text>
      <Rectangle18 style={styles.addressInner} width={353} height={37} />
      <Image
        style={styles.interfaceEditPin3PinPushIcon}
        contentFit="cover"
        source={require("../assets/interfaceeditpin3pinpushthumbtack.png")}
      />
      <Text style={[styles.searchForAn, styles.searchForAnTypo]}>
        Search for an address
      </Text>
      <Image
        style={styles.interfaceCursor}
        contentFit="cover"
        source={require("../assets/interface--cursor.png")}
      />
      <Generallocationpin
        style={[styles.generalLocationPin, styles.generalPosition]}
        width={24}
        height={24}
      />
      <Generaledit
        style={[styles.generalEdit, styles.generalPosition]}
        width={24}
        height={24}
      />
      <Pressable
        style={styles.backButton}
        onPress={() => navigation.navigate("Profile")}
      >
        <Line12 style={styles.backButtonChild} />
        <Pressable
          style={[styles.backButtonItem, styles.addressesLayout]}
          onPress={() => navigation.navigate("Profile")}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  addressesLayout: {
    height: 34,
    position: "absolute",
  },
  addressBorder: {
    height: 2,
    borderTopWidth: 2,
    borderColor: Color.colorGainsboro,
    borderStyle: "solid",
    position: "absolute",
  },
  searchForAnTypo: {
    textAlign: "left",
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    position: "absolute",
  },
  westEndAveTypo: {
    fontFamily: FontFamily.interRegular,
    textAlign: "center",
    color: Color.colorBlack,
    position: "absolute",
  },
  generalPosition: {
    height: 24,
    width: 24,
    marginTop: 34,
    left: "50%",
    top: "50%",
    position: "absolute",
    overflow: "hidden",
  },
  addresses: {
    top: 73,
    left: 119,
    fontSize: FontSize.size_11xl,
    width: 160,
    textAlign: "center",
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    height: 34,
    color: Color.colorBlack,
  },
  addressChild: {
    top: 118,
    left: -1,
    width: 395,
  },
  exploreNearbySavedAdd: {
    color: Color.colorDarkslategray,
  },
  text: {
    color: Color.colorGray_300,
  },
  text1: {
    color: Color.colorBlack,
  },
  exploreNearbySavedContainer: {
    top: 210,
    left: 28,
    fontSize: FontSize.size_xl,
    width: 331,
    height: 467,
  },
  addressItem: {
    top: 357,
    left: 71,
    width: 329,
  },
  useCurrentLocation: {
    top: 303,
    left: 41,
    width: 195,
    height: 16,
    fontSize: FontSize.size_sm,
  },
  westEndAve: {
    top: 470,
    left: -13,
    fontSize: FontSize.size_xs,
    width: 419,
    height: 14,
  },
  addressInner: {
    top: 131,
    left: 26,
    borderRadius: 26,
    position: "absolute",
  },
  interfaceEditPin3PinPushIcon: {
    top: 138,
    left: 43,
    height: 23,
    width: 26,
    position: "absolute",
    overflow: "hidden",
  },
  searchForAn: {
    top: 141,
    left: 72,
    color: Color.colorGray_200,
    fontSize: FontSize.size_sm,
  },
  interfaceCursor: {
    marginTop: -137,
    marginLeft: -173.5,
    height: 25,
    left: "50%",
    top: "50%",
    width: 26,
    position: "absolute",
    overflow: "hidden",
  },
  generalLocationPin: {
    marginLeft: -167.5,
  },
  generalEdit: {
    marginLeft: 142.5,
  },
  backButtonChild: {
    height: "58.54%",
    width: "61.54%",
    top: "0%",
    right: "17.95%",
    bottom: "41.46%",
    left: "20.51%",
    maxWidth: "100%",
    maxHeight: "100%",
    position: "absolute",
    overflow: "hidden",
  },
  backButtonItem: {
    top: 7,
    left: 0,
    borderRadius: Border.br_8xs,
    backgroundColor: Color.colorGray_400,
    width: 39,
  },
  backButton: {
    height: "4.81%",
    width: "9.92%",
    top: "7.75%",
    right: "80.92%",
    bottom: "87.44%",
    left: "9.16%",
    position: "absolute",
  },
  address: {
    backgroundColor: Color.colorWhite,
    flex: 1,
    width: "100%",
    height: 852,
    overflow: "hidden",
  },
});

export default Address;
