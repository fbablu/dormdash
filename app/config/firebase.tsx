// app/config/firebase.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

// Mock Firebase implementations for Expo Go
const mockUser = {
  uid: "mock-user-id",
  email: "test@vanderbilt.edu",
  displayName: "Test User",
  photoURL: null,
  emailVerified: true,
  getIdToken: async () => "mock-token-123",
};

// Mock Auth
export const auth = {
  currentUser: mockUser,
  onAuthStateChanged: (
    observer: (arg0: {
      uid: string;
      email: string;
      displayName: string;
      photoURL: null;
      emailVerified: boolean;
      getIdToken: () => Promise<string>;
    }) => void,
  ) => {
    // Call observer immediately with the mock user
    setTimeout(() => observer(mockUser), 0);
    // Return an unsubscribe function
    return () => {};
  },
  signOut: async () => Promise.resolve(),
};

// Mock Firestore
export const db = {
  collection: () => ({
    doc: () => ({
      get: async () => ({
        exists: true,
        data: () => ({}),
        id: "mock-doc-id",
      }),
      set: async () => Promise.resolve(),
    }),
  }),
};

// Mock Storage
export const storage = {
  ref: () => ({
    put: async () => ({
      ref: {
        getDownloadURL: async () => "https://example.com/mock-image.jpg",
      },
    }),
  }),
};

// Default export to satisfy router requirements
export default function FirebaseConfig() {
  return null;
}
