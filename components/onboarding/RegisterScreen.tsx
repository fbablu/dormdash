// components/onboarding/RegisterScreen.tsx
// Contributors: @Fardeen Bablu, @Yuening Li
// Time spent: 2 hour

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { Color } from '@/GlobalStyles';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CustomSafeAreaView } from '../CustomSafeAreaView';

const { width, height } = Dimensions.get('window');

const RegisterScreen = () => {
  return (

    <CustomSafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          style={styles.dormdashIcon}
          resizeMode="contain"
          source={require("../../assets/icons/splash-icon-light.png")}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Register Today</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ordering</Text>
          <View style={styles.listItem}>
            <Feather name="check-circle" size={24} color="black" />
            <Text style={styles.listText}>
              Select from 40+ Taste of Nashville restaurants
            </Text>
          </View>
          <View style={styles.listItem}>
            <Feather name="check-circle" size={24} color="black" />
            <Text style={styles.listText}>
              Direct dorm room service from registered students
            </Text>
          </View>
        </View>

        <View style={[styles.section, styles.whiteSection]}>
          <Text style={styles.sectionTitle}>Delivering</Text>
          <View style={styles.listItem}>
            <Feather name="check-circle" size={24} color="black" />
            <Text style={styles.listText}>
              Earn through PayPal or Commodore Cash
            </Text>
          </View>
          <View style={styles.listItem}>
            <Feather name="check-circle" size={24} color="black" />
            <Text style={styles.listText}>
              Work your own hours on a familiar campus
            </Text>
          </View>
        </View>

        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => router.push('/register')}
          >
            <Feather name="user-plus" size={24} color="white" />
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.tosButton}
            onPress={() => Linking.openURL("https://github.com/fbablu/dormdash/blob/main/TERMS_OF_SERVICE.md")}
          >
            <Text style={styles.tosText}>Questions? View Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </View>
    </CustomSafeAreaView>
  
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: height * 0.8,
    backgroundColor: Color.colorBurlywood,
  },
  header: {
    height: 130,
    backgroundColor: Color.colorBurlywood,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -120,
  },
  dormdashIcon: {
    position: "relative",
    marginTop: 10,
    width: 100,
    height: 100,
    bottom: -25,
  },
  content: {
    flex: 1,
    padding: 20,
    marginTop: -20,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 15,
    color: "black",
  },
  section: {
    backgroundColor: Color.colorBurlywood,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "black",
    padding: 30,
    marginBottom: 15,
  },
  whiteSection: {
    backgroundColor: "white",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  listText: {
    fontSize: 14,
    flex: 1,
  },
  bottomButtons: {
    marginTop: "auto", 
    alignItems: "center",
  },
  signupButton: {
    backgroundColor: "#000",
    flexDirection: "row",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 16,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginLeft: 10,
  },
  loginButton: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  loginButtonText: {
    fontSize: 16,
    color: "black",
    fontWeight: "500",
  },
  tosButton: {
    marginTop: 10,
  },
  tosText: {
    fontSize: 14,
    color: "black",
    textDecorationLine: "underline",
  },
});

export default RegisterScreen;