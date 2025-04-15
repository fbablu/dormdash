// app/utils/RestaurantMenuIntegration.tsx
// Helper file to access restaurant menus stored by restaurant owners

import AsyncStorage from "@react-native-async-storage/async-storage";

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

// Function to get menu for a specific restaurant
export const getRestaurantMenu = async (
  restaurantId: string,
): Promise<MenuCategory[] | null> => {
  try {
    // First check global menu registry
    const allMenusJson = await AsyncStorage.getItem("all_restaurant_menus");
    if (allMenusJson) {
      const allMenus = JSON.parse(allMenusJson);
      if (allMenus[restaurantId]) {
        console.log(`Found menu for ${restaurantId} in global registry`);
        return allMenus[restaurantId];
      }
    }

    // If not in global registry, try restaurant-specific storage
    const menuJson = await AsyncStorage.getItem(`menu_${restaurantId}`);
    if (menuJson) {
      console.log(
        `Found menu for ${restaurantId} in restaurant-specific storage`,
      );
      return JSON.parse(menuJson);
    }

    // If no menu found, return null
    console.log(`No menu found for ${restaurantId}`);
    return null;
  } catch (error) {
    console.error(`Error getting menu for ${restaurantId}:`, error);
    return null;
  }
};

// Function to get all available restaurant menus
export const getAllRestaurantMenus = async (): Promise<
  Record<string, MenuCategory[]>
> => {
  try {
    const allMenusJson = await AsyncStorage.getItem("all_restaurant_menus");
    return allMenusJson ? JSON.parse(allMenusJson) : {};
  } catch (error) {
    console.error("Error getting all restaurant menus:", error);
    return {};
  }
};

// Function to check if a restaurant has a menu
export const hasMenu = async (restaurantId: string): Promise<boolean> => {
  try {
    const menu = await getRestaurantMenu(restaurantId);
    return !!menu;
  } catch (error) {
    console.error(
      `Error checking if restaurant ${restaurantId} has a menu:`,
      error,
    );
    return false;
  }
};

// Function to create a demo menu for testing
export const createDemoMenu = async (
  restaurantId: string,
): Promise<boolean> => {
  try {
    const demoMenu: MenuCategory[] = [
      {
        id: "sandwiches",
        name: "Sandwiches",
        items: [
          {
            id: "veggie-delight",
            name: "Veggie Delight",
            description: "Fresh vegetables on whole grain bread",
            price: 8.99,
          },
          {
            id: "turkey-club",
            name: "Turkey Club",
            description: "Turkey, bacon, lettuce, and tomato on sourdough",
            price: 10.99,
          },
        ],
      },
      {
        id: "bowls",
        name: "Bowls",
        items: [
          {
            id: "power-bowl",
            name: "Power Bowl",
            description: "Quinoa, roasted vegetables, and feta cheese",
            price: 12.99,
          },
          {
            id: "acai-bowl",
            name: "Acai Bowl",
            description: "Acai berries, granola, and fresh fruit",
            price: 9.99,
          },
        ],
      },
      {
        id: "drinks",
        name: "Drinks",
        items: [
          {
            id: "smoothie",
            name: "Fruit Smoothie",
            description: "Blend of seasonal fruits and yogurt",
            price: 5.99,
          },
          {
            id: "green-juice",
            name: "Green Juice",
            description: "Kale, spinach, apple, and ginger",
            price: 6.99,
          },
        ],
      },
    ];

    // Save to global registry
    const allMenus = JSON.parse(
      (await AsyncStorage.getItem("all_restaurant_menus")) || "{}",
    );
    allMenus[restaurantId] = demoMenu;
    await AsyncStorage.setItem(
      "all_restaurant_menus",
      JSON.stringify(allMenus),
    );

    // Also save to restaurant-specific storage
    await AsyncStorage.setItem(
      `menu_${restaurantId}`,
      JSON.stringify(demoMenu),
    );

    console.log(`Created demo menu for ${restaurantId}`);
    return true;
  } catch (error) {
    console.error(`Error creating demo menu for ${restaurantId}:`, error);
    return false;
  }
};

export default {
  getRestaurantMenu,
  getAllRestaurantMenus,
  hasMenu,
  createDemoMenu,
};
