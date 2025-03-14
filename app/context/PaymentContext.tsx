// app/context/PaymentContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PAYMENT_STORAGE_KEY = "dormdash_payment_method";

type PaymentContextType = {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  refreshPaymentMethod: () => Promise<void>;
};

const defaultContext: PaymentContextType = {
  paymentMethod: "Commodore Cash",
  setPaymentMethod: () => {},
  refreshPaymentMethod: async () => {},
};

const PaymentContext = createContext<PaymentContextType>(defaultContext);

export const usePayment = () => useContext(PaymentContext);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("Commodore Cash");

  const refreshPaymentMethod = async () => {
    try {
      const savedPayment = await AsyncStorage.getItem(PAYMENT_STORAGE_KEY);
      if (savedPayment) {
        setPaymentMethod(savedPayment);
      }
    } catch (error) {
      console.error("Error loading payment method:", error);
    }
  };

  useEffect(() => {
    refreshPaymentMethod();
  }, []);

  return (
    <PaymentContext.Provider
      value={{
        paymentMethod,
        setPaymentMethod,
        refreshPaymentMethod,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};
