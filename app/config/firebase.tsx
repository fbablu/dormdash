// app/config/firebase.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

// Mock user for authentication
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

// Create a proper mock implementation for Firestore
// This is a simplified version that implements the minimum needed functionality
const createMockDoc = (id: string, data = {}) => {
  return {
    id,
    data: () => ({ ...data }),
    exists: () => true,
    get: (field: string | number) => {
      const dataObj = data as Record<string, any>;
      return dataObj[field as string];
    },
    ref: {
      path: `mock/path/${id}`,
    },
  };
};

// Define types for our mock documents and collections
type MockDocument = Record<string, any>;
type MockDocumentStore = Record<string, MockDocument>;
type MockCollectionStore = Record<string, Record<string, MockDocument>>;

// Mock documents in memory
const mockDocuments: MockDocumentStore = {
  "restaurants/taco-mama": {
    name: "Taco Mama",
    location: "HILLSBORO VILLAGE",
    address: "1920 Belcourt Ave",
    cuisines: ["Mexican", "Tex-Mex"],
    acceptsCommodoreCash: true,
  },
  "restaurants/blenz-bowls": {
    name: "BlenZ Bowls",
    location: "HILLSBORO VILLAGE",
    address: "2005 Belcourt Ave",
    cuisines: ["Smoothies", "Bowls", "Healthy"],
    acceptsCommodoreCash: true,
  },
};

// Mock collections in memory
const mockCollections: MockCollectionStore = {
  "restaurants/taco-mama/menu": {
    burritos: {
      name: "Burritos",
      items: [
        {
          id: "yo-mama",
          name: "Yo Mama",
          description:
            "Ground beef, shredded cheddar, lettuce, tomato, sour cream with side of queso",
          price: 9.99,
        },
      ],
    },
    tacos: {
      name: "Tacos",
      items: [
        {
          id: "classico-beef",
          name: "Classico Beef",
          description:
            "Ground beef, shredded cheddar, lettuce, tomato, sour cream",
          price: 8.99,
        },
      ],
    },
  },
  "restaurants/blenz-bowls/menu": {},
};

// Create a more robust firestore mock
export const db = {
  collection: (path: string) => {
    return {
      // Implement collection methods
      doc: (docId: string) => {
        const fullPath = docId ? `${path}/${docId}` : path;

        return {
          // Implement document methods
          id: docId,
          get: async () => {
            // Return document data if it exists
            const docData = mockDocuments[fullPath];
            return {
              exists: !!docData,
              data: () => docData || {},
              id: docId,
            };
          },
          set: async (data: any, options: { merge?: boolean } = {}) => {
            // Save document data in memory
            if (options.merge) {
              mockDocuments[fullPath] = {
                ...(mockDocuments[fullPath] || {}),
                ...data,
              };
            } else {
              mockDocuments[fullPath] = { ...data };
            }
            return Promise.resolve();
          },
          update: async (data: any) => {
            // Update document data
            mockDocuments[fullPath] = {
              ...(mockDocuments[fullPath] || {}),
              ...data,
            };
            return Promise.resolve();
          },
          delete: async () => {
            // Delete document data
            delete mockDocuments[fullPath];
            return Promise.resolve();
          },
          collection: (subCollection: string) => {
            // Return a nested collection
            return db.collection(`${fullPath}/${subCollection}`);
          },
        };
      },
      // Implement getDocs for collection
      get: async () => {
        const collectionData = mockCollections[path] || {};
        return {
          empty: Object.keys(collectionData).length === 0,
          docs: Object.entries(collectionData).map(([id, data]) =>
            createMockDoc(id, data),
          ),
          forEach: (
            callback: (arg0: ReturnType<typeof createMockDoc>) => void,
          ) => {
            Object.entries(collectionData).forEach(([id, data]) => {
              callback(createMockDoc(id, data));
            });
          },
        };
      },
      // Add new document to collection
      add: async (data: any) => {
        const newId = `mock-${Date.now()}`;
        const docPath = `${path}/${newId}`;
        mockDocuments[docPath] = data;
        return {
          id: newId,
          get: async () => ({
            exists: () => true,
            data: () => data,
            id: newId,
          }),
        };
      },
      // Query implementation
      where: () => {
        // Return object with same methods for chaining
        const queryObj = {
          get: async () => ({
            empty: true,
            docs: [],
            forEach: () => {},
          }),
          where: () => queryObj,
          orderBy: () => queryObj,
        };
        return queryObj;
      },
      orderBy: () => {
        // Return object with same methods for chaining
        const queryObj = {
          get: async () => ({
            empty: true,
            docs: [],
            forEach: () => {},
          }),
          where: () => queryObj,
          orderBy: () => queryObj,
        };
        return queryObj;
      },
    };
  },
  doc: (path: string) => {
    const lastSlashIndex = path.lastIndexOf("/");
    const collectionPath = path.substring(0, lastSlashIndex);
    const docId = path.substring(lastSlashIndex + 1);

    return db.collection(collectionPath).doc(docId);
  },
};

// Mock Storage
export const storage = {
  ref: (path: string) => ({
    put: async (file: any) => ({
      ref: {
        getDownloadURL: async () =>
          `https://example.com/mock-image-${path}.jpg`,
      },
    }),
    getDownloadURL: async () => `https://example.com/mock-image-${path}.jpg`,
  }),
};

// Default export to satisfy router requirements
export default function FirebaseConfig() {
  return null;
}
