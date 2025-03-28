// lib/data/dataLoader.ts
// Contributor: @Fardeen Bablu
// Time spent: 45 minutes

import AsyncStorage from "@react-native-async-storage/async-storage";
import restaurants from "@/data/ton_restaurants.json";
import dorms from "@/data/dorms.json";

// Initialize data in AsyncStorage
export const initializeLocalData = async () => {
  try {
    // Check if already initialized
    const initialized = await AsyncStorage.getItem("data_initialized");
    if (initialized === "true") return;

    // Store restaurants with location data
    await AsyncStorage.setItem("restaurants_data", JSON.stringify(restaurants));

    // Store dorms with location data
    await AsyncStorage.setItem("dorms_data", JSON.stringify(dorms));

    // Mark as initialized
    await AsyncStorage.setItem("data_initialized", "true");
    console.log("Location data initialized successfully");
  } catch (error) {
    console.error("Error initializing location data:", error);
  }
};

// Get restaurants from local storage
export const getRestaurants = async () => {
  try {
    const data = await AsyncStorage.getItem("restaurants_data");
    return data ? JSON.parse(data) : restaurants;
  } catch (error) {
    console.error("Error loading restaurants:", error);
    return restaurants; // Fallback to imported data
  }
};

// Get dorms from local storage
export const getDorms = async () => {
  try {
    const data = await AsyncStorage.getItem("dorms_data");
    return data ? JSON.parse(data) : dorms;
  } catch (error) {
    console.error("Error loading dorms:", error);
    return dorms; // Fallback to imported data
  }
};

// Calculate distance between two coordinates in kilometers
export const calculateDistance = (coords1: string, coords2: string): number => {
  const [lat1, lon1] = coords1
    .split(",")
    .map((coord) => parseFloat(coord.trim()));
  const [lat2, lon2] = coords2
    .split(",")
    .map((coord) => parseFloat(coord.trim()));

  // Earth radius in kilometers
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

// Calculate estimated delivery time based on distance
export const calculateEstimatedTime = (distance: number): number => {
  // Average speed: 20 km/h for campus delivery
  const avgSpeed = 20;

  // Base time for order preparation (minutes)
  const baseTime = 10;

  // Calculate travel time in minutes
  const travelTime = (distance / avgSpeed) * 60;

  // Total estimated time in minutes
  return Math.round(baseTime + travelTime);
};
