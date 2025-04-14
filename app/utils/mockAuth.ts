// app/utils/mockAuth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from "firebase/auth";
import { Firestore } from "firebase/firestore";

// Mock user for development
const mockUser = {
  uid: "mock-user-id",
  email: "test@vanderbilt.edu",
  displayName: "Test User",
  photoURL: null,
  emailVerified: true,
  getIdToken: async () => "mock-token-123",
  // Add other required properties for User type
};

// Mock Auth implementation
export const mockAuth: Partial<Auth> = {
  currentUser: mockUser as User,

  // Mock onAuthStateChanged that will call the observer with the mock user
  onAuthStateChanged: (callback: any) => {
    // Immediately call with the mock user
    setTimeout(() => callback(mockUser), 100);

    // Return a function to unsubscribe
    return () => {};
  },

  // Other auth methods can be mocked here as needed
  signOut: async () => Promise.resolve(),
};

// Mock Firestore implementation
export const mockDb: Partial<Firestore> = {
  // Add firestore mocks as needed
};

// Helper to store mock user
export const storeMockUser = async () => {
  await AsyncStorage.setItem("mock_current_user", JSON.stringify(mockUser));
  await AsyncStorage.setItem("userToken", "mock-token-123");
  await AsyncStorage.setItem("userId", mockUser.uid);
};

// Mock GoogleSignin implementation
export const mockGoogleSignin = {
  configure: () => {},
  hasPlayServices: async () => true,
  signIn: async () => ({
    user: {
      id: mockUser.uid,
      name: mockUser.displayName,
      email: mockUser.email,
      photo: mockUser.photoURL,
    },
  }),
  isSignedIn: async () => true,
  getCurrentUser: async () => ({
    user: {
      id: mockUser.uid,
      name: mockUser.displayName,
      email: mockUser.email,
      photo: mockUser.photoURL,
    },
  }),
  signOut: async () => {},
};

export default { mockAuth, mockDb, mockGoogleSignin, storeMockUser };
