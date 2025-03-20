// app/config/firebase.ts
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  inMemoryPersistence,
  signInWithCustomToken as firebaseSignInWithCustomToken,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqRdj5Q0CClfW9IT7HVJiIbHAVBucGvE8",
  authDomain: "dormdash-2bceb.firebaseapp.com",
  projectId: "dormdash-2bceb",
  storageBucket: "dormdash-2bceb.appspot.com",
  messagingSenderId: "462922659749",
  appId: "1:462922659749:web:d8907b3b55ece28e6eda4c",
  measurementId: "G-NGF8H7LCFB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set up manual persistence with AsyncStorage
setPersistence(auth, inMemoryPersistence)
  .then(() => {
    // Get the current user's token from AsyncStorage on app start
    AsyncStorage.getItem("firebase_user_token")
      .then((token) => {
        if (token) {
          firebaseSignInWithCustomToken(auth, token).catch((error: any) => {
            console.log("Error signing in with custom token:", error);
          });
        }
      })
      .catch((error) => {
        console.log("Error getting token from AsyncStorage:", error);
      });

    // Store the token when user signs in
    auth.onAuthStateChanged((user) => {
      if (user) {
        user.getIdToken().then((token) => {
          AsyncStorage.setItem("firebase_user_token", token);
        });
      } else {
        AsyncStorage.removeItem("firebase_user_token");
      }
    });
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

// Get other Firebase services
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
export default { app, auth, db, storage };
