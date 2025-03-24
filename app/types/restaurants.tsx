// app/types/restaurants.tsx
// Contributors: @Fardeen Bablu
// Time spent: 45 mins

import React from "react";
import { View, Text } from "react-native";

export type Location =
  | "HILLSBORO VILLAGE"
  | "MIDTOWN"
  | "WEST END AVENUE"
  | "ELLISTON PLACE"
  | "ON-CAMPUS"
  | "KOSHER/OUT OF CAMPUS RADIUS";

export type Cuisine =
  | "Vietnamese"
  | "Asian"
  | "Coffee"
  | "Cafe"
  | "American"
  | "Breakfast"
  | "BBQ"
  | "Healthy"
  | "Bowls"
  | "Smoothies"
  | "Sandwiches"
  | "Burgers"
  | "Ice Cream"
  | "Desserts"
  | "Noodles"
  | "Chinese"
  | "Japanese"
  | "Sushi"
  | "Mexican"
  | "Tacos"
  | "Juice"
  | "Tex-Mex"
  | "Pizza"
  | "Italian"
  | "Southern"
  | "Chicken"
  | "Hawaiian"
  | "Poke"
  | "Indian"
  | "Fast Food"
  | "Asian Fusion"
  | "Diner"
  | "Pasta"
  | "Thai"
  | "Bubble Tea"
  | "Beverages"
  | "Kosher"
  | "Vegetarian";

export interface Restaurant {
  id?: string;
  name: string;
  location: Location;
  address: string;
  website: string;
  cuisine: Cuisine[];
  acceptsCommodoreCash: boolean;
  image?: string;
  rating?: number;
  reviewCount?: string;
  deliveryTime?: string;
  deliveryFee?: number;
}

export type Restaurants = Restaurant[];

// Default export component to satisfy router requirement
export default function RestaurantTypes() {
  return (
    <View>
      <Text>Restaurant Types Component</Text>
    </View>
  );
}
