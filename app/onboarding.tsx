// app/onboarding.tsx
// Contributors: @Fardeen Bablu
// Time spent: 2 hour

import { View, StyleSheet, Dimensions } from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import { SafeAreaView } from "react-native-safe-area-context";
import WelcomeScreen from "@/components/onboarding/WelcomeScreen";
import FeaturesScreen from "@/components/onboarding/FeaturesScreen";
import RegisterScreen from "@/components/onboarding/RegisterScreen";

const { width, height } = Dimensions.get("window");

const OnboardingScreen = () => {
  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <View style={styles.onboardingWrapper}>
        <Onboarding
          showSkip={false}
          showNext={true}
          showDone={false}
          containerStyles={styles.onboardingContainer}
          imageContainerStyles={{ paddingBottom: 0 }}
          bottomBarColor="#cfae70"
          controlStatusBar={false}
          bottomBarHeight={140}
          pages={[
            {
              backgroundColor: "#fff",
              image: <WelcomeScreen />,
              title: "",
              subtitle: "",
            },
            {
              backgroundColor: "#fff",
              image: <FeaturesScreen />,
              title: "",
              subtitle: "",
            },
            {
              backgroundColor: "#fff",
              image: <RegisterScreen />,
              title: "",
              subtitle: "",
            },
          ]}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  onboardingWrapper: {
    flex: 1,
    marginBottom: -40,
  },
  onboardingContainer: {
    width: width,
    height: height * 1.2,
  },
});

export default OnboardingScreen;
