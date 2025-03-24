// app/services/authService.ts
// Contributor: @Fardeen Bablu
// Time spent: 30 minutes

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from "firebase/auth";
import { auth } from "../config/firebase";

const AUTH_USER_KEY = "auth_user";

export const authService = {
  // Sign in
  signIn: async (email: string, password: string): Promise<User> => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    // Store user data in AsyncStorage
    const userData = {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName,
      photoURL: credential.user.photoURL,
    };
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    return credential.user;
  },

  // Sign up
  signUp: async (
    email: string,
    password: string,
    name: string,
  ): Promise<User> => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    // Update profile
    await updateProfile(credential.user, { displayName: name });
    // Store user data in AsyncStorage
    const userData = {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: name,
      photoURL: credential.user.photoURL,
    };
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    return credential.user;
  },

  // Sign out
  signOut: async (): Promise<void> => {
    await signOut(auth);
    await AsyncStorage.removeItem(AUTH_USER_KEY);
  },

  // Get current user from AsyncStorage
  getCurrentUser: async (): Promise<any | null> => {
    const userJson = await AsyncStorage.getItem(AUTH_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    const userJson = await AsyncStorage.getItem(AUTH_USER_KEY);
    return !!userJson;
  },
};

export default authService;