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
};

// Mock Auth implementation
export const mockAuth: Partial<Auth> = {
  currentUser: mockUser as User,


  onAuthStateChanged: (callback: any) => {
    setTimeout(() => callback(mockUser), 100);
    return () => {};
  },

  signOut: async () => Promise.resolve(),
};

export const mockDb: Partial<Firestore> = {};

// Helper to store mock user
export const storeMockUser = async () => {
  await AsyncStorage.setItem("mock_current_user", JSON.stringify(mockUser));
  await AsyncStorage.setItem("userToken", "mock-token-123");
  await AsyncStorage.setItem("userId", mockUser.uid);
};

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
