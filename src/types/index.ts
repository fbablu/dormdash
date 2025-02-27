// src/types/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Restaurant {
  id: number;
  name: string;
  location: string;
  address: string;
  website?: string;
  accepts_commodore_cash: boolean;
  cuisines: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  deliverer_id?: string;
  restaurant_id: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled';
  total_amount: number;
  delivery_fee: number;
  delivery_address: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  restaurant_name?: string;
  customer_name?: string;
}

export interface DeliveryRequest extends Order {
  restaurant_name: string;
  customer_name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface OrderData {
  restaurantId: number;
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: string;
  notes?: string;
}

export interface UserPayload {
  id: string;
  email: string;
  name: string;
}