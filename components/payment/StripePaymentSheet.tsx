// components/payment/StripePaymentSheet.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Color } from "@/GlobalStyles";

interface StripePaymentSheetProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const StripePaymentSheet: React.FC<StripePaymentSheetProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { createPaymentMethod } = useStripe();
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleSaveCard = async () => {
    if (!complete) {
      Alert.alert("Error", "Please enter valid card details");
      return;
    }

    setLoading(true);
    try {
      // Create a payment method with the card details
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: "Card",
        paymentMethodData: {
          billingDetails: {
            name: "Vanderbilt Student",
          },
        },
      });

      if (error) {
        console.error("Error creating payment method:", error);
        Alert.alert("Error", error.message || "Failed to process card");
        onCancel();
        return;
      }

      // Payment method created successfully
      if (paymentMethod) {
        console.log("Payment method created:", paymentMethod.id);

        // Store the payment method ID
        await AsyncStorage.setItem("stripe_customer_id", paymentMethod.id);
        await AsyncStorage.setItem(
          "stripe_card_last4",
          paymentMethod.Card?.last4 || "****",
        );

        Alert.alert("Success", "Card added successfully!");
        onSuccess();
      }
    } catch (error) {
      console.error("Card save error:", error);
      Alert.alert("Error", "There was a problem saving your card");
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Card Information</Text>

      <CardField
        postalCodeEnabled={true}
        placeholders={{
          number: "4242 4242 4242 4242",
        }}
        style={styles.cardFieldContainer}
        cardStyle={{
          backgroundColor: "#FFFFFF",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#E0E0E0",
        }}
        onCardChange={(cardDetails) => {
          setComplete(cardDetails.complete);
        }}
      />

      <TouchableOpacity
        style={[styles.button, !complete && styles.buttonDisabled]}
        onPress={handleSaveCard}
        disabled={loading || !complete}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Save Card</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  cardFieldContainer: {
    height: 50,
    marginVertical: 16,
    width: "100%",
  },
  button: {
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
    width: "100%",
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default StripePaymentSheet;
