import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View, Pressable } from "react-native";
import Rectangle5 from "../assets/rectangle-5.svg";
import Interfaceenter from "../assets/interface--enter.svg";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, ParamListBase } from "@react-navigation/native";
import Comercialshop from "../assets/comercialshop.svg";
import Ton from "../assets/ton.svg";
import Vector17 from "../assets/vector17.svg";
import Vector18 from "../assets/vector18.svg";
import Vector19 from "../assets/vector19.svg";
import Vector20 from "../assets/vector20.svg";
import Communicationprofile from "../assets/communication--profile.svg";
import Vector25 from "../assets/vector25.svg";
import Ecommercecreditcard from "../assets/ecommerce--credit-card.svg";
import Communicationcommentdots from "../assets/communication--comment-dots.svg";
import Vector26 from "../assets/vector26.svg";
import Generalheart from "../assets/general--heart.svg";
import Generalnotification from "../assets/general--notification.svg";
import Group17 from "../assets/group-17.svg";
import { FontFamily, Color, FontSize, Border, Gap } from "../GlobalStyles";

const Profile = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <View style={styles.profile}>
      <Rectangle5
        style={[styles.profileChild, styles.tonIconLayout]}
        width={393}
        height={230}
      />
      <Text style={[styles.accountingSettings, styles.profile3Typo]}>
        Accounting Settings
      </Text>
      <View style={[styles.buttonSighout, styles.buttonLayout1]}>
        <Interfaceenter
          style={[styles.interfaceEnter, styles.interfaceEnterPosition]}
          width={24}
          height={24}
        />
        <Text style={[styles.signOut, styles.signOutTypo]}>Sign Out</Text>
      </View>
      <Pressable
        style={[styles.buttonAddress, styles.buttonLayout]}
        onPress={() => navigation.navigate("Address")}
      >
        <Text style={[styles.address, styles.addressTypo]}>Address</Text>
        <Comercialshop
          style={[styles.comercialshopIcon, styles.buttonLayout]}
          width={24}
          height={26}
        />
      </Pressable>
      <Ton
        style={[styles.tonIcon, styles.tonIconLayout]}
        width={393}
        height={553}
      />
      <View style={[styles.botNav, styles.botLayout]}>
        <View style={[styles.botNavChild, styles.botLayout]} />
        <View style={[styles.homeParent, styles.homeParentLayout]}>
          <View style={styles.home}>
            <Vector17 style={styles.vectorIcon} width={23} height={21} />
            <Text style={[styles.home1, styles.home1FlexBox]}>Home</Text>
          </View>
          <View style={styles.deliverParent}>
            <Text style={[styles.deliver, styles.home1FlexBox]}>Deliver</Text>
            <Vector18
              style={[styles.vectorIcon1, styles.vectorIconPosition2]}
              width={19}
              height={16}
            />
          </View>
          <View style={styles.myOrdersParent}>
            <Text style={[styles.myOrders, styles.home1FlexBox]}>
              My Orders
            </Text>
            <Vector19 style={styles.vectorIcon2} width={18} height={20} />
          </View>
          <View style={styles.profile1}>
            <Text style={[styles.profile2, styles.home1FlexBox]}>Profile</Text>
            <Vector20
              style={[styles.vectorIcon3, styles.vectorIconPosition2]}
              width={19}
              height={21}
            />
          </View>
        </View>
      </View>
      <Text style={[styles.profile3, styles.profile3Typo]}>Profile</Text>
      <Pressable
        style={styles.buttonInfo}
        onPress={() => navigation.navigate("MyInformation")}
      >
        <Communicationprofile
          style={[styles.communicationProfile, styles.buttonLayout1]}
          width={27}
          height={24}
        />
        <Text style={[styles.myInformation, styles.signOutTypo]}>
          My Information
        </Text>
        <Vector25
          style={[styles.vectorIcon4, styles.vectorIconLayout]}
          width={5}
          height={10}
        />
      </Pressable>
      <Pressable
        style={[styles.buttonPayment, styles.buttonPaymentLayout]}
        onPress={() => navigation.navigate("Payment")}
      >
        <Ecommercecreditcard
          style={[styles.ecommerceCreditCard, styles.buttonPaymentLayout]}
          width={24}
          height={50}
        />
        <Text style={[styles.payment, styles.signOutTypo]}>{`Payment `}</Text>
        <Vector25
          style={[styles.vectorIcon5, styles.vectorIconPosition]}
          width={5}
          height={10}
        />
      </Pressable>
      <View style={[styles.buttonEmail, styles.homeParentLayout]}>
        <Communicationcommentdots
          style={[styles.communicationCommentDots, styles.homeParentLayout]}
          width={26}
          height={28}
        />
        <Text style={[styles.dormdashgmailcom, styles.vectorIcon7Position]}>
          Dormdash@gmail.com
        </Text>
        <Vector26
          style={[styles.vectorIcon6, styles.vectorIconPosition]}
          width={6}
          height={10}
        />
      </View>
      <Pressable
        style={[styles.buttonFavorites, styles.buttonLayout1]}
        onPress={() => navigation.navigate("Favorites")}
      >
        <Generalheart
          style={[styles.interfaceEnter, styles.interfaceEnterPosition]}
          width={24}
          height={24}
        />
        <Text style={[styles.signOut, styles.signOutTypo]}>Favorites</Text>
        <Vector25
          style={[styles.vectorIcon7, styles.vectorIcon7Position]}
          width={5}
          height={10}
        />
      </Pressable>
      <Pressable
        style={[styles.buttonNotification, styles.buttonLayout]}
        onPress={() => navigation.navigate("Notification1")}
      >
        <Generalnotification
          style={[styles.interfaceEnter, styles.interfaceEnterPosition]}
          width={24}
          height={24}
        />
        <Text style={[styles.address, styles.addressTypo]}>Notifications</Text>
        <Vector25
          style={[styles.vectorIcon8, styles.vectorIconLayout]}
          width={5}
          height={10}
        />
      </Pressable>
      <Group17 style={styles.buttonSettingsIcon} />
      <View style={[styles.personImg, styles.personLayout]}>
        <Text style={[styles.lilyLi, styles.home1FlexBox]}>Lily Li</Text>
        <Image
          style={[styles.personImgChild, styles.personLayout]}
          contentFit="cover"
          source={require("../assets/ellipse-20.png")}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tonIconLayout: {
    width: 393,
    position: "absolute",
  },
  profile3Typo: {
    transform: [
      {
        rotate: "0.3deg",
      },
    ],
    textAlign: "center",
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    color: Color.colorBlack,
    fontSize: FontSize.size_xl,
    position: "absolute",
  },
  buttonLayout1: {
    height: 24,
    position: "absolute",
  },
  interfaceEnterPosition: {
    width: 24,
    left: 0,
    top: 0,
  },
  signOutTypo: {
    fontFamily: FontFamily.interLight,
    fontWeight: "300",
    fontSize: FontSize.size_mini,
    textAlign: "center",
    color: Color.colorBlack,
    position: "absolute",
  },
  buttonLayout: {
    height: 26,
    position: "absolute",
  },
  addressTypo: {
    left: 41,
    fontFamily: FontFamily.interLight,
    fontWeight: "300",
    fontSize: FontSize.size_mini,
    textAlign: "center",
    color: Color.colorBlack,
  },
  botLayout: {
    height: 56,
    width: 393,
    left: 0,
    position: "absolute",
  },
  homeParentLayout: {
    height: 28,
    position: "absolute",
  },
  home1FlexBox: {
    textAlign: "left",
    position: "absolute",
  },
  vectorIconPosition2: {
    width: 19,
    top: 0,
    position: "absolute",
  },
  vectorIconLayout: {
    height: 10,
    width: 5,
  },
  buttonPaymentLayout: {
    height: 50,
    position: "absolute",
  },
  vectorIconPosition: {
    left: 326,
    height: 10,
    position: "absolute",
  },
  vectorIcon7Position: {
    top: 10,
    position: "absolute",
  },
  personLayout: {
    width: 114,
    position: "absolute",
  },
  profileChild: {
    borderRadius: Border.br_8xl,
    left: 0,
    top: 0,
  },
  accountingSettings: {
    top: 561,
    left: 35,
    textAlign: "center",
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
  },
  interfaceEnter: {
    position: "absolute",
    overflow: "hidden",
  },
  signOut: {
    top: 6,
    left: 40,
  },
  buttonSighout: {
    top: 740,
    width: 101,
    left: 28,
  },
  address: {
    top: 8,
    position: "absolute",
  },
  comercialshopIcon: {
    left: 0,
    top: 0,
  },
  buttonAddress: {
    top: 676,
    width: 99,
    left: 28,
  },
  tonIcon: {
    top: 237,
    left: -1,
    borderRadius: Border.br_12xl,
  },
  botNavChild: {
    backgroundColor: Color.colorBurlywood,
    top: 0,
  },
  vectorIcon: {
    left: 3,
    top: 0,
    position: "absolute",
  },
  home1: {
    top: 23,
    color: Color.colorWhite,
    textAlign: "left",
    fontSize: FontSize.size_3xs,
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    left: 0,
  },
  home: {
    width: 29,
    height: 35,
  },
  deliver: {
    top: 18,
    color: Color.colorWhite,
    textAlign: "left",
    fontSize: FontSize.size_3xs,
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    left: 0,
  },
  vectorIcon1: {
    left: 10,
  },
  deliverParent: {
    width: 35,
    height: 30,
  },
  myOrders: {
    top: 22,
    color: Color.colorWhite,
    textAlign: "left",
    fontSize: FontSize.size_3xs,
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    left: 0,
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
  profile2: {
    top: 24,
    fontSize: FontSize.size_3xs,
    textAlign: "left",
    color: Color.colorBlack,
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    left: 0,
  },
  vectorIcon3: {
    left: 6,
  },
  profile1: {
    width: 32,
    height: 36,
  },
  homeParent: {
    top: 13,
    left: 56,
    width: 280,
    flexDirection: "row",
    alignItems: "center",
    gap: Gap.gap_md,
  },
  botNav: {
    top: 797,
  },
  profile3: {
    top: 272,
    left: 40,
  },
  communicationProfile: {
    left: 0,
    top: 0,
    overflow: "hidden",
  },
  myInformation: {
    top: 7,
    left: 43,
  },
  vectorIcon4: {
    left: 328,
    top: 12,
    position: "absolute",
  },
  buttonInfo: {
    top: 319,
    left: 26,
    width: 333,
    height: 25,
    position: "absolute",
  },
  ecommerceCreditCard: {
    left: 0,
    top: 0,
    overflow: "hidden",
  },
  payment: {
    top: 19,
    left: 40,
  },
  vectorIcon5: {
    top: 21,
    left: 326,
  },
  buttonPayment: {
    top: 367,
    width: 331,
    left: 28,
  },
  communicationCommentDots: {
    left: 0,
    top: 0,
    overflow: "hidden",
  },
  dormdashgmailcom: {
    left: 41,
    fontFamily: FontFamily.interLight,
    fontWeight: "300",
    fontSize: FontSize.size_mini,
    textAlign: "center",
    color: Color.colorBlack,
  },
  vectorIcon6: {
    top: 14,
  },
  buttonEmail: {
    top: 496,
    left: 27,
    width: 332,
  },
  vectorIcon7: {
    left: 324,
  },
  buttonFavorites: {
    top: 440,
    width: 329,
    left: 28,
  },
  vectorIcon8: {
    left: 325,
    top: 12,
    position: "absolute",
  },
  buttonNotification: {
    top: 618,
    width: 330,
    left: 28,
  },
  buttonSettingsIcon: {
    height: "4.69%",
    width: "10.18%",
    top: "2.46%",
    right: "6.11%",
    bottom: "92.84%",
    left: "83.72%",
    maxWidth: "100%",
    maxHeight: "100%",
    position: "absolute",
    overflow: "hidden",
  },
  lilyLi: {
    top: 131,
    fontWeight: "500",
    fontFamily: FontFamily.interMedium,
    textAlign: "left",
    color: Color.colorBlack,
    fontSize: FontSize.size_xl,
    left: 35,
  },
  personImgChild: {
    height: 117,
    left: 0,
    top: 0,
  },
  personImg: {
    top: 40,
    left: 128,
    height: 155,
  },
  profile: {
    backgroundColor: Color.colorWhite,
    flex: 1,
    width: "100%",
    height: 852,
    overflow: "hidden",
  },
});

export default Profile;
