import * as React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import Vector27 from "../assets/vector27.svg";
import Vector28 from "../assets/vector28.svg";
import Vector29 from "../assets/vector29.svg";
import Vector30 from "../assets/vector30.svg";
import Vector31 from "../assets/vector31.svg";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, ParamListBase } from "@react-navigation/native";
import Line13 from "../assets/line-13.svg";
import { FontSize, Color, FontFamily, Border, Gap } from "../GlobalStyles";

const Favorites = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <View style={styles.favorites}>
      <View style={[styles.bottomNav, styles.bottomLayout]}>
        <View style={[styles.bottomNav1, styles.bottomLayout]} />
        <View style={styles.groupParent}>
          <View style={styles.deliverParent}>
            <Text style={[styles.deliver, styles.deliverTypo]}>Deliver</Text>
            <Vector27 style={[styles.vectorIcon, styles.vectorIconLayout1]} />
          </View>
          <View style={styles.home}>
            <Vector28 style={[styles.vectorIcon1, styles.vectorIconLayout1]} />
            <Text style={[styles.home1, styles.meTypo1]}>Home</Text>
          </View>
          <View style={styles.myOrdersParent}>
            <Text style={[styles.myOrders, styles.deliverTypo]}>My Orders</Text>
            <Vector29 style={styles.vectorIcon2} width={18} height={20} />
          </View>
          <View style={styles.profile}>
            <Text style={[styles.me, styles.meTypo]}> Me</Text>
            <Vector30 style={[styles.vectorIcon3, styles.vectorIconLayout1]} />
          </View>
        </View>
      </View>
      <Text style={[styles.savedStores, styles.meTypo]}>Saved Stores</Text>
      <View style={[styles.store1, styles.storeLayout]}>
        <Text style={styles.banhMi}>{`Banh Mi & Roll
`}</Text>
        <Text style={styles.min2Delivery}>{`4.1★ (200+)• 10 min
$2 Delivery min`}</Text>
        <Image
          style={styles.imageIcon}
          contentFit="cover"
          source={require("../assets/image.png")}
        />
        <Vector31 style={[styles.vectorIcon4, styles.vectorIconLayout]} />
      </View>
      <Image
        style={[styles.imageIcon1, styles.imageIconLayout]}
        contentFit="cover"
        source={require("../assets/image1.png")}
      />
      <Text style={[styles.sunFork, styles.sunLayout]}>{`Sun & Fork
`}</Text>
      <Text
        style={[styles.min5Delivery, styles.min5Layout]}
      >{`4.5★ (400+)• 15 min
$5 Delivery min`}</Text>
      <View style={[styles.store2, styles.store2Position]}>
        <Image
          style={[styles.imageIcon2, styles.imageIconLayout]}
          contentFit="cover"
          source={require("../assets/image1.png")}
        />
        <Text style={[styles.sunFork1, styles.sunFork1Position]}>{`Sun & Fork
`}</Text>
        <Text
          style={[styles.min5Delivery1, styles.sunFork1Position]}
        >{`4.5★ (400+)• 15 min
$5 Delivery min`}</Text>
        <Vector31 style={[styles.vectorIcon5, styles.vectorIconLayout]} />
      </View>
      <Pressable
        style={styles.backButton}
        onPress={() => navigation.navigate("Profile")}
      >
        <Line13 style={[styles.backButtonChild, styles.vectorIconLayout1]} />
        <View style={styles.backButtonItem} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomLayout: {
    height: 71,
    width: 418,
    position: "absolute",
  },
  deliverTypo: {
    textAlign: "left",
    fontSize: FontSize.size_3xs,
    color: Color.colorWhite,
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    left: 0,
    position: "absolute",
  },
  vectorIconLayout1: {
    maxHeight: "100%",
    maxWidth: "100%",
    top: "0%",
    position: "absolute",
    overflow: "hidden",
  },
  meTypo1: {
    left: "0%",
    textAlign: "left",
    fontSize: FontSize.size_3xs,
  },
  meTypo: {
    color: Color.colorBlack,
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    position: "absolute",
  },
  storeLayout: {
    width: 320,
    position: "absolute",
  },
  vectorIconLayout: {
    width: "8.13%",
    maxHeight: "100%",
    maxWidth: "100%",
    position: "absolute",
    overflow: "hidden",
  },
  imageIconLayout: {
    height: 206,
    borderRadius: Border.br_3xs,
    width: 320,
    position: "absolute",
  },
  sunLayout: {
    width: 180,
    height: 31,
    fontSize: FontSize.size_xs,
    color: Color.colorBlack,
  },
  min5Layout: {
    width: 314,
    color: Color.colorGray_200,
    fontSize: FontSize.size_5xs,
    height: 30,
  },
  store2Position: {
    top: 449,
    left: 33,
  },
  sunFork1Position: {
    left: 4,
    fontFamily: FontFamily.interRegular,
    textAlign: "left",
    position: "absolute",
  },
  bottomNav1: {
    backgroundColor: Color.colorBurlywood,
    left: 0,
    top: 0,
  },
  deliver: {
    top: 18,
  },
  vectorIcon: {
    height: "53.33%",
    width: "54.29%",
    right: "17.14%",
    bottom: "46.67%",
    left: "28.57%",
  },
  deliverParent: {
    width: 35,
    height: 30,
  },
  vectorIcon1: {
    height: "58.57%",
    width: "80.34%",
    right: "9.31%",
    bottom: "41.43%",
    left: "10.34%",
  },
  home1: {
    top: "65.71%",
    color: Color.colorWhite,
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    left: "0%",
    position: "absolute",
  },
  home: {
    width: 29,
    height: 35,
  },
  myOrders: {
    top: 22,
  },
  vectorIcon2: {
    left: 17,
    top: 0,
    position: "absolute",
  },
  myOrdersParent: {
    width: 52,
    height: 34,
  },
  me: {
    top: "66.67%",
    left: "0%",
    textAlign: "left",
    fontSize: FontSize.size_3xs,
  },
  vectorIcon3: {
    height: "58.33%",
    width: "76%",
    right: "0%",
    bottom: "41.67%",
    left: "24%",
  },
  profile: {
    width: 25,
    height: 36,
  },
  groupParent: {
    top: 11,
    left: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: Gap.gap_md,
    position: "absolute",
  },
  bottomNav: {
    top: 788,
    left: -9,
  },
  savedStores: {
    top: 56,
    left: 86,
    fontSize: FontSize.size_11xl,
    textAlign: "center",
    width: 213,
    height: 34,
  },
  banhMi: {
    top: 223,
    width: 179,
    height: 33,
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.size_xs,
    left: 7,
    color: Color.colorBlack,
    textAlign: "left",
    position: "absolute",
  },
  min2Delivery: {
    top: 263,
    width: 313,
    height: 31,
    color: Color.colorGray_200,
    fontSize: FontSize.size_5xs,
    fontFamily: FontFamily.interRegular,
    left: 7,
    textAlign: "left",
    position: "absolute",
  },
  imageIcon: {
    height: 216,
    borderRadius: Border.br_3xs,
    width: 320,
    left: 0,
    top: 0,
    position: "absolute",
  },
  vectorIcon4: {
    height: "7.82%",
    top: "78.91%",
    right: "2.19%",
    bottom: "13.27%",
    left: "89.69%",
  },
  store1: {
    top: 116,
    height: 294,
    left: 33,
    width: 320,
  },
  imageIcon1: {
    top: 449,
    left: 33,
  },
  sunFork: {
    top: 667,
    left: 37,
    fontFamily: FontFamily.interRegular,
    textAlign: "left",
    position: "absolute",
  },
  min5Delivery: {
    top: 698,
    left: 37,
    fontFamily: FontFamily.interRegular,
    textAlign: "left",
    position: "absolute",
  },
  imageIcon2: {
    left: 0,
    top: 0,
  },
  sunFork1: {
    top: 218,
    width: 180,
    height: 31,
    fontSize: FontSize.size_xs,
    color: Color.colorBlack,
  },
  min5Delivery1: {
    top: 249,
    width: 314,
    color: Color.colorGray_200,
    fontSize: FontSize.size_5xs,
    height: 30,
  },
  vectorIcon5: {
    height: "8.24%",
    top: "81%",
    right: "0.63%",
    bottom: "10.75%",
    left: "91.25%",
  },
  store2: {
    height: 279,
    width: 320,
    position: "absolute",
  },
  backButtonChild: {
    height: "63.83%",
    width: "61.54%",
    right: "23.08%",
    bottom: "36.17%",
    left: "15.38%",
  },
  backButtonItem: {
    top: 13,
    borderRadius: Border.br_8xs,
    backgroundColor: Color.colorGray_400,
    width: 39,
    height: 34,
    left: 0,
    position: "absolute",
  },
  backButton: {
    height: "5.52%",
    width: "9.92%",
    top: "5.05%",
    right: "81.68%",
    bottom: "89.44%",
    left: "8.4%",
    position: "absolute",
  },
  favorites: {
    backgroundColor: Color.colorWhite,
    flex: 1,
    width: "100%",
    height: 852,
    overflow: "hidden",
  },
});

export default Favorites;
