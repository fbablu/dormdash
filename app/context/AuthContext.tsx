// app/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
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
    // Initialize with mock user for Expo Go testing
    const initializeAuth = async () => {
      try {
        // Store a mock user for testing
        const mockUser = {
          uid: `mock-${Date.now()}`,
          email: "test@vanderbilt.edu",
          displayName: "Test User",
          photoURL: null,
          getIdToken: async () => "mock-token-123",
        };

        // Store in AsyncStorage
        await AsyncStorage.setItem(
          "mock_current_user",
          JSON.stringify(mockUser),
        );
        await AsyncStorage.setItem("userToken", "mock-token-123");
        await AsyncStorage.setItem("userId", mockUser.uid);

        // Store user data
        const userData = {
          id: mockUser.uid,
          name: mockUser.displayName || "Test User",
          email: mockUser.email,
          createdAt: new Date().toISOString(),
          isVerified: false,
        };

        await AsyncStorage.setItem("user_data", JSON.stringify(userData));

        // Check if we should be logged in
        const existingUser = await AsyncStorage.getItem("user_data");
        if (existingUser) {
          const parsedUser = JSON.parse(existingUser);
          setState({
            isLoading: false,
            isSignedIn: true,
            user: parsedUser,
          });

          // Check admin roles
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
      } catch (error) {
        console.error("Error in auth initialization:", error);
        setState({
          isLoading: false,
          isSignedIn: false,
          user: null,
        });
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Simulate sign in for Expo Go
      const mockUser = {
        uid: `mock-${Date.now()}`,
        email,
        displayName: "Vanderbilt Student",
        photoURL: null,
        getIdToken: async () => `mock-token-${Date.now()}`,
      };

      // Store in AsyncStorage
      await AsyncStorage.setItem("mock_current_user", JSON.stringify(mockUser));
      await AsyncStorage.setItem("userToken", "mock-token-123");
      await AsyncStorage.setItem("userId", mockUser.uid);

      // Store user data
      const userData = {
        id: mockUser.uid,
        name: mockUser.displayName || "Vanderbilt Student",
        email: mockUser.email,
        createdAt: new Date().toISOString(),
        isVerified: false,
      };

      await AsyncStorage.setItem("user_data", JSON.stringify(userData));

      setState({
        isLoading: false,
        isSignedIn: true,
        user: userData,
      });
    } catch (error: any) {
      console.error("Sign in error:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw new Error("Failed to sign in");
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const mockUser = {
        uid: `mock-${Date.now()}`,
        email,
        displayName: name,
        photoURL: null,
        getIdToken: async () => `mock-token-${Date.now()}`,
      };

      // Store in AsyncStorage
      await AsyncStorage.setItem("mock_current_user", JSON.stringify(mockUser));
      await AsyncStorage.setItem("userToken", "mock-token-123");
      await AsyncStorage.setItem("userId", mockUser.uid);

      // Store user data
      const userData = {
        id: mockUser.uid,
        name,
        email,
        createdAt: new Date().toISOString(),
        isVerified: false,
      };

      await AsyncStorage.setItem("user_data", JSON.stringify(userData));

      setState({
        isLoading: false,
        isSignedIn: true,
        user: userData,
      });
    } catch (error: any) {
      console.error("Sign up error:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw new Error("Failed to create account");
    }
  };

  const resetPassword = async (email: string) => {
    // Mock implementation for Expo Go
    return Promise.resolve();
  };

  const signOutHandler = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await AsyncStorage.removeItem("api_disabled");

      // Remove user data from AsyncStorage
      const keysToRemove = [
        "user_data",
        "userToken",
        "userId",
        "mock_current_user",
      ];
      await Promise.all(
        keysToRemove.map((key) => AsyncStorage.removeItem(key)),
      );

      // Update state
      setState({
        isLoading: false,
        isSignedIn: false,
        user: null,
      });

      // Navigate to onboarding screen
      setTimeout(() => {
        router.replace("/onboarding");
      }, 100);
    } catch (error) {
      console.error("Sign out error:", error);
      setState({
        isLoading: false,
        isSignedIn: false,
        user: null,
      });
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user_data");
      if (userData) {
        const user = JSON.parse(userData);
        setState((prev) => ({
          ...prev,
          user: user,
        }));
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!state.user) throw new Error("User not authenticated");

      // Get current user data
      const userJson = await AsyncStorage.getItem("user_data");
      if (!userJson) throw new Error("User data not found");

      const currentUser = JSON.parse(userJson);
      const updatedUser = { ...currentUser, ...userData };

      // Save updated user
      await AsyncStorage.setItem("user_data", JSON.stringify(updatedUser));

      // Update state
      setState((prev) => ({
        ...prev,
        user: updatedUser,
      }));
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  // Verifies dorm access code
  const verifyDorm = async (dormCode: string): Promise<boolean> => {
    try {
      // Verify the dorm code (simple implementation for demo)
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
