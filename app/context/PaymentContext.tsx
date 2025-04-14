// app/context/PaymentContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PAYMENT_STORAGE_KEY = "dormdash_payment_method";

export type PaymentMethod = "Commodore Cash" | "PayPal" | "Stripe";

interface PaymentContextType {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  refreshPaymentMethod: () => Promise<void>;
  hasStripeSetup: boolean;
  setHasStripeSetup: (value: boolean) => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [paymentMethod, setPaymentMethodState] =
    useState<PaymentMethod>("Commodore Cash");
  const [hasStripeSetup, setHasStripeSetup] = useState<boolean>(false);

  // Load the saved payment method on initial render
  useEffect(() => {
    refreshPaymentMethod();
    checkStripeSetup();
  }, []);

  const refreshPaymentMethod = async (): Promise<void> => {
    try {
      const savedMethod = await AsyncStorage.getItem(PAYMENT_STORAGE_KEY);
      if (
        savedMethod &&
        ["Commodore Cash", "PayPal", "Stripe"].includes(savedMethod)
      ) {
        setPaymentMethodState(savedMethod as PaymentMethod);
      }
    } catch (error) {
      console.error("Error loading payment method:", error);
    }
  };

  const checkStripeSetup = async (): Promise<void> => {
    try {
      const stripeCustomerId = await AsyncStorage.getItem("stripe_customer_id");
      setHasStripeSetup(!!stripeCustomerId);
    } catch (error) {
      console.error("Error checking Stripe setup:", error);
    }
  };

  const setPaymentMethod = async (method: PaymentMethod) => {
    setPaymentMethodState(method);
    try {
      await AsyncStorage.setItem(PAYMENT_STORAGE_KEY, method);
    } catch (error) {
      console.error("Error saving payment method:", error);
    }
  };

  return (
    <PaymentContext.Provider
      value={{
        paymentMethod,
        setPaymentMethod,
        refreshPaymentMethod,
        hasStripeSetup,
        setHasStripeSetup,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return context;
};

// Add default export
export default PaymentProvider;
