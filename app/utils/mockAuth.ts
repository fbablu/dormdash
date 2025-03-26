// app/utils/mockAuth.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Auth } from "firebase/auth";
import { Firestore } from "firebase/firestore";

// Storage keys
const MOCK_USERS_KEY = "mock_users_db";
const CURRENT_USER_KEY = "mock_current_user";

// Initial mock users
const INITIAL_MOCK_USERS = [
  {
    uid: "mock-user-1",
    email: "test@vanderbilt.edu",
    password: "password123", // Store password for mock auth
    displayName: "Vanderbilt Student",
    photoURL: "https://randomuser.me/api/portraits/women/1.jpg",
    getIdToken: async () => "mock-token-12345",
    toJSON: () => ({}),
  },
  {
    uid: "mock-admin",
    email: "admin@gmail.com",
    password: "password123", // Store password for mock auth
    displayName: "Admin User",
    photoURL: "https://randomuser.me/api/portraits/men/1.jpg",
    getIdToken: async () => "mock-admin-token-12345",
    toJSON: () => ({}),
  },
];

// Initialize the mock user database in AsyncStorage if it doesn't exist
const initMockUsers = async () => {
  const existingUsers = await AsyncStorage.getItem(MOCK_USERS_KEY);
  if (!existingUsers) {
    await AsyncStorage.setItem(
      MOCK_USERS_KEY,
      JSON.stringify(INITIAL_MOCK_USERS),
    );
    console.log("Mock users initialized in AsyncStorage");
  }
};

// Call this at startup
initMockUsers();

// Helper to get all mock users from AsyncStorage
const getMockUsers = async () => {
  const usersJson = await AsyncStorage.getItem(MOCK_USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : INITIAL_MOCK_USERS;
};

// Helper to add a new user to the mock database
const addMockUser = async (newUser: {
  uid: string;
  email: string;
  password: string; // Store password for mock auth
  displayName: string;
  photoURL: null;
  getIdToken: () => Promise<string>;
  toJSON: () => {};
}) => {
  const users = await getMockUsers();
  users.push(newUser);
  await AsyncStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

// Firebase-compatible mock auth implementation
export const mockAuth = {
  currentUser: null,
  app: {},
  name: "auth",
  config: {},

  _a: {
    isProviderEnabled: () => true,
  },
  fetchProvidersForEmail: async () => [],
  settings: {
    appVerificationDisabledForTesting: true,
  },
  tenantId: null,

  // Required Auth properties and methods
  setPersistence: async () => {},
  languageCode: null,
  useDeviceLanguage: () => {},

  signInWithCustomToken: async () => {
    const users = await getMockUsers();
    return { user: users[0] };
  },
  signInAnonymously: async () => {
    const users = await getMockUsers();
    return { user: users[0] };
  },

  isProviderEnabled: () => true,
  fetchSignInMethodsForEmail: async () => [],
  getRedirectResult: async () => {
    const users = await getMockUsers();
    return { user: users[0] };
  },
  linkWithCredential: async () => {
    const users = await getMockUsers();
    return { user: users[0] };
  },
  _getRecaptchaConfig: () => ({}),
  _verifyPhoneNumber: async () => "verification-id",

  onAuthStateChanged: (callback: any) => {
    AsyncStorage.getItem(CURRENT_USER_KEY).then((user) => {
      if (user) {
        callback(JSON.parse(user));
      } else {
        callback(null);
      }
    });
    return () => {};
  },

  signInWithEmailAndPassword: async (email: string, password: string) => {
    const users = await getMockUsers();
    const user = users.find(
      (u: { email: string; password: string }) =>
        u.email === email && u.password === password,
    );

    if (!user) {
      throw new Error("auth/wrong-password");
    }

    // Store current user session
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return { user };
  },

  createUserWithEmailAndPassword: async (email: string, password: string) => {
    // Check if user already exists
    const users = await getMockUsers();
    const existingUser = users.find(
      (u: { email: string }) => u.email === email,
    );

    if (existingUser) {
      throw new Error("auth/email-already-in-use");
    }

    // Create new user with getIdToken function properly defined
    const newUser = {
      uid: `mock-${Date.now()}`,
      email,
      password,
      displayName: "",
      photoURL: null,
      getIdToken: async () => `mock-token-${Date.now()}`,
      toJSON: () => ({}),
      _a: {
        isProviderEnabled: () => true,
      },
    };

    // Add to mock database
    await addMockUser(newUser);

    // Set as current user
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    console.log(`Created new mock user: ${email}`);
    return { user: newUser };
  },

  signOut: async () => {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  },

  sendPasswordResetEmail: async (email: string) => {
    // Just pretend we sent an email
    console.log(`Password reset email sent to ${email}`);
  },

  updateProfile: async (user: any, { displayName, photoURL }: any) => {
    const currentUser = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (currentUser) {
      const updatedUser = JSON.parse(currentUser);
      if (displayName) updatedUser.displayName = displayName;
      if (photoURL) updatedUser.photoURL = photoURL;

      // Update in current session
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

      // Update in users database
      const users = await getMockUsers();
      const updatedUsers = users.map((u: { uid: any }) =>
        u.uid === updatedUser.uid ? { ...u, ...updatedUser } : u,
      );
      await AsyncStorage.setItem(MOCK_USERS_KEY, JSON.stringify(updatedUsers));

      return updatedUser;
    }
    return user;
  },
};

// Mock Google Sign-In
export const mockGoogleSignin = {
  configure: () => {},
  hasPlayServices: async () => true,
  signIn: async () => {
    const users = await getMockUsers();
    const user = users[0];
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return {
      idToken: "mock-token",
      user,
    };
  },
  signOut: async () => {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  },
  isSignedIn: async () => {
    const user = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return !!user;
  },
  getCurrentUser: async () => {
    const user = await AsyncStorage.getItem(CURRENT_USER_KEY);
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
      set: async (data: any) => {
        console.log(`Mock DB: Setting ${name}/${id} with data:`, data);
      },
      update: async (data: any) => {
        console.log(`Mock DB: Updating ${name}/${id} with data:`, data);
      },
    }),
    add: async (data: any) => {
      const id = `new-${Date.now()}`;
      console.log(`Mock DB: Adding to ${name} with ID ${id}:`, data);
      return { id };
    },
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

export default mockGoogleSignin;
