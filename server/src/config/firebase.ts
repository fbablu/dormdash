// src/config/firebase.ts
import * as admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL",
  "FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing environment variable: ${varName}`);
  }
});

// Format private key with actual newlines
const privateKey = process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY!.replace(
  /\\n/g,
  "\n",
);

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin initialized successfully");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
  process.exit(1); // Exit process if Firebase fails
}

// Export services only if initialized
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export default admin;
