// app/onboarding.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { router } from 'expo-router';

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
    <Onboarding
      onDone={() => router.replace('/(tabs)')}
      onSkip={() => router.replace('/(tabs)')}
      NextButtonComponent={NextButton}
      DoneButtonComponent={DoneButton}
      pages={[
        {
          backgroundColor: '#fff',
          image: <View />,
          title: 'Welcome',
          subtitle: 'Text 1',
        },
        {
          backgroundColor: '#fff',
          image: <View />,
          title: 'Features',
          subtitle: 'Text 2',
        },
        {
          backgroundColor: '#fff',
          image: <View />,
          title: 'Get Started',
          subtitle: 'Text 3',
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  googleButton: {
    backgroundColor: '#4285f4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;