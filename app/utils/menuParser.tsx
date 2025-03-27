// app/utils/menuParser.tsx
// Contributor: @Fardeen Bablu
// time spent: 2 hours

import React from "react";
import { View, Text } from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { generateMenuItemId } from "./menuIntegration";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    // Hard-code the Taco Mama menu data instead of importing it
    const tacoMamaMenu = {
      menu: {
        build_your_own: [
          {
            name: "Tacos",
            description:
              "2 soft flour, soft corn, or crispy corn tortillas filled with your toppings. Comes with chips and salsa + a side.",
          },
          {
            name: "Burrito Bowl",
            description:
              "Just like a burrito but served in a bowl without a tortilla.",
            extras: ["Double Protein +$3"],
          },
          {
            name: "Burrito",
            description:
              "Your choice of fresh toppings wrapped in a flour tortilla and served with chips and salsa + a side.",
          },
          {
            name: "Jorge's Nachos",
            description:
              "Your toppings piled high on fresh-made tortilla chips.",
            extras: ["Double Protein +$3"],
          },
          {
            name: "Quesadilla",
            description:
              "Grilled with cheese & your choice of meat - served with chips & salsa.",
          },
        ],
        proteins: [
          { name: "Chicken", price: 15.5 },
          { name: "Barbacoa", price: 15.5 },
          { name: "Grilled Shrimp", price: 15.5 },
          {
            name: "Ahi Tuna",
            price: 16.5,
            note: "Limited amount each day, first come first serve.",
          },
          { name: "Flounder", price: 15.5 },
          { name: "Ground Beef", price: 14.5 },
          { name: "Steak", price: 16.5 },
          { name: "Chorizo", price: 15.5 },
          { name: "Veggie Mix", price: 12.5 },
          { name: "Tofu", price: 14.5 },
        ],
        fresh_free_toppings: [
          "Cilantro-Lime Rice",
          "Tomatoes",
          "Avocado",
          "Chorizo",
          "Refried Beans",
          "Roasted Corn",
          "Cilantro",
          "Sour Cream",
          "Black Beans",
          "Black Olives",
          "Guacamole",
          "Grilled Onions",
          "Pico de Gallo",
          "Shredded Cheddar",
          "Pickled Jalapenos",
          "Ancho Chile Slaw",
          "Shredded Mozzarella",
          "Grilled Jalapenos",
          "Sriracha Slaw",
          "Queso Fresco",
          "Fresh Jalapenos",
          "Shredded Lettuce",
          "Queso",
          "Onions",
        ],
        salsa_sauces: [
          "Fresh Salsa Ranchera (Mild)",
          "Fresh Tomatillo Salsa (Hot!)",
          "Roasted Poblano Tartar",
          "Chipotle-Ranch",
          "Cilantro-Lime Vinaigrette",
          "Mama's Chipotle BBQ Sauce",
          "Red-Chile Butter Sauce",
        ],
        taco_baskets: [
          { name: "Classico Beef", price: 14.5 },
          { name: "Justice is Served", price: 15.5 },
          { name: "Cheezy Beef", price: 15.5 },
          { name: "The Sizzler", price: 16.5 },
          { name: "Alabama Redneck", price: 15.5 },
          { name: "The Mayor", price: 15.5 },
          { name: "Mama's Chorizo", price: 15.5 },
          { name: "Ahi Tuna-Si!!", price: 16.5 },
          { name: "Mix & Match", price: "Market Price" },
          { name: "Add Single Taco", price: 4 },
        ],
        burrito_baskets: [
          { name: "Yo Mama", price: 14.5 },
          { name: "Q-Burrito", price: 15.5 },
          { name: "The Big Client", price: 15.5 },
          { name: "The Fat Boy", price: 16.5 },
          { name: "The Judge", price: 15.5 },
          { name: "The Hippie Fisherman", price: 15.5 },
          { name: "The Tree Hugger", price: 12.5 },
        ],
        drinks: {
          beer: {
            imports: 6.0,
            domestic: 4.5,
          },
          wine: {
            options: [
              "Prosecco",
              "Chardonnay",
              "Pinot Grigio",
              "Marques de Caceres (Spanish Red)",
            ],
            price: 10,
          },
          margaritas: {
            flavors: {
              "Mi Casa": 10.5,
              Frozen: 10.5,
              Skinny: 12.5,
              Pomegranate: 12.5,
              Mercedes: 12.5,
              Jalapeno: 12.5,
              "Prosecco Fizz": 12.5,
              "La Playa": 12.5,
              "The Real Deal": 12.5,
              Cucumber: 12.5,
              "Blood Orange (Seasonal)": 12.5,
              "Watermelon (Seasonal)": 12.5,
              Sangrita: 12.5,
              "The Paula Sangria": 10.5,
              "The Guillermo (Ranch Water)": 12.5,
            },
          },
        },
        catering: {
          taco_nacho_bar: { price_per_person: 15 },
          happy_family_meal: { price: 54 },
          happiest_family_meal: {
            margarita_mix: { half_gallon: 10, one_gallon: 20 },
          },
          margarita_mix: { half_gallon: 10, one_gallon: 20 },
        },
        contact: {
          order_online: "tacomamaonline.com",
          catering_email: "hillsborocatering@tacomamaonline.com",
          phone: "615-600-4420",
        },
      },
    };
    return await parseAndUploadMenuJson("taco-mama", tacoMamaMenu);
  } catch (error) {
    console.error("Error uploading Taco Mama menu:", error);
    return false;
  }
};

// Generic function to fetch menu data from AsyncStorage
export const uploadRestaurantMenuFromData = async (
  restaurantId: string,
  menuData: any,
): Promise<boolean> => {
  try {
    return await parseAndUploadMenuJson(restaurantId, menuData);
  } catch (error) {
    console.error(`Error uploading menu for ${restaurantId}:`, error);
    return false;
  }
};

// Store a standard menu template in AsyncStorage for the demo app
export const storeDefaultMenuTemplate = async (): Promise<void> => {
  try {
    const defaultMenu = {
      categories: [
        {
          id: "appetizers",
          name: "Appetizers",
          items: [
            {
              id: "app-1",
              name: "House Special Appetizer",
              description: "Our signature starter with seasonal ingredients",
              price: 8.99,
            },
            {
              id: "app-2",
              name: "Mixed Salad",
              description: "Fresh greens with house dressing",
              price: 6.99,
            },
          ],
        },
        {
          id: "entrees",
          name: "Main Courses",
          items: [
            {
              id: "entree-1",
              name: "Chef's Special",
              description:
                "Our most popular dish, prepared with the finest ingredients",
              price: 14.99,
            },
            {
              id: "entree-2",
              name: "House Special Plate",
              description:
                "A delicious combination of flavors unique to our restaurant",
              price: 13.99,
            },
          ],
        },
      ],
    };

    await AsyncStorage.setItem(
      "dormdash_default_menu",
      JSON.stringify(defaultMenu),
    );
  } catch (error) {
    console.error("Error storing default menu template:", error);
  }
};

// Default export required for Expo Router
export default function MenuParser() {
  return (
    <View style={{ display: "none" }}>
      <Text>Menu Parser Utilities</Text>
    </View>
  );
}
