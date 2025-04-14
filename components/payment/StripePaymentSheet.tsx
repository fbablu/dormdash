// components/payment/StripePaymentSheet.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { initStripe, useStripe } from "@stripe/stripe-react-native";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Color } from "@/GlobalStyles";

// Use a test publishable key - replace with your actual key
const STRIPE_PUBLISHABLE_KEY = "pk_test_TYooMQauvdEDq54NiTphI7jx";

interface StripePaymentSheetProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const StripePaymentSheet: React.FC<StripePaymentSheetProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeStripe();
  }, []);

  const initializeStripe = async () => {
    try {
      await initStripe({
        publishableKey: STRIPE_PUBLISHABLE_KEY,
        merchantIdentifier: "merchant.com.dormdash",
        urlScheme:
          Constants.appOwnership === "expo"
            ? Linking.createURL("/--/")
            : Linking.createURL(""),
      });
    } catch (error) {
      console.error("Failed to initialize Stripe:", error);
      Alert.alert("Error", "Failed to initialize payment system");
    }
  };

  // Since we don't have a real backend, we'll create mock data
  const createMockPaymentIntent = () => {
    // In a real app, this would come from your backend
    return {
      paymentIntent: "pi_" + Math.random().toString(36).substring(2, 15),
      ephemeralKey: "ek_" + Math.random().toString(36).substring(2, 15),
      customer: "cus_" + Math.random().toString(36).substring(2, 15),
    };
  };

  const openPaymentSheet = async () => {
    setLoading(true);
    try {
      // Get mock payment data
      const mockData = createMockPaymentIntent();
      console.log("Using mock payment data:", mockData);

      // Initialize the Payment Sheet
      const initResult = await initPaymentSheet({
        merchantDisplayName: "DormDash",
        customerId: mockData.customer,
        customerEphemeralKeySecret: mockData.ephemeralKey,
        paymentIntentClientSecret: mockData.paymentIntent,
        // In demo mode, always return success
        testEnv: true,
        defaultBillingDetails: {
          name: "Vanderbilt Student",
        },
        // Appearance to match the app's styling
        appearance: {
          colors: {
            primary: Color.colorBurlywood,
          },
        },
      });

      if (initResult.error) {
        console.error("Error initializing payment sheet:", initResult.error);
        Alert.alert("Error", "Failed to initialize payment");
        setLoading(false);
        onCancel();
        return;
      }

      // Present the Payment Sheet
      const presentResult = await presentPaymentSheet();

      if (presentResult.error) {
        console.error("Payment sheet error:", presentResult.error);

        if (presentResult.error.code === "Canceled") {
          onCancel();
        } else {
          Alert.alert("Error", presentResult.error.message || "Payment failed");
        }
      } else {
        // For demo purposes, simulate success
        console.log("Payment success (mocked)");
        Alert.alert("Success", "Card added successfully!");

        // Save card info for future use
        await AsyncStorage.setItem("stripe_customer_id", mockData.customer);

        onSuccess();
      }
    } catch (error) {
      console.error("Payment sheet error:", error);
      Alert.alert("Error", "There was a problem setting up your card");
      onCancel();
    }
    setLoading(false);
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={openPaymentSheet}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.buttonText}>Set Up Card Payment</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default StripePaymentSheet;
