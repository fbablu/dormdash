// app/onboarding.tsx
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import { router } from "expo-router";
import WelcomeScreen from "@/components/onboarding/WelcomeScreen";
import FeaturesScreen from "@/components/onboarding/FeaturesScreen";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const NextButton = ({ ...props }) => (
  <TouchableOpacity style={styles.button} {...props}>
    <Text style={styles.buttonText}>Next</Text>
  </TouchableOpacity>
);

const DoneButton = ({ ...props }) => (
  <TouchableOpacity style={[styles.button, styles.googleButton]} {...props}>
    <Text style={styles.buttonText}>Sign in with Google</Text>
  </TouchableOpacity>
);

const OnboardingScreen = () => {
  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <View style={styles.onboardingWrapper}>
        <Onboarding
          onDone={() => router.replace("/(tabs)")}
          showSkip={false}
          showNext={false}
          DoneButtonComponent={DoneButton}
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
              image: <View style={styles.finalImage} />,
              title: "Ready to Start?",
              subtitle: "Sign in with your Vanderbilt email to begin ordering",
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
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    marginBottom: 30,
  },
  googleButton: {
    backgroundColor: "#4285f4",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  finalImage: {
    width: 200,
    height: 200,
    backgroundColor: "#cfae70",
    borderRadius: 100,
  },
});

export default OnboardingScreen;
