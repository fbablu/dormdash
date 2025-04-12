// app/config/firebase.config.ts
// Contributor: @Fardeen Bablu
// Time spent: 30 minutes

import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Use the actual values from your Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyDqRdj5Q0CClfW9IT7HVJiIbHAVBucGvE8",
  authDomain: "dormdash-2bceb.firebaseapp.com",
  projectId: "dormdash-2bceb",
  storageBucket: "dormdash-2bceb.firebasestorage.app",
  messagingSenderId: "462922659749",
  appId: "1:462922659749:web:d8907b3b55ece28e6eda4c",
  measurementId: "G-NGF8H7LCFB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
// Initialize Firestore
const db = getFirestore(app);


async function uploadImage(userId: string) {
  // Request permission to access media library
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Sorry, we need camera roll permissions to make this work!');
    return;
  }

  // Pick an image
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled) {
    const response = await fetch(result.assets[0].uri);
    const blob = await response.blob();

    const userDocRef = doc(db, "users", userId);
    // Create a reference to the file you want to upload
    const storageRef = ref(storage, `profileImages/${Date.now()}-${result.assets[0].uri.split('/').pop()}`);

    // Upload the file
    uploadBytes(storageRef, blob).then((snapshot) => {
      console.log('Uploaded a blob or file!');
      // Get the download URL
      getDownloadURL(snapshot.ref).then((downloadURL) => {
        console.log('File available at', downloadURL);
        // You can now save this URL to your database
        setDoc(userDocRef, { profileImageUrl: downloadURL }, { merge: true });
      });
    }).catch((error) => {
      console.error("Error uploading file: ", error);
    });
  }
}

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Log successful initialization
console.log(
  "Firebase initialized successfully with project:",
  firebaseConfig.projectId,
);

export { auth, db };
export default app;
