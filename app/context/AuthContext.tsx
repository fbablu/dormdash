// app/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  isAdmin,
  isRestaurantOwner,
  getOwnedRestaurantId,
} from "../utils/adminAuth";

// Test accounts
const TEST_ACCOUNTS = [
  {
    email: "blenzbowls.vu@gmail.com",
    password: "12345678",
    name: "BlenZ Bowls Owner",
    role: "owner",
    id: "owner-123456",
    restaurantId: "blenz-bowls",
  },
  {
    email: "john.doe@vanderbilt.edu",
    password: "123456789",
    name: "John Doe",
    role: "user",
    id: "user-123456",
  },
];

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
  role?: string;
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
    // Initialize and check if user is already logged in
    const initializeAuth = async () => {
      try {
        console.log("[AuthContext] Initializing auth...");
        // Try to load an existing user session
        const userData = await AsyncStorage.getItem("user_data");
        if (userData) {
          console.log("[AuthContext] Found existing user session");
          const parsedUser = JSON.parse(userData);
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
          console.log("[AuthContext] No existing user session found");
          setState({
            isLoading: false,
            isSignedIn: false,
            user: null,
          });
        }
      } catch (error) {
        console.error("[AuthContext] Error in auth initialization:", error);
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
      console.log("[AuthContext] Sign in attempt for:", email);
      setState((prev) => ({ ...prev, isLoading: true }));

      // Check if the email and password match our test accounts
      const testAccount = TEST_ACCOUNTS.find(
        (account) =>
          account.email.toLowerCase() === email.toLowerCase() &&
          account.password === password,
      );

      if (!testAccount) {
        console.error("[AuthContext] Invalid credentials for:", email);
        throw new Error("Invalid email or password");
      }

      console.log("[AuthContext] Credentials valid for:", email);

      // Create user data structure
      const userData: User = {
        id: testAccount.id,
        name: testAccount.name,
        email: testAccount.email,
        createdAt: new Date().toISOString(),
        isVerified: true,
        role: testAccount.role,
        ...(testAccount.role === "owner" && {
          isRestaurantOwner: true,
          ownedRestaurantId: testAccount.restaurantId,
        }),
      };

      console.log("[AuthContext] Created user data:", JSON.stringify(userData));

      // Store in AsyncStorage for session persistence
      await AsyncStorage.setItem(
        "mock_current_user",
        JSON.stringify(testAccount),
      );
      await AsyncStorage.setItem("userToken", `mock-token-${testAccount.id}`);
      await AsyncStorage.setItem("userId", testAccount.id);
      await AsyncStorage.setItem("user_data", JSON.stringify(userData));

      console.log("[AuthContext] User data stored in AsyncStorage");

      setState({
        isLoading: false,
        isSignedIn: true,
        user: userData,
      });

      // Ensure roles are properly set
      setTimeout(() => {
        checkUserRole();
      }, 100);

      // Navigate to main screen
      console.log("[AuthContext] Navigating to main screen");
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("[AuthContext] Sign in error:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Check if an account with this email already exists
      const existingAccount = TEST_ACCOUNTS.find(
        (account) => account.email.toLowerCase() === email.toLowerCase(),
      );

      if (existingAccount) {
        throw new Error("An account with this email already exists");
      }

      // Create a new user ID
      const userId = `user-${Date.now()}`;

      // Create user data
      const userData: User = {
        id: userId,
        name,
        email,
        createdAt: new Date().toISOString(),
        isVerified: false,
        role: "user",
      };

      // Store in AsyncStorage
      const newUser = {
        ...userData,
        password,
      };

      await AsyncStorage.setItem("mock_current_user", JSON.stringify(newUser));
      await AsyncStorage.setItem("userToken", `mock-token-${userId}`);
      await AsyncStorage.setItem("userId", userId);
      await AsyncStorage.setItem("user_data", JSON.stringify(userData));

      // Also add to TEST_ACCOUNTS for this session (won't persist between app restarts)
      TEST_ACCOUNTS.push({
        email,
        password,
        name,
        role: "user",
        id: userId,
      });

      setState({
        isLoading: false,
        isSignedIn: true,
        user: userData,
      });

      // Navigate to main screen
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 100);
    } catch (error: any) {
      console.error("Sign up error:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    // Mock implementation
    const account = TEST_ACCOUNTS.find(
      (account) => account.email.toLowerCase() === email.toLowerCase(),
    );

    if (!account) {
      throw new Error("No account found with this email address");
    }

    // In a real app, this would send a password reset email
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
