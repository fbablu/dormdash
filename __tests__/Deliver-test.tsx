import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react-native";
import Deliver from "../app/(tabs)/deliver";
import { Alert, Text } from "react-native";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(),
}));

// Mock useAuth hook
jest.mock("@/app/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user123", name: "Test User" },
  }),
}));

// Mock Feather icon
jest.mock("@expo/vector-icons", () => {
    const { Text } = require("react-native"); // ✅ In-scope
    return {
        Feather: ({ name }) => <Text>{name}</Text>,
    };
});

// Mock Alert
jest.spyOn(Alert, "alert");

// Basic smoke test
describe("Deliver Screen", () => {
  it("renders header and offline message by default", async () => {
    render(<Deliver />);
    expect(screen.getByText("Deliver")).toBeTruthy();
    expect(screen.getByText("You are currently offline")).toBeTruthy();
  });

  it("toggles to online state and shows 'Ready to Deliver!'", async () => {
    render(<Deliver />);
    const toggleButton = screen.getByText("You are Offline");

    fireEvent.press(toggleButton);
    await waitFor(() => {
      expect(screen.getByText("You are Online")).toBeTruthy();
      expect(screen.getByText("Ready to Deliver!")).toBeTruthy();
    });
  });

  it("shows empty state if there are no delivery requests", async () => {
    render(<Deliver />);
    fireEvent.press(screen.getByText("You are Offline")); // Go online

    await waitFor(() => {
      expect(screen.getByText("No delivery requests available")).toBeTruthy();
    });
  });

  it("shows visibility options when visibility config is pressed", () => {
    render(<Deliver />);
    const configButton = screen.getByText("You are Offline");

    fireEvent.press(configButton);
    expect(screen.getByText("Go Online")).toBeTruthy();
    expect(screen.getByText("Go Offline")).toBeTruthy();
  });
});
