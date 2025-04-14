// app/(tabs)/profile/payment.tsx
// Contributors: @Fardeen Bablu, @Yuening Li
// Time: 4 hours

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePayment, PaymentMethod } from "@/app/context/PaymentContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import StripePaymentSheet from "@/components/payment/StripePaymentSheet";
import { Color } from "@/GlobalStyles";

const PAYMENT_STORAGE_KEY = "dormdash_payment_method";
const STRIPE_PUBLISHABLE_KEY = "pk_test_TYooMQauvdEDq54NiTphI7jx";

const PaymentScreen = () => {
  const { setPaymentMethod } = usePayment();
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMethod>("Commodore Cash");
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [hasStripeCard, setHasStripeCard] = useState(false);

  const paymentOptions: PaymentMethod[] = [
    "Commodore Cash",
    "PayPal",
    "Stripe",
  ];

  // Load saved payment method on mount
  useEffect(() => {
    const loadSavedPayment = async () => {
      try {
        const savedPayment = await AsyncStorage.getItem(PAYMENT_STORAGE_KEY);
        if (
          savedPayment &&
          ["Commodore Cash", "PayPal", "Stripe"].includes(savedPayment)
        ) {
          setSelectedPayment(savedPayment as PaymentMethod);
        }

        // Check if user has a saved Stripe card
        const stripeCustomerId =
          await AsyncStorage.getItem("stripe_customer_id");
        setHasStripeCard(!!stripeCustomerId);
      } catch (error) {
        console.error("Error loading payment method:", error);
      }
    };

    loadSavedPayment();
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  const handlePaymentOptionPress = (option: PaymentMethod) => {
    if (option === "Stripe" && !hasStripeCard) {
      setShowStripeModal(true);
    } else {
      setSelectedPayment(option);
    }
  };

  const handleStripeSuccess = () => {
    setHasStripeCard(true);
    setSelectedPayment("Stripe");
    setShowStripeModal(false);
  };

  const handleStripeCancel = () => {
    setShowStripeModal(false);
  };

  const handleSaveChanges = async () => {
    try {
      await AsyncStorage.setItem(PAYMENT_STORAGE_KEY, selectedPayment);

      // Update the context directly instead of using window events
      setPaymentMethod(selectedPayment);
      router.back();
    } catch (error) {
      console.error("Error saving payment method:", error);
    }
  };

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.heading}>Payment</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {paymentOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.paymentOption}
              onPress={() => handlePaymentOptionPress(option)}
            >
              <View style={styles.optionRow}>
                <View style={styles.paymentMethodIcon}>
                  {option === "Commodore Cash" && (
                    <Text style={styles.paymentIcon}>CC</Text>
                  )}
                  {option === "PayPal" && (
                    <FontAwesome5 name="paypal" size={20} color="#0070BA" />
                  )}
                  {option === "Stripe" && (
                    <FontAwesome5 name="cc-stripe" size={24} color="#635BFF" />
                  )}
                </View>
                <Text style={styles.paymentText}>{option}</Text>
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedPayment === option && styles.radioOuterSelected,
                    ]}
                  >
                    {selectedPayment === option && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </View>
              </View>
              {option === "Stripe" && hasStripeCard && (
                <Text style={styles.cardInfo}>
                  Card ending in **** (Tap to change)
                </Text>
              )}
              <View style={styles.divider} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.addButton}>
            <Feather name="plus-circle" size={20} color="#cfae70" />
            <Text style={styles.addPaymentText}>Add New Payment Method</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveChanges}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

        {/* Stripe Setup Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showStripeModal}
          onRequestClose={() => setShowStripeModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Up Card Payment</Text>
              <Text style={styles.modalDescription}>
                Please add your card details to enable Stripe payments.
              </Text>

              <Text style={styles.tipText}>
                Use test card: 4242 4242 4242 4242, any future date, any CVC,
                any ZIP
              </Text>

              <StripePaymentSheet
                onSuccess={handleStripeSuccess}
                onCancel={handleStripeCancel}
              />

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowStripeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  paymentOption: {
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  paymentMethodIcon: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentIcon: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#cfae70",
  },
  paymentText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginLeft: 10,
  },
  radioContainer: {
    padding: 4,
  },
  radioOuter: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cfae70",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#cfae70",
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "#cfae70",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginTop: 8,
  },
  cardInfo: {
    marginLeft: 50,
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    padding: 8,
  },
  addPaymentText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#cfae70",
    fontWeight: "500",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  saveButton: {
    backgroundColor: "#cfae70",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalDescription: {
    textAlign: "center",
    marginBottom: 10,
    fontSize: 16,
    color: "#666",
  },
  tipText: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
  },
  cancelButton: {
    marginTop: 16,
    padding: 10,
  },

  cancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
});

export default PaymentScreen;
