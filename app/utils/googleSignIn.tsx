// app/utils/googleSignIn.ts
import React from "react";
import { View, Text } from "react-native";

// Mock GoogleUser interface
export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  photo: string;
}

// Mock GoogleSignin class
class MockGoogleSignin {
  private static isSignedIn = false;
  private static user: GoogleUser | null = null;

  configure() {
    console.log("Mock GoogleSignin configured");
    return true;
  }

  hasPlayServices() {
    return Promise.resolve(true);
  }

  async signIn() {
    MockGoogleSignin.isSignedIn = true;
    MockGoogleSignin.user = {
      id: "google_" + Math.random().toString(36).substring(2),
      email: "mockuser@gmail.com",
      name: "Mock Google User",
      photo: "https://placeholder.com/150",
    };

    return { user: MockGoogleSignin.user };
  }

  async signOut() {
    MockGoogleSignin.isSignedIn = false;
    MockGoogleSignin.user = null;
    return true;
  }

  async isSignedIn() {
    return MockGoogleSignin.isSignedIn;
  }

  async getCurrentUser() {
    return MockGoogleSignin.user ? { user: MockGoogleSignin.user } : null;
  }
}

export const mockGoogleSignin = new MockGoogleSignin();

export const configureGoogleSignIn = () => {
  const googleSignin = new MockGoogleSignin();
  googleSignin.configure();
  return googleSignin;
};

// Default export component for Expo Router
const GoogleSignInComponent: React.FC = () => (
  <View style={{ display: "none" }}>
    <Text>Google Sign In</Text>
  </View>
);

export default GoogleSignInComponent;
