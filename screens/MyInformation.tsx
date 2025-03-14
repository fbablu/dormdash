import * as React from "react";
import { Text, StyleSheet, View, Pressable } from "react-native";
import { Image } from "expo-image";
import Vector25 from "../assets/vector25.svg";
import Line2 from "../assets/line-2.svg";
import Ellipse261 from "../assets/ellipse-261.svg";
import Ellipse27 from "../assets/ellipse-27.svg";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, ParamListBase } from "@react-navigation/native";
import Line5 from "../assets/line-5.svg";
import { FontFamily, FontSize, Color, Border } from "../GlobalStyles";

const MyInformation = () => {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  return (
    <View style={styles.myInformation}>
      <Text
        style={[styles.myInformation1, styles.myInformation1Typo]}
      >{`My Information `}</Text>
      <Text
        style={[styles.yourNameVanderbiltContainer, styles.myInformation1Typo]}
      >
        <Text style={styles.yourNameVanderbiltEma}>{`Your Name






Vanderbilt Email





Password





Phone Number `}</Text>
        <Text style={styles.text}>{` `}</Text>
        <Text style={styles.text1}>{`   

    `}</Text>
      </Text>
      <Text style={styles.deleteAccount}>Delete Account</Text>
      <Vector25
        style={[styles.vectorIcon, styles.vectorIconLayout]}
        width={5}
        height={10}
      />
      <Line2
        style={[styles.myInformationChild, styles.informationLayout]}
        width={363}
        height={1}
      />
      <Vector25
        style={[styles.vectorIcon1, styles.vectorIconLayout]}
        width={5}
        height={10}
      />
      <Line2
        style={[styles.myInformationItem, styles.informationLayout]}
        width={363}
        height={1}
      />
      <Vector25
        style={[styles.vectorIcon2, styles.vectorIconLayout]}
        width={5}
        height={10}
      />
      <Line2
        style={[styles.myInformationInner, styles.informationLayout]}
        width={363}
        height={1}
      />
      <Vector25
        style={[styles.vectorIcon3, styles.vectorIconLayout]}
        width={5}
        height={10}
      />
      <Text style={[styles.lilyLi, styles.xxxxTypo]}>Lily Li</Text>
      <Text style={[styles.yueninglivanderbiltedu, styles.xxxxTypo]}>
        yuening.li@vanderbilt.edu
      </Text>
      <Ellipse261 style={styles.ellipseIcon} width={15} height={8} />
      <Ellipse27
        style={[styles.myInformationChild1, styles.informationChildLayout]}
        width={10}
        height={10}
      />
      <Ellipse27
        style={[styles.myInformationChild2, styles.informationChildLayout]}
        width={10}
        height={10}
      />
      <Ellipse27
        style={[styles.myInformationChild3, styles.informationChildLayout]}
        width={10}
        height={10}
      />
      <Ellipse27
        style={[styles.myInformationChild4, styles.informationChildLayout]}
        width={10}
        height={10}
      />
      <Ellipse27
        style={[styles.myInformationChild5, styles.informationChildLayout]}
        width={10}
        height={10}
      />
      <Ellipse27
        style={[styles.myInformationChild6, styles.informationChildLayout]}
        width={10}
        height={10}
      />
      <Ellipse27
        style={[styles.myInformationChild7, styles.informationChildLayout]}
        width={10}
        height={10}
      />
      <Ellipse27
        style={[styles.myInformationChild8, styles.informationChildLayout]}
        width={10}
        height={10}
      />
      <View style={styles.lineView} />
      <Text style={[styles.xxxx, styles.xxxxTypo]}>857-472-xxxx</Text>
      <Pressable
        style={[styles.backButton, styles.backLayout]}
        onPress={() => navigation.navigate("Profile")}
      >
        <View style={[styles.backButtonChild, styles.backLayout]} />
        <Line5 style={styles.backButtonItem} />
      </Pressable>
      <Line2
        style={[styles.lineIcon, styles.informationLayout]}
        width={363}
        height={1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  myInformation1Typo: {
    textAlign: "left",
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    position: "absolute",
  },
  vectorIconLayout: {
    height: 10,
    width: 5,
    position: "absolute",
  },
  informationLayout: {
    height: 1,
    width: 363,
    position: "absolute",
  },
  xxxxTypo: {
    textAlign: "center",
    fontSize: FontSize.size_xl,
    fontFamily: FontFamily.interRegular,
    color: Color.colorBlack,
    position: "absolute",
  },
  informationChildLayout: {
    width: 10,
    top: 425,
    height: 10,
    position: "absolute",
  },
  backLayout: {
    width: 39,
    position: "absolute",
  },
  myInformation1: {
    top: 54,
    left: 85,
    fontSize: FontSize.size_11xl,
    color: Color.colorBlack,
  },
  yourNameVanderbiltEma: {
    color: Color.colorGray_100,
  },
  text: {
    color: Color.colorDarkslategray,
  },
  text1: {
    color: Color.colorBlack,
  },
  yourNameVanderbiltContainer: {
    top: 115,
    fontSize: 16,
    left: 30,
  },
  deleteAccount: {
    top: 784,
    left: 154,
    fontSize: FontSize.size_3xs,
    textDecoration: "underline",
    fontFamily: FontFamily.interRegular,
    textAlign: "left",
    color: Color.colorBlack,
    position: "absolute",
  },
  vectorIcon: {
    top: 185,
    left: 353,
  },
  myInformationChild: {
    top: 325,
    left: 30,
  },
  vectorIcon1: {
    top: 304,
    left: 353,
  },
  myInformationItem: {
    top: 445,
    left: 30,
  },
  vectorIcon2: {
    top: 423,
    left: 355,
  },
  myInformationInner: {
    top: 575,
    left: 30,
  },
  vectorIcon3: {
    top: 550,
    left: 353,
  },
  lilyLi: {
    top: 176,
    left: 30,
  },
  yueninglivanderbiltedu: {
    top: 295,
    left: 30,
  },
  ellipseIcon: {
    top: 416,
    left: 39,
    position: "absolute",
  },
  myInformationChild1: {
    left: 32,
  },
  myInformationChild2: {
    left: 52,
  },
  myInformationChild3: {
    left: 72,
  },
  myInformationChild4: {
    left: 90,
  },
  myInformationChild5: {
    left: 107,
  },
  myInformationChild6: {
    left: 124,
  },
  myInformationChild7: {
    left: 142,
  },
  myInformationChild8: {
    left: 160,
  },
  lineView: {
    top: 104,
    left: -1,
    borderStyle: "solid",
    borderColor: Color.colorGainsboro,
    borderTopWidth: 2,
    width: 395,
    height: 2,
    position: "absolute",
  },
  xxxx: {
    top: 545,
    left: 32,
  },
  backButtonChild: {
    top: 13,
    left: 0,
    borderRadius: Border.br_8xs,
    backgroundColor: Color.colorGray_400,
    height: 34,
  },
  backButtonItem: {
    height: "64.18%",
    width: "61.79%",
    top: "0%",
    right: "18.46%",
    bottom: "35.82%",
    left: "19.74%",
    maxWidth: "100%",
    maxHeight: "100%",
    position: "absolute",
    overflow: "hidden",
  },
  backButton: {
    top: 42,
    left: 26,
    height: 47,
  },
  lineIcon: {
    top: 209,
    left: 29,
  },
  myInformation: {
    backgroundColor: Color.colorWhite,
    flex: 1,
    width: "100%",
    height: 852,
    overflow: "hidden",
  },
});

export default MyInformation;
