// app/onboarding.tsx
// Contributors: @Fardeen Bablu
// Time spent: 1 hour

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
import RegisterScreen from "@/components/onboarding/RegisterScreen";
import { Feather } from "@expo/vector-icons";
import { Color } from "@/GlobalStyles";
import { DoneButtonProps } from "react-native-onboarding-swiper";

const { width, height } = Dimensions.get("window");

// Custom Done Button with options for Email or Google Sign-In
const AuthOptions = ({ onPress }: DoneButtonProps) => (
  <View style={styles.authOptionsContainer}>
    <TouchableOpacity 
      style={[styles.button, styles.emailButton]} 
      onPress={() => router.push('/register')}
    >
      <Feather name="mail" size={20} color="#fff" />
      <Text style={styles.buttonText}>Sign up with Email</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={[styles.button, styles.loginLink]} 
      onPress={() => router.push('/login')}
    >
      <Text style={styles.loginText}>Already have an account? Sign In</Text>
    </TouchableOpacity>
  </View>
);

const OnboardingScreen = () => {
  return (
    <SafeAreaView edges={["left", "right"]} style={styles.container}>
      <View style={styles.onboardingWrapper}>
        <Onboarding
          showSkip={false}
          showNext={true}
          showDone={true}
          containerStyles={styles.onboardingContainer}
          imageContainerStyles={{ paddingBottom: 0 }}
          bottomBarColor="#fff"
          controlStatusBar={false}
          bottomBarHeight={180}
          DoneButtonComponent={AuthOptions}
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
  authOptionsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  emailButton: {
    backgroundColor: Color.colorBurlywood,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  loginLink: {
    backgroundColor: 'transparent',
  },
  loginText: {
    color: "#666",
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});

export default OnboardingScreen;