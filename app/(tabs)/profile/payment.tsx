// app/(tabs)/profile/payment.tsx
// Contributors: @Fardeen Bablu, @Yuening Li
// Time: 3 hours

import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Alert
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePayment } from "@/app/context/PaymentContext";

const PAYMENT_STORAGE_KEY = 'dormdash_payment_method';

const PaymentScreen = () => {
  const { setPaymentMethod } = usePayment();
  const [selectedPayment, setSelectedPayment] = useState<string>("Commodore Cash");
  
  const paymentOptions = [
    "Commodore Cash",
    "PayPal",
    "Stripe"
  ];

  // Load saved payment method on mount
  useEffect(() => {
    const loadSavedPayment = async () => {
      try {
        const savedPayment = await AsyncStorage.getItem(PAYMENT_STORAGE_KEY);
        if (savedPayment) {
          setSelectedPayment(savedPayment);
        }
      } catch (error) {
        console.error("Error loading payment method:", error);
      }
    };
    
    loadSavedPayment();
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  const handleSaveChanges = async () => {
    try {
      await AsyncStorage.setItem(PAYMENT_STORAGE_KEY, selectedPayment);
      
      // Update the context directly instead of using window events
      setPaymentMethod(selectedPayment);
      
      Alert.alert('Success', 'Payment method updated successfully');
      router.back();
    } catch (error) {
      console.error("Error saving payment method:", error);
      Alert.alert('Error', 'Failed to save payment method');
    }
  };

  return (
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
            onPress={() => setSelectedPayment(option)}
          >
            <View style={styles.optionRow}>
              <Text style={styles.paymentText}>{option}</Text>
              <View style={styles.radioContainer}>
                <View 
                  style={[
                    styles.radioOuter, 
                    selectedPayment === option && styles.radioOuterSelected
                  ]}
                >
                  {selectedPayment === option && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
            </View>
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
    </SafeAreaView>
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
  paymentText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
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
  }
});

export default PaymentScreen;