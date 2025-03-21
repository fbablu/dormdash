import React from "react";
import { render, screen } from "@testing-library/react-native";
import FavoritesScreen from "../app/(tabs)/profile/favorites";
import { describe, it, expect } from "@jest/globals";

// There are many mocks that are needed for the app to run.
// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(() => Promise.resolve(null)), // Simulating no stored favorites
}));

// Mock firebase
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
}));

// Mock firebase/firestore
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })), // Mocking an empty response
}));

// mock firebase/app
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
}));

// mock firebase/getStorage
jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  getDownloadURL: jest.fn(() => Promise.resolve("https://example.com/image.jpg")),
}));

// react-native-google-signin/google-signin
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: jest.fn(),
  GoogleSigninButton: jest.fn(),
  statusCodes: jest.fn(),
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Feather: (props) => <div {...props} />, // Mocking Feather as a functional component
  Ionicons: {
    loadFont: jest.fn(),
  },
}));

describe("FavoritesScreen", () => {
  it("renders the favorites screen with header text", async () => {
    render(<FavoritesScreen />);
    expect(screen.getByText("Saved Restaurants")).toBeTruthy();
  });
});

describe("Naive test", () => {
  it("run a naive test", async () => {
    expect(1 + 1).toBe(2);
  });
});

