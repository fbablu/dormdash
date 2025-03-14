import * as React from "react";
import { Text, StyleSheet, View, Pressable } from "react-native";
import { Image } from "expo-image";
import Vector from "../assets/vector.svg";
import Vector1 from "../assets/vector1.svg";
import Vector2 from "../assets/vector2.svg";
import Ellipse26 from "../assets/ellipse-26.svg";
import Line4 from "../assets/line-4.svg";
import Line2 from "../assets/line-2.svg";
import Vector3 from "../assets/vector3.svg";
import Vector4 from "../assets/vector4.svg";
import Vector5 from "../assets/vector5.svg";
import Vector6 from "../assets/vector6.svg";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, ParamListBase } from "@react-navigation/native";
import Line1 from "../assets/line-1.svg";
import { FontSize, Color, FontFamily, Gap, Border } from "../GlobalStyles";

const Payment = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <View style={styles.payment}>
      <Text style={[styles.payment1, styles.payment1FlexBox]}>Payment</Text>
      <Vector style={[styles.vectorIcon, styles.vectorIconLayout]} />
      <Vector1 style={[styles.vectorIcon1, styles.vectorIconLayout]} />
      <Vector2 style={[styles.vectorIcon2, styles.vectorIconLayout]} />
      <Ellipse26 style={styles.paymentChild} width={15} height={8} />
      <Line4 style={styles.paymentItem} width={423} height={1} />
      <Line2
        style={[styles.paymentInner, styles.paymentLayout]}
        width={363}
        height={1}
      />
      <Text style={styles.commodoreCashPaypalContainer}>
        <Text style={styles.commodoreCash}>{`
Commodore Cash

`}</Text>
        <Text style={styles.text}>{`




`}</Text>
        <Text style={styles.commodoreCash}>{`PayPal
`}</Text>
        <Text style={styles.text}>{`




`}</Text>
        <Text style={styles.commodoreCash}>{`
Stripe
 `}</Text>
        <Text style={styles.text2}>{` `}</Text>
        <Text style={styles.text3}>{`   

    `}</Text>
      </Text>
      <Line2
        style={[styles.lineIcon, styles.paymentLayout]}
        width={363}
        height={1}
      />
      <Line2
        style={[styles.paymentChild1, styles.paymentLayout]}
        width={363}
        height={1}
      />
      <View style={[styles.bottomNav, styles.bottomLayout]}>
        <View style={[styles.bottomNav1, styles.bottomNav1Position]} />
        <View style={[styles.groupParent, styles.payment1FlexBox]}>
          <View style={styles.deliverParent}>
            <Text style={[styles.deliver, styles.deliverTypo]}>Deliver</Text>
            <Vector3 style={[styles.vectorIcon3, styles.vectorIconPosition]} />
          </View>
          <View style={styles.home}>
            <Vector4 style={[styles.vectorIcon4, styles.vectorIconPosition]} />
            <Text style={[styles.home1, styles.meTypo]}>Home</Text>
          </View>
          <View style={styles.myOrdersParent}>
            <Text style={[styles.myOrders, styles.deliverTypo]}>My Orders</Text>
            <Vector5
              style={[styles.vectorIcon5, styles.bottomNav1Position]}
              width={18}
              height={20}
            />
          </View>
          <View style={styles.profile}>
            <Text style={[styles.me, styles.meTypo]}> Me</Text>
            <Vector6 style={[styles.vectorIcon6, styles.vectorIconPosition]} />
          </View>
        </View>
      </View>
      <Pressable
        style={styles.backButton}
        onPress={() => navigation.navigate("Profile")}
      >
        <Line1 style={[styles.backButtonChild, styles.vectorIconPosition]} />
        <View style={styles.backButtonItem} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  payment1FlexBox: {
    alignItems: "center",
    position: "absolute",
  },
  vectorIconLayout: {
    maxHeight: "100%",
    maxWidth: "100%",
    width: "1.2%",
    height: "1.2%",
    position: "absolute",
    overflow: "hidden",
  },
  paymentLayout: {
    width: 363,
    left: 31,
    height: 1,
    position: "absolute",
  },
  bottomLayout: {
    height: 72,
    width: 420,
  },
  bottomNav1Position: {
    top: 0,
    position: "absolute",
  },
  deliverTypo: {
    fontSize: FontSize.size_3xs,
    color: Color.colorWhite,
    textAlign: "left",
    left: 0,
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    position: "absolute",
  },
  vectorIconPosition: {
    top: "0%",
    maxHeight: "100%",
    maxWidth: "100%",
    position: "absolute",
    overflow: "hidden",
  },
  meTypo: {
    left: "0%",
    fontSize: FontSize.size_3xs,
    textAlign: "left",
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    position: "absolute",
  },
  payment1: {
    top: 56,
    left: 100,
    fontSize: FontSize.size_11xl,
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    width: 194,
    height: 47,
    color: Color.colorBlack,
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    alignItems: "center",
  },
  vectorIcon: {
    top: "25.82%",
    bottom: "72.98%",
    left: "87.07%",
    right: "11.73%",
    maxHeight: "100%",
    maxWidth: "100%",
    width: "1.2%",
    height: "1.2%",
  },
  vectorIcon1: {
    top: "46.1%",
    right: "12.47%",
    bottom: "52.7%",
    left: "86.34%",
    maxHeight: "100%",
    maxWidth: "100%",
    width: "1.2%",
    height: "1.2%",
  },
  vectorIcon2: {
    top: "66.4%",
    bottom: "32.41%",
    left: "87.07%",
    right: "11.73%",
    maxHeight: "100%",
    maxWidth: "100%",
    width: "1.2%",
    height: "1.2%",
  },
  paymentChild: {
    top: 458,
    left: 50,
    position: "absolute",
  },
  paymentItem: {
    top: 114,
    left: 0,
    position: "absolute",
  },
  paymentInner: {
    top: 247,
  },
  commodoreCash: {
    color: Color.colorDarkslategray,
  },
  text: {
    color: Color.colorGray_100,
  },
  text2: {
    color: Color.colorGray_300,
  },
  text3: {
    color: Color.colorBlack,
  },
  commodoreCashPaypalContainer: {
    top: 157,
    left: 29,
    fontSize: FontSize.size_xl,
    width: 331,
    height: 467,
    textAlign: "left",
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    position: "absolute",
  },
  lineIcon: {
    top: 417,
  },
  paymentChild1: {
    top: 587,
  },
  bottomNav1: {
    backgroundColor: Color.colorBurlywood,
    height: 72,
    width: 420,
    left: 0,
  },
  deliver: {
    top: 18,
    color: Color.colorWhite,
  },
  vectorIcon3: {
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
  vectorIcon4: {
    height: "58.57%",
    width: "80.34%",
    right: "9.31%",
    bottom: "41.43%",
    left: "10.34%",
  },
  home1: {
    top: "65.71%",
    color: Color.colorWhite,
  },
  home: {
    width: 29,
    height: 35,
  },
  myOrders: {
    top: 22,
    color: Color.colorWhite,
  },
  vectorIcon5: {
    left: 17,
  },
  myOrdersParent: {
    width: 52,
    height: 34,
  },
  me: {
    top: "66.67%",
    color: Color.colorBlack,
  },
  vectorIcon6: {
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
    width: 292,
    height: 37,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Gap.gap_md,
  },
  bottomNav: {
    top: 788,
    left: -14,
    position: "absolute",
  },
  backButtonChild: {
    height: "63.83%",
    width: "61.54%",
    right: "17.95%",
    bottom: "36.17%",
    left: "20.51%",
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
    top: "5.75%",
    right: "83.46%",
    bottom: "88.73%",
    left: "6.62%",
    position: "absolute",
  },
  payment: {
    backgroundColor: Color.colorWhite,
    flex: 1,
    width: "100%",
    height: 852,
    overflow: "hidden",
  },
});

export default Payment;
