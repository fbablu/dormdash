import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import OrdersScreen from "../app/(tabs)/orders";
import { CartProvider } from "../app/context/CartContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
}));

// Mock data for orders
const mockOrders = [
  {
    id: "1234",
    restaurantName: "Test Restaurant",
    items: [{ name: "Burger", quantity: 1 }],
    total: 10.99,
    date: new Date().toISOString(),
  },
  {
    id: "1235",
    restaurantName: "Another Restaurant",
    items: [{ name: "Pizza", quantity: 1 }],
    total: 12.99,
    date: new Date().toISOString(),
  },
];

// Mock the orders retrieval
jest.mock("../app/context/OrderContext", () => ({
  useOrder: () => ({
    orders: mockOrders,
  }),
}));

describe("<OrdersScreen />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders order list correctly", () => {
    const { getByText } = render(
      <CartProvider>
        <OrdersScreen />
      </CartProvider>,
    );

    expect(getByText("Order #1234")).toBeTruthy();
    expect(getByText("Order #1235")).toBeTruthy();
  });

  test("opens receipt modal on order click", async () => {
    const { getByText } = render(
      <CartProvider>
        <OrdersScreen />
      </CartProvider>,
    );

    fireEvent.press(getByText("Order #1234"));
    await waitFor(() => {
      expect(getByText("Receipt for Order #1234")).toBeTruthy();
      expect(getByText("Burger")).toBeTruthy();
    });
  });

  test("pressing 'Order Again' routes to cart", async () => {
    const mockPush = jest.fn();
    jest
      .spyOn(require("expo-router"), "useRouter")
      .mockReturnValue({ push: mockPush });

    const { getByText } = render(
      <CartProvider>
        <OrdersScreen />
      </CartProvider>,
    );

    fireEvent.press(getByText("Order #1234"));
    await waitFor(() => expect(getByText("Order Again")).toBeTruthy());

    fireEvent.press(getByText("Order Again"));
    expect(mockPush).toHaveBeenCalledWith("/tabs");
  });
});
