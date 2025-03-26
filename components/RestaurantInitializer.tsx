// app/components/RestaurantInitializer.tsx
// Contributor: @Fardeen Bablu
// time spent: 30 minutes
import React, { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAMPLE_RESTAURANTS = [
  {
    id: "taco-mama",
    name: "Taco Mama",
    location: "HILLSBORO VILLAGE",
    address: "1920 Belcourt Ave",
    cuisines: ["Mexican", "Tex-Mex"],
    acceptsCommodoreCash: true,
    imageUrl: "https://randomuser.me/api/portraits/men/1.jpg", // Placeholder
    openTime: "11:00 AM",
    closeTime: "9:00 PM",
    rating: 4.5,
    menu: {
      categories: [
        {
          name: "Tacos",
          items: [
            {
              id: "taco-1",
              name: "Chicken Taco",
              price: 3.99,
              description:
                "Grilled chicken with lettuce, cheese, and pico de gallo",
            },
            {
              id: "taco-2",
              name: "Beef Taco",
              price: 4.99,
              description:
                "Ground beef with lettuce, cheese, and pico de gallo",
            },
          ],
        },
        {
          name: "Burritos",
          items: [
            {
              id: "burrito-1",
              name: "Chicken Burrito",
              price: 8.99,
              description:
                "Grilled chicken with rice, beans, lettuce, cheese, and pico de gallo",
            },
          ],
        },
      ],
    },
  },
  {
    id: "bahn-mi",
    name: "Bahn Mi & Roll",
    location: "HILLSBORO VILLAGE",
    address: "2057 Scarritt Pl",
    cuisines: ["Vietnamese", "Asian"],
    acceptsCommodoreCash: true,
    imageUrl: "https://randomuser.me/api/portraits/women/1.jpg", // Placeholder
    openTime: "10:00 AM",
    closeTime: "8:00 PM",
    rating: 4.7,
    menu: {
      categories: [
        {
          name: "Sandwiches",
          items: [
            {
              id: "sandwich-1",
              name: "Classic Bahn Mi",
              price: 6.99,
              description:
                "Vietnamese sandwich with pork, veggies, and special sauce",
            },
          ],
        },
        {
          name: "Bowls",
          items: [
            {
              id: "bowl-1",
              name: "Rice Bowl",
              price: 9.99,
              description: "Rice with your choice of protein and veggies",
            },
          ],
        },
      ],
    },
  },
];

const RestaurantInitializer = () => {
  // Initialize restaurants for Expo Go
  useEffect(() => {
    const initializeRestaurants = async () => {
      try {
        // Check if we've already initialized
        const initialized = await AsyncStorage.getItem(
          "restaurants_initialized",
        );
        if (initialized === "true") {
          console.log("Restaurants already initialized");
          return;
        }

        // Store sample restaurants
        await AsyncStorage.setItem(
          "restaurants",
          JSON.stringify(SAMPLE_RESTAURANTS),
        );
        await AsyncStorage.setItem("restaurants_initialized", "true");
        console.log("Mock restaurants initialized successfully");
      } catch (error) {
        console.error("Error initializing restaurants:", error);
      }
    };

    initializeRestaurants();
  }, []);
  return null;
};

export default RestaurantInitializer;
