// app/components/StripePaymentSheet.tsx
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

// Replace with your own publishable key from Stripe Dashboard
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51NXNvIFXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

// Create a mock API endpoint (in a real app, this would be your server)
const API_URL = "https://stripe-server-demo.glitch.me";

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
    // Initialize Stripe
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

  const fetchPaymentSheetParams = async () => {
    try {
      // Call to your backend
      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 1000,
          currency: "usd",
        }),
      });

      const { paymentIntent, ephemeralKey, customer } = await response.json();
      return {
        paymentIntent,
        ephemeralKey,
        customer,
      };
    } catch (error) {
      console.error("Error fetching payment intent:", error);
      // Mock data based on current
      return {
        paymentIntent: "pi_mock_intent",
        ephemeralKey: "ek_mock_key",
        customer: "cus_mock_customer",
      };
    }
  };

  const openPaymentSheet = async () => {
    setLoading(true);
    try {
      // Fetch payment intent
      const { paymentIntent, ephemeralKey, customer } =
        await fetchPaymentSheetParams();

      // Initialize the Payment Sheet
      const initResult = await initPaymentSheet({
        merchantDisplayName: "DormDash",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: "Vanderbilt Student",
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
        if (presentResult.error.code === "Canceled") {
          onCancel();
        } else {
          Alert.alert("Error", presentResult.error.message || "Payment failed");
        }
      } else {
        // Payment successful
        Alert.alert("Success", "Card added successfully!");

        // Save card info for future use (in a real app, store a token or customer ID)
        await AsyncStorage.setItem("stripe_customer_id", customer);

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
