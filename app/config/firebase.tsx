// app/config/firebase.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import {
  Firestore,
  DocumentReference,
  DocumentData,
  DocumentSnapshot,
  CollectionReference,
} from "firebase/firestore";

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

// Create mock implementations that conform to the Firestore types
const mockDocumentSnapshot: DocumentSnapshot = {
  exists: () => true,
  data: () => ({}),
  id: "mock-doc-id",
  ref: {} as DocumentReference,
  metadata: { hasPendingWrites: false, isEqual: () => false, fromCache: false },
  get: () => null,
  isEqual: () => false,
} as unknown as DocumentSnapshot;

const mockDocumentReference = {
  get: async () => mockDocumentSnapshot,
  set: async () => Promise.resolve(),
  id: "mock-doc-id",
  path: "mock-path",
  // Add other required properties
  onSnapshot: () => () => {},
  update: async () => Promise.resolve(),
  delete: async () => Promise.resolve(),
  parent: {} as CollectionReference<DocumentData>,
  firestore: {} as Firestore,
  withConverter: () => ({}),
  type: "document",
  converter: null,
} as unknown as DocumentReference<DocumentData>;

const mockCollectionReference = {
  doc: () => mockDocumentReference,
  // Add other required properties
  add: async () => mockDocumentReference,
  id: "mock-collection-id",
  path: "mock-collection-path",
  parent: null,
  firestore: {} as Firestore,
  withConverter: () => ({}),
  type: "collection",
  converter: null,
} as unknown as CollectionReference<DocumentData>;

// Mock Firestore with proper typing
export const db = {
  collection: () => mockCollectionReference,
  type: "firestore" as const,
  app: {} as any,
  toJSON: () => ({}),
  // Add other required properties to match Firestore interface
} as unknown as Firestore;

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
