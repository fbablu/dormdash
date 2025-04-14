// app.config.ts
import { config } from "dotenv";
import { ConfigContext } from "@expo/config";
config();

export default ({ config: expoConfig }: ConfigContext) => {
  return {
    ...expoConfig,
    plugins: [
      ...(expoConfig.plugins || []),
      [
        "@stripe/stripe-react-native",
        {
          // For iOS
          merchantIdentifier: "merchant.com.dormdash",
          // For Android
          enableGooglePay: true,
        },
      ],
    ],
    extra: {
      ...expoConfig.extra,
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      stripePublishableKey:
        process.env.STRIPE_PUBLISHABLE_KEY ||
        "pk_test_51NXNvIFXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    },
  };
};
