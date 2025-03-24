// app/utils/menuParser.ts
// Contributor: @Fardeen Bablu
// Time spent: 2 hours

import { doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { generateMenuItemId } from "./menuIntegration";

// Firebase expected format
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  notes?: string;
  extras?: string[];
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

// Taco Mama specific format
export interface TacoMamaMenu {
  menu: {
    build_your_own: Array<{
      name: string;
      description: string;
      extras?: string[];
    }>;
    proteins: Array<{
      name: string;
      price: number;
      note?: string;
    }>;
    fresh_free_toppings: string[];
    salsa_sauces: string[];
    taco_baskets: Array<{
      name: string;
      price: number | string;
      description?: string;
    }>;
    burrito_baskets: Array<{
      name: string;
      price: number | string;
      description?: string;
    }>;
    drinks: {
      beer: {
        imports: number;
        domestic: number;
      };
      wine: {
        options: string[];
        price: number;
      };
      margaritas: {
        flavors: Record<string, number>;
      };
    };
    catering: Record<string, any>;
    contact: {
      order_online: string;
      catering_email: string;
      phone: string;
    };
  };
}

/**
 * Transform the specific restaurant menu format into the standard Firebase format
 * @param menuJson The restaurant menu data
 * @returns Array of menu categories in Firebase format
 */
export function transformMenuToFirebaseFormat(menuJson: any): MenuCategory[] {
  // Check if it's a Taco Mama style menu with top-level "menu" property
  const menu = menuJson.menu ? menuJson.menu : menuJson;
  const categories: MenuCategory[] = [];

  // Handle build_your_own section
  if (menu.build_your_own && menu.build_your_own.length > 0) {
    const buildYourOwnItems: MenuItem[] = menu.build_your_own.map(
      (item: any) => ({
        id: generateMenuItemId(item.name),
        name: item.name,
        description: item.description || "",
        price: 0, // Price depends on protein, set to 0 by default
        extras: item.extras,
      }),
    );

    categories.push({
      id: "build-your-own",
      name: "Build Your Own",
      items: buildYourOwnItems,
    });
  }

  // Handle proteins section
  if (menu.proteins && menu.proteins.length > 0) {
    const proteinItems: MenuItem[] = menu.proteins.map((item: any) => ({
      id: generateMenuItemId(item.name),
      name: item.name,
      description: item.note || "",
      price:
        typeof item.price === "number"
          ? item.price
          : parseFloat(String(item.price)) || 0,
    }));

    categories.push({
      id: "proteins",
      name: "Proteins",
      items: proteinItems,
    });
  }

  // Handle taco_baskets section
  if (menu.taco_baskets && menu.taco_baskets.length > 0) {
    const tacoItems: MenuItem[] = menu.taco_baskets.map((item: any) => ({
      id: generateMenuItemId(item.name),
      name: item.name,
      description: item.description || "2 tacos with chips & salsa + a side",
      price:
        typeof item.price === "number"
          ? item.price
          : item.price === "Market Price"
            ? 0
            : parseFloat(String(item.price)) || 0,
      notes: item.price === "Market Price" ? "Market Price" : undefined,
    }));

    categories.push({
      id: "taco-baskets",
      name: "Taco Baskets",
      items: tacoItems,
    });
  }

  // Handle burrito_baskets section
  if (menu.burrito_baskets && menu.burrito_baskets.length > 0) {
    const burritoItems: MenuItem[] = menu.burrito_baskets.map((item: any) => ({
      id: generateMenuItemId(item.name),
      name: item.name,
      description: item.description || "Burrito with chips & salsa + a side",
      price:
        typeof item.price === "number"
          ? item.price
          : parseFloat(String(item.price)) || 0,
    }));

    categories.push({
      id: "burrito-baskets",
      name: "Burrito Baskets",
      items: burritoItems,
    });
  }

  // Handle drinks section
  if (menu.drinks) {
    const drinks = menu.drinks;
    const drinkItems: MenuItem[] = [];

    // Beer
    if (drinks.beer) {
      drinkItems.push({
        id: "domestic-beer",
        name: "Domestic Beer",
        description: "Assorted domestic beers",
        price: drinks.beer.domestic || 0,
      });
      drinkItems.push({
        id: "imported-beer",
        name: "Imported Beer",
        description: "Assorted imported beers",
        price: drinks.beer.imports || 0,
      });
    }

    // Wine
    if (drinks.wine) {
      drinks.wine.options.forEach((wine: string) => {
        drinkItems.push({
          id: generateMenuItemId(wine),
          name: wine,
          description: "Glass of wine",
          price: drinks.wine.price || 0,
        });
      });
    }

    // Margaritas
    if (drinks.margaritas && drinks.margaritas.flavors) {
      Object.entries(drinks.margaritas.flavors).forEach(([name, price]) => {
        drinkItems.push({
          id: generateMenuItemId(name),
          name: name + " Margarita",
          description: "",
          price:
            typeof price === "number" ? price : parseFloat(String(price)) || 0,
        });
      });
    }

    if (drinkItems.length > 0) {
      categories.push({
        id: "drinks",
        name: "Drinks",
        items: drinkItems,
      });
    }
  }

  // Create a sides category from toppings and sauces
  const sideItems: MenuItem[] = [];

  // Add fresh_free_toppings as sides with price 0
  if (menu.fresh_free_toppings && menu.fresh_free_toppings.length > 0) {
    menu.fresh_free_toppings.forEach((topping: string) => {
      sideItems.push({
        id: generateMenuItemId(topping),
        name: topping,
        description: "Fresh topping",
        price: 0,
      });
    });
  }

  // Add salsa_sauces as sides with price 0
  if (menu.salsa_sauces && menu.salsa_sauces.length > 0) {
    menu.salsa_sauces.forEach((sauce: string) => {
      sideItems.push({
        id: generateMenuItemId(sauce),
        name: sauce,
        description: "Salsa or sauce",
        price: 0,
      });
    });
  }

  if (sideItems.length > 0) {
    categories.push({
      id: "sides-and-extras",
      name: "Sides & Extras",
      items: sideItems,
    });
  }

  // Add catering as its own category if it exists
  if (menu.catering) {
    const cateringItems: MenuItem[] = [];

    // Taco nacho bar
    if (menu.catering.taco_nacho_bar) {
      cateringItems.push({
        id: "taco-nacho-bar",
        name: "Taco & Nacho Bar",
        description: "Feeds 10+ people - $15/person",
        price: menu.catering.taco_nacho_bar.price_per_person || 15,
      });
    }

    // Happy family meal
    if (menu.catering.happy_family_meal) {
      cateringItems.push({
        id: "happy-family-meal",
        name: "Happy Family Take Out Meal",
        description:
          "Feeds 4 to 5 comfortably: 12 soft tortillas, tortilla chips, pint of chicken, pint of ground beef, pint of black beans, pint of cilantro lime rice, pint of queso, pint of mild salsa, tomatoes, cheese, sour cream.",
        price: menu.catering.happy_family_meal.price || 54,
      });
    }

    // Margarita mix
    if (menu.catering.margarita_mix) {
      cateringItems.push({
        id: "margarita-mix-half-gallon",
        name: "Margarita Mix (Half Gallon)",
        description: "Skinny or Mi Casa Margarita mix",
        price: menu.catering.margarita_mix.half_gallon || 10,
      });

      cateringItems.push({
        id: "margarita-mix-gallon",
        name: "Margarita Mix (One Gallon)",
        description: "Skinny or Mi Casa Margarita mix",
        price: menu.catering.margarita_mix.one_gallon || 20,
      });
    }

    if (cateringItems.length > 0) {
      categories.push({
        id: "catering",
        name: "Catering",
        items: cateringItems,
      });
    }
  }

  return categories;
}

/**
 * Parse and upload a restaurant menu JSON to Firebase
 * @param restaurantId The restaurant ID
 * @param menuJson The restaurant menu data
 * @returns Promise that resolves to true if successful
 */
export const parseAndUploadMenuJson = async (
  restaurantId: string,
  menuJson: any,
): Promise<boolean> => {
  try {
    // Transform the menu to Firebase format
    const categories = transformMenuToFirebaseFormat(menuJson);

    // Upload each category and its items
    for (const category of categories) {
      const categoryRef = doc(
        db,
        "restaurants",
        restaurantId,
        "menu",
        category.id,
      );
      await setDoc(categoryRef, {
        name: category.name,
        items: category.items,
      });
      console.log(`Uploaded category: ${category.name} for ${restaurantId}`);
    }

    return true;
  } catch (error) {
    console.error(
      `Error parsing and uploading menu for ${restaurantId}:`,
      error,
    );
    return false;
  }
};

// Function to upload Taco Mama menu
export const uploadTacoMamaMenu = async (): Promise<boolean> => {
  try {
    // Import the menu data
    const tacoMamaMenu = require("../data/taco-mama-menu.json");
    return await parseAndUploadMenuJson("taco-mama", tacoMamaMenu);
  } catch (error) {
    console.error("Error uploading Taco Mama menu:", error);
    return false;
  }
};

// Generic function to allow for uploading any restaurant menu
export const uploadRestaurantMenu = async (
  restaurantId: string,
  menuJsonPath: string,
): Promise<boolean> => {
  try {
    // Dynamic import of the menu data
    const menuData = require(menuJsonPath);
    return await parseAndUploadMenuJson(restaurantId, menuData);
  } catch (error) {
    console.error(`Error uploading menu for ${restaurantId}:`, error);
    return false;
  }
};
