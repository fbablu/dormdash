// firebaseApp/config/firebase.ts
import { initializeApp, FirebaseApp, getApps, getApp } from "firebase/app";
import {
  Auth,
  getAuth,
  setPersistence,
  inMemoryPersistence,
  initializeAuth,
  getReactNativePersistence,
  signInWithCustomToken as firebaseSignInWithCustomToken,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// only looking where the light is;
// problem could be in different places that are not visible

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

let firebaseApp: FirebaseApp;
let fireAuth: Auth;
if (getApps().length < 1) {
  firebaseApp = initializeApp(firebaseConfig);
  fireAuth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  firebaseApp = getApp();
  fireAuth = getAuth();
}

// Set up manual persistence with AsyncStorage
setPersistence(fireAuth, inMemoryPersistence)
  .then(() => {
    // Get the current user's token from AsyncStorage on firebaseApp start
    AsyncStorage.getItem("firebase_user_token")
      .then((token) => {
        if (token) {
          firebaseSignInWithCustomToken(fireAuth, token).catch((error: any) => {
            console.log("Error signing in with custom token:", error);
          });
        }
      })
      .catch((error) => {
        console.log("Error getting token from AsyncStorage:", error);
      });

    // Store the token when user signs in
    fireAuth.onAuthStateChanged((user) => {
      if (user) {
        user.getIdToken().then((token) => {
          AsyncStorage.setItem("firebase_user_token", token);
        });
      } else {
        AsyncStorage.removeItem("firebase_user_token");
      }
    });
  })
  .catch((error: any) => {
    console.error("Error setting persistence:", error);
  });

// Get other Firebase services
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

export { firebaseApp, fireAuth, db, storage };
export default { firebaseApp, fireAuth, db, storage };
