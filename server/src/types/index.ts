// src/types/index.ts
// Contributor: @Fardeen Bablu
// time spent: 25 minutes

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  imageUrl?: string;
  isVanderbiltUser: boolean;
  role: 'user' | 'admin' | 'restaurant_owner' | 'deliverer';
  createdAt: Date;
  updatedAt: Date;
  dormLocation?: string;
  favorites?: string[];
}

// Restaurant types
export interface Restaurant {
  id: string;
  name: string;
  location: string;
  address: string;
  website?: string;
  imageUrl?: string;
  cuisines: string[];
  acceptsCommodoreCash: boolean;
  rating?: number;
  reviewCount?: number;
  deliveryTime?: string;
  deliveryFee?: number;
  ownerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  available: boolean;
  popular?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  restaurantId: string;
  items?: MenuItem[];
}

// Order types
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled';
  timestamp: Date;
  paymentMethod: 'commodore_cash' | 'credit_card' | 'paypal';
  delivererId?: string;
  notes?: string;
  deliveryAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

// Review types
export interface Review {
  id: string;
  userId: string;
  userName: string;
  restaurantId: string;
  rating: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}