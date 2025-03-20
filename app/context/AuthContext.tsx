// app/context/AuthContext.tsx
// Contributors: Fardeen Bablu
// Time spent: 6 hours
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";

// Define user type
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  isVerified?: boolean;
  phone?: string;
  dormLocation?: string;
  createdAt: string;
}

interface AuthState {
  isLoading: boolean;
  isSignedIn: boolean;
  user: User | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  verifyDorm: (dormCode: string) => Promise<boolean>;
}

const defaultAuthContext: AuthContextType = {
  isLoading: true,
  isSignedIn: false,
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  refreshUser: async () => {},
  updateUser: async () => {},
  verifyDorm: async () => false,
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isSignedIn: false,
    user: null,
  });

  useEffect(() => {
    // Check if we have a stored user first
    const checkStoredAuth = async () => {
      try {
        const userData = await AsyncStorage.getItem("user_data");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setState({
            isLoading: false,
            isSignedIn: true,
            user: parsedUser,
          });
        }
      } catch (error) {
        console.error("Error checking stored auth:", error);
      }
    };

    checkStoredAuth();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await getOrCreateUserProfile(firebaseUser);

          // Store user data for offline access
          await AsyncStorage.setItem("user_data", JSON.stringify(user));

          // Save user token for API requests
          await AsyncStorage.setItem(
            "userToken",
            await firebaseUser.getIdToken(),
          );
          await AsyncStorage.setItem("userId", user.id);

          setState({
            isLoading: false,
            isSignedIn: true,
            user,
          });
        } catch (error) {
          console.error("Error processing authenticated user:", error);
          setState({
            isLoading: false,
            isSignedIn: false,
            user: null,
          });
        }
      } else {
        // No user signed in via Firebase, clear any stored data
        try {
          await AsyncStorage.removeItem("user_data");
          await AsyncStorage.removeItem("userToken");
          await AsyncStorage.removeItem("userId");
        } catch (error) {
          console.error("Error removing stored user:", error);
        }

        setState({
          isLoading: false,
          isSignedIn: false,
          user: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Get or create user profile in Firestore
  const getOrCreateUserProfile = async (firebaseUser: any): Promise<User> => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Return existing user data
        return userSnap.data() as User;
      } else {
        // Create new user
        const newUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || "Vanderbilt Student",
          email: firebaseUser.email || "",
          image: firebaseUser.photoURL || "",
          isVerified: false,
          createdAt: new Date().toISOString(),
        };

        // Save to Firestore
        await setDoc(userRef, {
          ...newUser,
          createdAt: serverTimestamp(),
        });

        return newUser;
      }
    } catch (error) {
      console.error("Error in getOrCreateUserProfile:", error);

      // Fallback with minimal data if we can't reach Firestore
      return {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "Vanderbilt Student",
        email: firebaseUser.email || "",
        image: firebaseUser.photoURL || "",
        isVerified: false,
        createdAt: new Date().toISOString(),
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      let userCredential: UserCredential;
      try {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
      } catch (error: any) {
        setState((prev) => ({ ...prev, isLoading: false }));

        if (
          error.code === "auth/user-not-found" ||
          error.code === "auth/wrong-password"
        ) {
          throw new Error("Invalid email or password");
        } else if (error.code === "auth/too-many-requests") {
          throw new Error(
            "Too many failed login attempts. Please try again later",
          );
        } else {
          throw new Error(error.message || "Failed to sign in");
        }
      }

      // Get the ID token
      const idToken = await userCredential.user.getIdToken();

      // Store token for API requests
      await AsyncStorage.setItem("userToken", idToken);
      await AsyncStorage.setItem("userId", userCredential.user.uid);
    } catch (error: any) {
      console.error("Sign in error:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Create user in Firebase Auth
      let userCredential: UserCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        // Update user profile with name
        await updateProfile(userCredential.user, { displayName: name });

        // Create user document in Firestore
        const userRef = doc(db, "users", userCredential.user.uid);
        const newUser: User = {
          id: userCredential.user.uid,
          name: name,
          email: email,
          isVerified: false,
          createdAt: new Date().toISOString(),
        };

        await setDoc(userRef, {
          ...newUser,
          createdAt: serverTimestamp(),
        });

        // Get the ID token
        const idToken = await userCredential.user.getIdToken();

        // Store token for API requests
        await AsyncStorage.setItem("userToken", idToken);
        await AsyncStorage.setItem("userId", userCredential.user.uid);
      } catch (error: any) {
        setState((prev) => ({ ...prev, isLoading: false }));

        if (error.code === "auth/email-already-in-use") {
          throw new Error("Email already in use");
        } else if (error.code === "auth/weak-password") {
          throw new Error("Password is too weak");
        } else if (error.code === "auth/invalid-email") {
          throw new Error("Invalid email format");
        } else {
          throw new Error(error.message || "Failed to create account");
        }
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Password reset error:", error);

      if (error.code === "auth/user-not-found") {
        throw new Error("No account found with this email");
      } else {
        throw new Error(error.message || "Failed to send password reset email");
      }
    }
  };

  const signOutHandler = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      await firebaseSignOut(auth);

      // Clear local storage
      await AsyncStorage.removeItem("user_data");
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userId");

      setState({
        isLoading: false,
        isSignedIn: false,
        user: null,
      });

      // Navigate to onboarding
      router.replace("/onboarding");
    } catch (error) {
      console.error("Sign out error:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (!auth.currentUser || !state.user) return;

      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;

        // Update AsyncStorage
        await AsyncStorage.setItem("user_data", JSON.stringify(userData));

        setState((prev) => ({
          ...prev,
          user: userData,
        }));
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!auth.currentUser || !state.user)
        throw new Error("User not authenticated");

      const userRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userRef, userData, { merge: true });

      // Update display name if provided
      if (userData.name && auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: userData.name,
        });
      }

      // Refresh user data
      await refreshUser();
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  // Verifies dorm access code
  const verifyDorm = async (dormCode: string): Promise<boolean> => {
    try {
      // Verify the dorm code
      const isValidCode = /^\d{6}$/.test(dormCode);

      if (isValidCode && state.user) {
        await updateUser({
          isVerified: true,
          dormLocation: "Verified Dorm",
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error verifying dorm:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut: signOutHandler,
        resetPassword,
        refreshUser,
        updateUser,
        verifyDorm,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
