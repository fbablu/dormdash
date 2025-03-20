// app/config/firebase.ts
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

const app = initializeApp(firebaseConfig);

// Initialize regular auth - we'll handle persistence manually
const auth = getAuth(app);


// TODO: Setup persistence
// next steps is this:
// import { setPersistence, browserLocalPersistence } from "firebase/auth";
// setPersistence(auth, browserLocalPersistence).catch(console.error);

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
export default { app, auth, db, storage };