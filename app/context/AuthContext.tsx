// app/context/AuthContext.tsx
// Contributor: @Fardeen Bablu
// time spent: 7.5 hours

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  Auth,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";
import authService from "../services/authService";
import { configureGoogleSignIn } from "../utils/googleSignIn";
import GoogleSignin from "../utils/googleSignIn";
import {
  isAdmin,
  isRestaurantOwner,
  getOwnedRestaurantId,
} from "../utils/adminAuth";

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
  isAdmin?: boolean;
  isRestaurantOwner?: boolean;
  ownedRestaurantId?: string;
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
  checkUserRole: () => void;
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
  checkUserRole: () => {},
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

  const setAuthState = useCallback(
    (newState: AuthState | ((prev: AuthState) => AuthState)) => {
      setState((prev) => {
        const updatedState =
          typeof newState === "function" ? newState(prev) : newState;

        if (JSON.stringify(prev.user) === JSON.stringify(updatedState.user)) {
          return prev;
        }
        return updatedState;
      });
    },
    [],
  );

  // Check user roles (admin, restaurant owner)
  const checkUserRole = () => {
    if (!state.user) return;

    const userIsAdmin = isAdmin(state.user);
    const userIsRestaurantOwner = isRestaurantOwner(state.user);
    const ownedRestaurantId = userIsRestaurantOwner
      ? getOwnedRestaurantId(state.user)
      : null;

    if (userIsAdmin || userIsRestaurantOwner) {
      setState((prev) => ({
        ...prev,
        user: {
          ...prev.user!,
          isAdmin: userIsAdmin,
          isRestaurantOwner: userIsRestaurantOwner,
          ownedRestaurantId: ownedRestaurantId || undefined,
        },
      }));
    }
  };

  useEffect(() => {
    configureGoogleSignIn();

    // Check if we have a stored user first
    const checkStoredAuth = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        if (isAuthenticated) {
          const userData = await authService.getCurrentUser();
          if (userData) {
            // Convert to our User type
            const user: User = {
              id: userData.uid,
              name: userData.displayName || "",
              email: userData.email || "",
              image: userData.photoURL || "",
              isVerified: false,
              createdAt: new Date().toISOString(),
            };

            setAuthState({
              isLoading: false,
              isSignedIn: true,
              user: user,
            });

            // Check user roles after setting state
            setTimeout(() => {
              checkUserRole();
            }, 100);
          } else {
            setState({
              isLoading: false,
              isSignedIn: false,
              user: null,
            });
          }
        } else {
          setState({
            isLoading: false,
            isSignedIn: false,
            user: null,
          });
        }
      } catch (error) {
        console.error("Error checking stored auth:", error);
        setState({
          isLoading: false,
          isSignedIn: false,
          user: null,
        });
      }
    };

    checkStoredAuth();

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(
      auth as Auth,
      async (firebaseUser) => {
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

            // Check admin/restaurant owner status
            setTimeout(() => {
              checkUserRole();
            }, 100);
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
      },
    );

    return () => unsubscribe();
  }, []);

  // Get or create user profile in Firestore
  const getOrCreateUserProfile = async (
    firebaseUser: FirebaseUser,
  ): Promise<User> => {
    try {
      const userRef = doc(db as Firestore, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Return existing user data
        const userData = userSnap.data() as User;
        // Check admin status
        const userIsAdmin = isAdmin({
          ...userData,
          email: firebaseUser.email || "",
        });
        const userIsRestaurantOwner = isRestaurantOwner({
          ...userData,
          email: firebaseUser.email || "",
        });

        // Only add ownedRestaurantId if the user is a restaurant owner
        let updatedUserData: User = {
          ...userData,
          isAdmin: userIsAdmin,
          isRestaurantOwner: userIsRestaurantOwner,
        };

        // Only add ownedRestaurantId if user is a restaurant owner and we have a valid ID
        if (userIsRestaurantOwner) {
          const ownedId = getOwnedRestaurantId({
            ...userData,
            email: firebaseUser.email || "",
          });
          if (ownedId) {
            // Only add the field if it's not null
            updatedUserData.ownedRestaurantId = ownedId;
          }
        }

        return updatedUserData;
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

        // Check admin status for new user
        const userIsAdmin = isAdmin(newUser);
        const userIsRestaurantOwner = isRestaurantOwner(newUser);

        // Add role fields
        if (userIsAdmin) {
          newUser.isAdmin = true;
        }

        if (userIsRestaurantOwner) {
          newUser.isRestaurantOwner = true;
          // Only add ownedRestaurantId if we have a valid ID
          const ownedId = getOwnedRestaurantId(newUser);
          if (ownedId) {
            // Only add the field if it's not null
            newUser.ownedRestaurantId = ownedId;
          }
        }

        // Remove undefined fields before saving to Firestore
        const userDataToSave = Object.fromEntries(
          Object.entries(newUser).filter(([_, v]) => v !== undefined),
        );

        // Save to Firestore
        await setDoc(userRef, {
          ...userDataToSave,
          createdAt: serverTimestamp(),
        });

        return newUser;
      }
    } catch (error) {
      console.error("Error in getOrCreateUserProfile:", error);

      // Fallback with minimal data
      const fallbackUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "Vanderbilt Student",
        email: firebaseUser.email || "",
        image: firebaseUser.photoURL || "",
        isVerified: false,
        createdAt: new Date().toISOString(),
      };

      // Check admin status
      const userIsAdmin = isAdmin(fallbackUser);
      const userIsRestaurantOwner = isRestaurantOwner(fallbackUser);

      if (userIsAdmin) {
        fallbackUser.isAdmin = userIsAdmin;
      }

      if (userIsRestaurantOwner) {
        fallbackUser.isRestaurantOwner = userIsRestaurantOwner;
        // Only add ownedRestaurantId if we have a valid ID
        const ownedId = getOwnedRestaurantId(fallbackUser);
        if (ownedId) {
          // Only add the field if it's not null
          fallbackUser.ownedRestaurantId = ownedId;
        }
      }

      return fallbackUser;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Use Firebase for email/password sign in
      const userCredential = await signInWithEmailAndPassword(
        auth as Auth,
        email,
        password,
      );
      // The rest is handled by the onAuthStateChanged listener
    } catch (error: any) {
      console.error("Sign in error:", error);
      setState((prev) => ({ ...prev, isLoading: false }));

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        throw new Error("Invalid email or password");
      } else if (error.code === "auth/too-many-requests") {
        throw new Error(
          "Too many failed login attempts. Please try again later.",
        );
      } else {
        throw new Error(error.message || "Failed to sign in");
      }
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Create new user with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth as Auth,
        email,
        password,
      );

      // Update display name
      await updateProfile(userCredential.user, { displayName: name });

      // The rest is handled by the onAuthStateChanged listener
    } catch (error: any) {
      console.error("Sign up error:", error);
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
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth as Auth, email);
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

      // Sign out from Firebase
      await firebaseSignOut(auth as Auth);

      // Clear local storage
      await AsyncStorage.removeItem("user_data");
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userId");

      // Also sign out from Google if signed in
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          await GoogleSignin.signOut();
        }
      } catch (error) {
        console.log("Google Sign-In error:", error);
      }

      // Set state first before navigation
      setAuthState({
        isLoading: false,
        isSignedIn: false,
        user: null,
      });

      // Don't use router.replace here as it causes issues
      // The navigation will be handled by the useEffect in _layout.tsx
      // which watches for the isSignedIn state
    } catch (error) {
      console.error("Sign out error:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const authObj = auth as Auth;
      if (!authObj.currentUser || !state.user) return;

      const userRef = doc(db as Firestore, "users", authObj.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;

        // Check admin status
        const userIsAdmin = isAdmin(userData);
        const userIsRestaurantOwner = isRestaurantOwner(userData);

        if (userIsAdmin || userIsRestaurantOwner) {
          userData.isAdmin = userIsAdmin;
          userData.isRestaurantOwner = userIsRestaurantOwner;
          if (userIsRestaurantOwner) {
            userData.ownedRestaurantId =
              getOwnedRestaurantId(userData) || undefined;
          }
        }

        // Update AsyncStorage
        await AsyncStorage.setItem("user_data", JSON.stringify(userData));

        setAuthState((prev: any) => ({
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
      const authObj = auth as Auth;
      if (!authObj.currentUser || !state.user)
        throw new Error("User not authenticated");

      const userRef = doc(db as Firestore, "users", authObj.currentUser.uid);
      await setDoc(userRef, userData, { merge: true });

      // Update display name if provided
      if (userData.name && authObj.currentUser) {
        await updateProfile(authObj.currentUser, {
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
        checkUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
