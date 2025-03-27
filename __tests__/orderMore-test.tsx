import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OrdersScreen from '../app/(tabs)/orders'; // Adjust path as needed
import { CartProvider } from '../app/context/CartContext';
import { AuthProvider } from '../app/context/AuthContext';

// Mock necessary dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  Link: () => null,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock order data
const mockOrders = [
  {
    id: '1',
    restaurantName: 'Pizza Palace',
    total: 15.99,
    date: '2023-06-15T10:30:00Z',
    items: [
      { name: 'Pepperoni Pizza', quantity: 1, price: 12.99 },
      { name: 'Garlic Bread', quantity: 1, price: 3.00 }
    ]
  },
  {
    id: '2',
    restaurantName: 'Burger Joint',
    total: 18.50,
    date: '2023-06-14T18:45:00Z',
    items: [
      { name: 'Cheeseburger', quantity: 1, price: 10.50 },
      { name: 'Fries', quantity: 1, price: 3.00 },
      { name: 'Milkshake', quantity: 1, price: 5.00 }
    ]
  }
];

// Mock the order context or service
jest.mock('../app/context/OrderContext', () => ({
  useOrder: () => ({
    orders: mockOrders
  })
}));

describe('<OrdersScreen />', () => {
  // Test that the screen renders without crashing
  test('renders orders screen', () => {
    const { getByText } = render(
      <AuthProvider>
        <CartProvider>
          <OrdersScreen />
        </CartProvider>
      </AuthProvider>
    );

    // Check for the title
    expect(getByText('My Orders')).toBeTruthy();
  });

  // Test that order details are displayed
  test('displays order details', () => {
    const { getByText } = render(
      <AuthProvider>
        <CartProvider>
          <OrdersScreen />
        </CartProvider>
      </AuthProvider>
    );

    // Check for restaurant names
    expect(getByText('Pizza Palace')).toBeTruthy();
    expect(getByText('Burger Joint')).toBeTruthy();

    // Check for order totals
    expect(getByText('$15.99')).toBeTruthy();
    expect(getByText('$18.50')).toBeTruthy();
  });

  // Test order interaction (if applicable)
  test('can interact with order', () => {
    const mockPush = jest.fn();
    jest.spyOn(require('expo-router'), 'useRouter').mockReturnValue({ push: mockPush });

    const { getByText } = render(
      <AuthProvider>
        <CartProvider>
          <OrdersScreen />
        </CartProvider>
      </AuthProvider>
    );

    // Simulate pressing on an order (adjust based on your actual implementation)
    const firstOrder = getByText('Pizza Palace');
    fireEvent.press(firstOrder);

    // You might want to add expectations based on what should happen when an order is pressed
    // For example, checking if a modal opens or if navigation occurs
  });
});