// app/services/restaurantService.ts
// Contributors: @Fardeen Bablu
// Time spent: 3 hours

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  name: string;
  location: string;
  address: string;
  website: string;
  image: string;
  cuisines: string[];
  acceptsCommodoreCash: boolean;
  rating?: number;
  reviewCount?: string;
  deliveryTime?: string;
  deliveryFee?: number;
}

// Get a restaurant by ID
export const getRestaurantById = async (
  id: string,
): Promise<Restaurant | null> => {
  try {
    const restaurantRef = doc(db, "restaurants", id);
    const restaurantSnap = await getDoc(restaurantRef);

    if (!restaurantSnap.exists()) {
      return null;
    }

    return {
      id: restaurantSnap.id,
      ...(restaurantSnap.data() as Omit<Restaurant, "id">),
    };
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    throw error;
  }
};

// Get all restaurants
export const getAllRestaurants = async (): Promise<Restaurant[]> => {
  try {
    const restaurantsRef = collection(db, "restaurants");
    const restaurantsSnap = await getDocs(restaurantsRef);

    const restaurants: Restaurant[] = [];
    restaurantsSnap.forEach((doc) => {
      restaurants.push({
        id: doc.id,
        ...(doc.data() as Omit<Restaurant, "id">),
      });
    });

    return restaurants;
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    throw error;
  }
};

// Get menu categories for a restaurant
export const getRestaurantMenu = async (
  restaurantId: string,
): Promise<MenuCategory[]> => {
  try {
    const menuRef = collection(db, "restaurants", restaurantId, "menu");
    const menuSnap = await getDocs(menuRef);

    const categories: MenuCategory[] = [];
    menuSnap.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...(doc.data() as Omit<MenuCategory, "id">),
      });
    });

    return categories;
  } catch (error) {
    console.error("Error fetching restaurant menu:", error);
    throw error;
  }
};

// Add or update a restaurant
export const saveRestaurant = async (
  restaurant: Omit<Restaurant, "id">,
  id?: string,
): Promise<string> => {
  try {
    if (id) {
      // Update existing restaurant
      await setDoc(doc(db, "restaurants", id), restaurant);
      return id;
    } else {
      // Add new restaurant
      const restaurantRef = await addDoc(
        collection(db, "restaurants"),
        restaurant,
      );
      return restaurantRef.id;
    }
  } catch (error) {
    console.error("Error saving restaurant:", error);
    throw error;
  }
};

// Add a menu category to a restaurant
export const addMenuCategory = async (
  restaurantId: string,
  category: Omit<MenuCategory, "id">,
): Promise<string> => {
  try {
    const categoryRef = await addDoc(
      collection(db, "restaurants", restaurantId, "menu"),
      category,
    );
    return categoryRef.id;
  } catch (error) {
    console.error("Error adding menu category:", error);
    throw error;
  }
};

// Update a menu category
export const updateMenuCategory = async (
  restaurantId: string,
  categoryId: string,
  category: Omit<MenuCategory, "id">,
): Promise<void> => {
  try {
    await setDoc(
      doc(db, "restaurants", restaurantId, "menu", categoryId),
      category,
    );
  } catch (error) {
    console.error("Error updating menu category:", error);
    throw error;
  }
};
