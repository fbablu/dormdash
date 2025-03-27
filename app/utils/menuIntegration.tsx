// app/utils/menuIntegration.ts
// Contributor: @Fardeen Bablu
// Time spent: 3.5 hours

import React from "react";
import { View, Text } from "react-native";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Restaurant } from "../types/restaurants";

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

/**
 * Add or update a restaurant menu in Firebase
 * @param restaurantId The restaurant ID
 * @param categories Array of menu categories
 * @returns Promise that resolves when the menu is added
 */
export const updateRestaurantMenu = async (
  restaurantId: string,
  categories: Omit<MenuCategory, "id">[],
): Promise<string[]> => {
  try {
    const categoryIds: string[] = [];

    // Get existing menu categories to avoid duplication
    const menuRef = collection(db, "restaurants", restaurantId, "menu");
    const menuSnapshot = await getDocs(menuRef);
    const existingCategories = new Map();
    menuSnapshot.forEach((doc) => {
      existingCategories.set(doc.data().name.toLowerCase(), doc.id);
    });

    // Add or update each category
    for (const category of categories) {
      let categoryId: string;
      const categoryLower = category.name.toLowerCase();

      if (existingCategories.has(categoryLower)) {
        // Update existing category
        categoryId = existingCategories.get(categoryLower);
        await setDoc(
          doc(db, "restaurants", restaurantId, "menu", categoryId),
          category,
        );
      } else {
        // Add new category - generate an ID based on the name
        categoryId = categoryLower.replace(/[^a-z0-9]/g, "-");
        await setDoc(
          doc(db, "restaurants", restaurantId, "menu", categoryId),
          category,
        );
      }

      categoryIds.push(categoryId);
    }

    console.log(`Successfully updated menu for restaurant ${restaurantId}`);
    return categoryIds;
  } catch (error) {
    console.error(`Error updating menu for restaurant ${restaurantId}:`, error);
    throw error;
  }
};

/**
 * Find a restaurant by name in Firebase
 * @param name The restaurant name to search for
 * @returns Promise that resolves to the restaurant ID or null if not found
 */
export const findRestaurantByName = async (
  name: string,
): Promise<string | null> => {
  try {
    const restaurantsRef = collection(db, "restaurants");
    const q = query(restaurantsRef, where("name", "==", name));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`Restaurant "${name}" not found`);
      return null;
    }

    return querySnapshot.docs[0].id;
  } catch (error) {
    console.error(`Error finding restaurant "${name}":`, error);
    throw error;
  }
};

/**
 * Add or update a restaurant in Firebase
 * @param restaurant The restaurant data
 * @param id Optional ID for the restaurant (if updating existing)
 * @returns Promise that resolves to the restaurant ID
 */
export const saveRestaurant = async (
  restaurant: Restaurant,
  id?: string,
): Promise<string> => {
  try {
    let restaurantId = id;
    if (!restaurantId) {
      // Generate ID from name if not provided
      restaurantId = restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    }

    // Add or update restaurant
    await setDoc(doc(db, "restaurants", restaurantId), {
      ...restaurant,
    });

    console.log(
      `Successfully saved restaurant "${restaurant.name}" with ID ${restaurantId}`,
    );
    return restaurantId;
  } catch (error) {
    console.error(`Error saving restaurant "${restaurant.name}":`, error);
    throw error;
  }
};

/**
 * Helper function to generate a unique ID for menu items
 * @param name Item name
 * @returns Unique ID string
 */
export const generateMenuItemId = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-");
};

// Parse the raw menu text and structure it for Firebase
export const parseRawMenuText = (menuText: string): MenuCategory[] => {
  // Simple parsing logic - this would need to be customized based on the format
  // of your menu text. This is just a placeholder.
  const categories: MenuCategory[] = [];

  // Example parsing logic
  const lines = menuText.split("\n");
  let currentCategory: MenuCategory | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) continue;

    // Check if this line is a category header (all caps)
    if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3) {
      if (currentCategory && currentCategory.items.length > 0) {
        categories.push(currentCategory);
      }
      currentCategory = {
        id: generateMenuItemId(trimmedLine),
        name: trimmedLine,
        items: [],
      };
    }
    // Check if this line might be a menu item (contains a price)
    else if (currentCategory && trimmedLine.includes("$")) {
      const priceMatch = trimmedLine.match(/\$(\d+(\.\d+)?)/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1]);
        const nameAndDescription = trimmedLine.split("$")[0].trim();
        // Split into name and description if possible
        const parts = nameAndDescription.split(" - ");
        const name = parts[0].trim();
        const description = parts.length > 1 ? parts[1].trim() : "";

        currentCategory.items.push({
          id: generateMenuItemId(name),
          name,
          description,
          price,
        });
      }
    }
  }

  // Add the last category if it exists
  if (currentCategory && currentCategory.items.length > 0) {
    categories.push(currentCategory);
  }

  return categories;
};

// Required default export for Expo Router
const MenuIntegration: React.FC = () => {
  return (
    <View style={{ display: "none" }}>
      <Text>Menu Integration Utilities</Text>
    </View>
  );
};

export default MenuIntegration;
