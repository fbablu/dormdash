// app/config/firebase.config.ts
// Contributor: @Fardeen Bablu
// Time spent: 15 minutes

import { initializeApp } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Use environment variables or Constants from Expo
// The actual values should be stored in app.config.js, .env files, or Expo secrets
const firebaseConfig = {
  apiKey:
    process.env.FIREBASE_API_KEY ||
    Constants.expoConfig?.extra?.firebaseApiKey ||
    "YOUR_API_KEY",
  authDomain:
    process.env.FIREBASE_AUTH_DOMAIN ||
    Constants.expoConfig?.extra?.firebaseAuthDomain ||
    "YOUR_AUTH_DOMAIN",
  projectId:
    process.env.FIREBASE_PROJECT_ID ||
    Constants.expoConfig?.extra?.firebaseProjectId ||
    "YOUR_PROJECT_ID",
  storageBucket:
    process.env.FIREBASE_STORAGE_BUCKET ||
    Constants.expoConfig?.extra?.firebaseStorageBucket ||
    "YOUR_STORAGE_BUCKET",
  messagingSenderId:
    process.env.FIREBASE_MESSAGING_SENDER_ID ||
    Constants.expoConfig?.extra?.firebaseMessagingSenderId ||
    "YOUR_MESSAGING_SENDER_ID",
  appId:
    process.env.FIREBASE_APP_ID ||
    Constants.expoConfig?.extra?.firebaseAppId ||
    "YOUR_APP_ID",
  measurementId:
    process.env.FIREBASE_MEASUREMENT_ID ||
    Constants.expoConfig?.extra?.firebaseMeasurementId ||
    "YOUR_MEASUREMENT_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Store Firebase config securely in AsyncStorage for persistence
const storeFirebaseConfig = async () => {
  try {
    await AsyncStorage.setItem(
      "firebase_config",
      JSON.stringify({
        appInitialized: true,
        lastInitialized: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error("Error storing Firebase config:", error);
  }
};

storeFirebaseConfig();

export default app;
