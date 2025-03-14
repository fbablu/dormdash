import * as React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import Vector13 from "../assets/vector13.svg";
import Vector14 from "../assets/vector14.svg";
import Vector15 from "../assets/vector15.svg";
import Vector16 from "../assets/vector16.svg";
import Line41 from "../assets/line-41.svg";
import Line2 from "../assets/line-2.svg";
import Vector7 from "../assets/vector7.svg";
import Vector8 from "../assets/vector8.svg";
import Vector9 from "../assets/vector9.svg";
import Vector10 from "../assets/vector10.svg";
import Vector11 from "../assets/vector11.svg";
import Vector12 from "../assets/vector12.svg";
import Line11 from "../assets/line-11.svg";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, ParamListBase } from "@react-navigation/native";
import { FontFamily, FontSize, Color, Gap, Border } from "../GlobalStyles";

const Notification1 = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <View style={styles.notification}>
      <View style={[styles.bottomNav, styles.bottomLayout]}>
        <View style={[styles.bottomNav1, styles.bottomNav1Position]} />
        <View style={styles.groupParent}>
          <View style={styles.deliverParent}>
            <Text style={[styles.deliver, styles.deliverTypo]}>Deliver</Text>
            <Vector13 style={[styles.vectorIcon, styles.vectorIconLayout1]} />
          </View>
          <View style={styles.home}>
            <Vector14 style={[styles.vectorIcon1, styles.vectorIconLayout1]} />
            <Text style={[styles.home1, styles.meTypo]}>Home</Text>
          </View>
          <View style={styles.myOrdersParent}>
            <Text style={[styles.myOrders, styles.deliverTypo]}>My Orders</Text>
            <Vector15
              style={[styles.vectorIcon2, styles.bottomNav1Position]}
              width={18}
              height={20}
            />
          </View>
          <View style={styles.profile}>
            <Text style={[styles.me, styles.meTypo]}> Me</Text>
            <Vector16 style={[styles.vectorIcon3, styles.vectorIconLayout1]} />
          </View>
        </View>
      </View>
      <Text style={styles.notifications}>{`Notifications `}</Text>
      <Line41 style={styles.notificationChild} width={393} height={1} />
      <Text style={[styles.orderUpdatesStoreContainer, styles.deliverTypo]}>
        <Text style={styles.orderUpdatesStoreOffers}>{`
Order Updates


Store Offers


DormDash Offers


Recommendations


Reminders


Product Updates& News

 `}</Text>
        <Text style={styles.text}>{` `}</Text>
        <Text style={styles.text1}>{`   

    `}</Text>
      </Text>
      <Line2
        style={[styles.notificationItem, styles.notificationChildLayout]}
        width={363}
        height={1}
      />
      <Line2
        style={[styles.notificationInner, styles.notificationChildLayout]}
        width={363}
        height={1}
      />
      <Line2
        style={[styles.lineIcon, styles.notificationChildLayout]}
        width={363}
        height={1}
      />
      <Line2
        style={[styles.notificationChild1, styles.notificationChildLayout]}
        width={363}
        height={1}
      />
      <Line2
        style={[styles.notificationChild2, styles.notificationChildLayout]}
        width={363}
        height={1}
      />
      <Line2
        style={[styles.notificationChild3, styles.notificationChildLayout]}
        width={363}
        height={1}
      />
      <Vector7 style={styles.vectorIcon4} />
      <Vector8 style={[styles.vectorIcon5, styles.vectorIconLayout]} />
      <Vector9 style={[styles.vectorIcon6, styles.vectorIconLayout]} />
      <Vector10 style={[styles.vectorIcon7, styles.vectorIconLayout]} />
      <Vector11 style={[styles.vectorIcon8, styles.vectorIconLayout]} />
      <Vector12 style={[styles.vectorIcon9, styles.vectorIconLayout]} />
      <Text style={[styles.onPushOff, styles.pushTypo]}>
        On: Push; Off: SMS
      </Text>
      <Text style={[styles.onPush, styles.pushTypo]}>On: Push</Text>
      <Text style={[styles.onPush1, styles.pushTypo]}>On: Push</Text>
      <Text style={[styles.onPush2, styles.pushTypo]}>On: Push</Text>
      <Text style={[styles.onPush3, styles.pushTypo]}>On: Push</Text>
      <Text style={[styles.onPush4, styles.pushTypo]}>On: Push</Text>
      <View style={styles.backButton}>
        <Line11 style={[styles.backButtonChild, styles.vectorIconLayout1]} />
        <Pressable
          style={styles.backButtonItem}
          onPress={() => navigation.navigate("Profile")}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomLayout: {
    height: 72,
    width: 427,
  },
  bottomNav1Position: {
    top: 0,
    position: "absolute",
  },
  deliverTypo: {
    textAlign: "left",
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    position: "absolute",
  },
  vectorIconLayout1: {
    maxHeight: "100%",
    maxWidth: "100%",
    top: "0%",
    position: "absolute",
    overflow: "hidden",
  },
  meTypo: {
    left: "0%",
    textAlign: "left",
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    fontSize: FontSize.size_3xs,
    position: "absolute",
  },
  notificationChildLayout: {
    width: 363,
    left: 34,
    height: 1,
    position: "absolute",
  },
  vectorIconLayout: {
    left: "91.83%",
    right: "7%",
    width: "1.17%",
    height: "1.14%",
    maxHeight: "100%",
    maxWidth: "100%",
    position: "absolute",
    overflow: "hidden",
  },
  pushTypo: {
    height: 16,
    width: 195,
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.size_sm,
    textAlign: "center",
    color: Color.colorBlack,
    position: "absolute",
  },
  bottomNav1: {
    backgroundColor: Color.colorBurlywood,
    left: 0,
    height: 72,
    width: 427,
  },
  deliver: {
    top: 18,
    color: Color.colorWhite,
    fontSize: FontSize.size_3xs,
    textAlign: "left",
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    left: 0,
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
  },
  home: {
    width: 29,
    height: 35,
  },
  myOrders: {
    top: 22,
    color: Color.colorWhite,
    fontSize: FontSize.size_3xs,
    textAlign: "left",
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    left: 0,
  },
  vectorIcon2: {
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
    left: 61,
    width: 297,
    height: 37,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: Gap.gap_md,
    position: "absolute",
  },
  bottomNav: {
    top: 787,
    left: -14,
    position: "absolute",
  },
  notifications: {
    top: 62,
    left: 114,
    fontSize: FontSize.size_11xl,
    width: 202,
    textAlign: "center",
    color: Color.colorBlack,
    height: 34,
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    position: "absolute",
  },
  notificationChild: {
    top: 111,
    left: 35,
    position: "absolute",
  },
  orderUpdatesStoreOffers: {
    color: Color.colorDarkslategray,
  },
  text: {
    color: Color.colorGray_300,
  },
  text1: {
    color: Color.colorBlack,
  },
  orderUpdatesStoreContainer: {
    top: 144,
    left: 62,
    fontSize: FontSize.size_xl,
    width: 331,
    height: 467,
  },
  notificationItem: {
    top: 231,
  },
  notificationInner: {
    top: 301,
  },
  lineIcon: {
    top: 371,
  },
  notificationChild1: {
    top: 441,
  },
  notificationChild2: {
    top: 511,
  },
  notificationChild3: {
    top: 581,
  },
  vectorIcon4: {
    top: "23.51%",
    right: "7.25%",
    bottom: "75.35%",
    left: "91.58%",
    width: "1.17%",
    height: "1.14%",
    maxHeight: "100%",
    maxWidth: "100%",
    position: "absolute",
    overflow: "hidden",
  },
  vectorIcon5: {
    top: "31.61%",
    bottom: "67.25%",
  },
  vectorIcon6: {
    top: "39.6%",
    bottom: "59.26%",
  },
  vectorIcon7: {
    top: "47.58%",
    bottom: "51.28%",
  },
  vectorIcon8: {
    top: "55.58%",
    bottom: "43.29%",
  },
  vectorIcon9: {
    top: "63.56%",
    bottom: "35.31%",
  },
  onPushOff: {
    top: 207,
    left: 34,
    width: 195,
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.size_sm,
  },
  onPush: {
    top: 277,
    left: 0,
  },
  onPush1: {
    top: 347,
    left: 0,
  },
  onPush2: {
    top: 417,
    left: 0,
  },
  onPush3: {
    top: 487,
    left: 0,
  },
  onPush4: {
    top: 557,
    left: 0,
  },
  backButtonChild: {
    height: "63.83%",
    width: "56.41%",
    right: "37.18%",
    bottom: "36.17%",
    left: "6.41%",
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
    right: "75.06%",
    bottom: "88.73%",
    left: "15.01%",
    position: "absolute",
  },
  notification: {
    backgroundColor: Color.colorWhite,
    flex: 1,
    width: "100%",
    height: 852,
    overflow: "hidden",
  },
});

export default Notification1;
