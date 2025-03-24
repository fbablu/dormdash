// app/config/firebase.ts
// Contributor: @Fardeen Bablu
// Time spent: 45 minutes

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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

// Initialize Auth
const auth = getAuth(app);

// Get other Firebase services
const db = getFirestore(app);
const storage = getStorage(app);

// Manually implement token persistence
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const token = await user.getIdToken();
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userId', user.uid);
      
      // Store minimal user info for offline access
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
      await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  } else {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('auth_user');
    } catch (error) {
      console.error('Error removing auth data:', error);
    }
  }
});

export { app, auth, db, storage };