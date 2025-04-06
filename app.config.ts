// app.config.ts
import { config } from "dotenv";
import { ConfigContext } from "@expo/config";
config();

export default ({ config: expoConfig }: ConfigContext) => {
  return {
    ...expoConfig,
    extra: {
      ...expoConfig.extra,
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
    },
  };
};
