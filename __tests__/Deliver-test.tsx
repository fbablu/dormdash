import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react-native";
import Deliver from "../app/(tabs)/deliver";
import { Alert, Text } from "react-native";

// Mocks for AsyncStorage
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: (...args) => mockGetItem(...args),
  setItem: (...args) => mockSetItem(...args),
}));

// Mock useAuth with a basic user
jest.mock("@/app/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user123", name: "Test User" },
  }),
}));

// Mock Feather icon
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Feather: ({ name }) => <Text>{name}</Text>,
  };
});

// Mock Alert
jest.spyOn(Alert, "alert");

const pendingOrder = {
  id: "order001",
  customerId: "cust123",
  restaurantId: "rest1",
  restaurantName: "Mock Kitchen",
  items: [],
  totalAmount: "20.00",
  deliveryFee: "3.00",
  status: "pending",
  timestamp: "2024-01-01T12:00:00Z",
  paymentMethod: "card",
};

const acceptedOrder = {
  ...pendingOrder,
  status: "accepted",
  delivererId: "user123",
};

const pickedUpOrder = {
  ...acceptedOrder,
  status: "picked_up",
};

describe("Deliver.tsx screen behavior", () => {
  beforeEach(() => {
    mockGetItem.mockReset();
    mockSetItem.mockReset();
    Alert.alert.mockReset();
  });

  it("renders header and offline state by default", () => {
    render(<Deliver />);
    expect(screen.getByText("Deliver")).toBeTruthy();
    expect(screen.getByText("You are currently offline")).toBeTruthy();
  });

  it("toggles online and renders empty state when no orders", async () => {
    mockGetItem.mockResolvedValueOnce(null); // No orders in storage

    render(<Deliver />);
    fireEvent.press(screen.getByText("You are Offline"));

    await waitFor(() => {
      expect(screen.getByText("Ready to Deliver!")).toBeTruthy();
      expect(screen.getByText("No delivery requests available")).toBeTruthy();
    });
  });

  it("shows visibility options when config is pressed", () => {
    render(<Deliver />);
    fireEvent.press(screen.getByText("You are Offline"));
    fireEvent.press(screen.getByText("You are Online"));

    expect(screen.getByText("Go Online")).toBeTruthy();
    expect(screen.getByText("Go Offline")).toBeTruthy();
  });

  it("accepts a delivery request", async () => {
    mockGetItem
      .mockResolvedValueOnce(JSON.stringify([pendingOrder])) // fetchDeliveryRequests
      .mockResolvedValueOnce(JSON.stringify([pendingOrder])) // handleAcceptDelivery
      .mockResolvedValueOnce(JSON.stringify([acceptedOrder])); // after accept

    render(<Deliver />);
    fireEvent.press(screen.getByText("You are Offline"));

    await waitFor(() => {
      expect(screen.getByText("Mock Kitchen")).toBeTruthy();
      expect(screen.getByText("Accept")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Accept"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Success", "Delivery request accepted!");
    });
  });

  it("updates delivery status to picked up and then delivered", async () => {
    mockGetItem
      .mockResolvedValueOnce(JSON.stringify([acceptedOrder])) // fetchDeliveryRequests
      .mockResolvedValueOnce(JSON.stringify([acceptedOrder])) // picked_up update
      .mockResolvedValueOnce(JSON.stringify([pickedUpOrder])); // delivered update

    render(<Deliver />);
    fireEvent.press(screen.getByText("You are Offline"));

    await waitFor(() => {
      expect(screen.getByText("Picked Up")).toBeTruthy();
      expect(screen.getByText("Delivered")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Picked Up"));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Success", "Order marked as picked up!");
    });

    fireEvent.press(screen.getByText("Delivered"));
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Success", "Delivery marked as completed!");
    });
  });

  it("does not accept orders if user is the customer", async () => {
    const ownOrder = { ...pendingOrder, customerId: "user123" };
    mockGetItem.mockResolvedValueOnce(JSON.stringify([ownOrder]));

    render(<Deliver />);
    fireEvent.press(screen.getByText("You are Offline"));

    await waitFor(() => {
      expect(screen.getByText("Your Order")).toBeTruthy();
    });

    // Accept button should NOT exist
    expect(screen.queryByText("Accept")).toBeNull();
  });

  it("handles error during fetch gracefully", async () => {
    mockGetItem.mockRejectedValueOnce(new Error("Async error"));

    render(<Deliver />);
    fireEvent.press(screen.getByText("You are Offline"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to fetch delivery requests");
    });
  });
});
