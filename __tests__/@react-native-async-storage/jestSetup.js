import "@testing-library/jest-native/extend-expect";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
  Link: () => null,
  router: {
    push: jest.fn(),
  },
}));

// Silence warnings
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");
