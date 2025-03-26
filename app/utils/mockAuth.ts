// app/utils/mockAuth.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Auth, User as FirebaseUser } from "firebase/auth";
import { Firestore } from "firebase/firestore";

// Mock user data
const MOCK_USERS = [
  {
    uid: "mock-user-1",
    email: "test@vanderbilt.edu",
    displayName: "Vanderbilt Student",
    photoURL: "https://randomuser.me/api/portraits/women/1.jpg",
    getIdToken: async () => "mock-token-12345",
    toJSON: () => ({}),
  },
  {
    uid: "mock-admin",
    email: "admin@gmail.com", 
    displayName: "Admin User",
    photoURL: "https://randomuser.me/api/portraits/men/1.jpg",
    getIdToken: async () => "mock-admin-token-12345",
    toJSON: () => ({}),
  },
];

// More Firebase-compatible mock implementation
export const mockAuth = {
  currentUser: null,
  app: {},
  name: "auth",
  config: {},
  
  // Add required Auth properties and methods
  setPersistence: async () => {},
  languageCode: null,
  useDeviceLanguage: () => {},
  signInWithCustomToken: async () => ({ user: MOCK_USERS[0] }),
  signInAnonymously: async () => ({ user: MOCK_USERS[0] }),
  
  onAuthStateChanged: (callback: any) => {
    AsyncStorage.getItem("mock_current_user").then(user => {
      if (user) {
        callback(JSON.parse(user));
      } else {
        callback(null);
      }
    });
    return () => {};
  },
  
  signInWithEmailAndPassword: async (email: string, password: string) => {
    if (password !== "password123") {
      throw new Error("auth/wrong-password");
    }
    
    const user = MOCK_USERS.find(u => u.email === email) || MOCK_USERS[0];
    await AsyncStorage.setItem("mock_current_user", JSON.stringify(user));
    return { user };
  },
  
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    const newUser = {
      uid: `mock-${Date.now()}`,
      email,
      displayName: "",
      photoURL: null,
      getIdToken: async () => "mock-new-token-12345",
      toJSON: () => ({}),
    };
    await AsyncStorage.setItem("mock_current_user", JSON.stringify(newUser));
    return { user: newUser };
  },
  
  signOut: async () => {
    await AsyncStorage.removeItem("mock_current_user");
  },
  
  sendPasswordResetEmail: async (email: string) => {},
  
};

export const mockGoogleSignin = {
  configure: () => {},
  hasPlayServices: async () => true,
  signIn: async () => ({
    idToken: "mock-token",
    user: MOCK_USERS[0],
  }),
  signOut: async () => {},
  isSignedIn: async () => {
    const user = await AsyncStorage.getItem("mock_current_user");
    return !!user;
  },
  getCurrentUser: async () => {
    const user = await AsyncStorage.getItem("mock_current_user");
    return user ? JSON.parse(user) : null;
  },
};

// Mock Firestore with better typing
export const mockDb = {
  type: "firestore",
  app: {},
  toJSON: () => ({}),
  
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => ({
        exists: true,
        data: () => {
          if (name === "users") {
            return {
              id,
              name: "Mock User",
              email: "test@vanderbilt.edu",
              isVerified: true,
              createdAt: new Date().toISOString(),
              favorites: ["Taco Mama", "Bahn Mi & Roll"],
            };
          } else if (name === "restaurants") {
            return {
              id,
              name: "Mock Restaurant",
              location: "HILLSBORO VILLAGE",
              address: "123 Main St",
              cuisines: ["Mexican", "Asian"],
              acceptsCommodoreCash: true,
            };
          }
          return {};
        },
        id,
      }),
      set: async () => {},
      update: async () => {},
    }),
    add: async () => ({ id: `new-${Date.now()}` }),
    where: () => ({
      orderBy: () => ({
        get: async () => ({
          empty: false,
          docs: [
            {
              id: "mock-doc-1",
              data: () => ({ name: "Mock Item 1" }),
              exists: true,
            },
            {
              id: "mock-doc-2", 
              data: () => ({ name: "Mock Item 2" }),
              exists: true,
            },
          ],
          forEach: (callback: Function) => {
            callback({
              id: "mock-doc-1",
              data: () => ({ name: "Mock Item 1" }),
              exists: true,
            });
            callback({
              id: "mock-doc-2",
              data: () => ({ name: "Mock Item 2" }),
              exists: true,
            });
          },
        }),
      }),
      get: async () => ({
        empty: false,
        docs: [
          {
            id: "mock-doc-1",
            data: () => ({ name: "Mock Item 1" }),
            exists: true,
          },
          {
            id: "mock-doc-2", 
            data: () => ({ name: "Mock Item 2" }),
            exists: true,
          },
        ],
        forEach: (callback: Function) => {
          callback({
            id: "mock-doc-1",
            data: () => ({ name: "Mock Item 1" }),
            exists: true,
          });
          callback({
            id: "mock-doc-2",
            data: () => ({ name: "Mock Item 2" }),
            exists: true,
          });
        },
      }),
    }),
  }),
};