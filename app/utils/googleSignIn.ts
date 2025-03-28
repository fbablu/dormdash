// app/utils/googleSignIn.ts
// Simplified mock implementation for Expo Go

import { mockGoogleSignin } from "./mockAuth";

// Since we're in Expo Go branch, always use mock implementation
console.log("Using mock Google Sign-In for Expo Go");

// Export configuration function (does nothing in Expo Go)
export const configureGoogleSignIn = () => {
  console.log("Mock Google Sign-In configured");
};

// Create mock button component
const MockGoogleSigninButton = null;

// Export mock implementations
export default mockGoogleSignin;
export { MockGoogleSigninButton as GoogleSigninButton };
