// app/components/RestaurantInitializer.tsx
// Contributor: @Fardeen Bablu
// time spent: 30 minutes

import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/app/config/firebase";
import { uploadTacoMamaMenu } from "@/app/utils/menuParser";
import { Color } from "@/GlobalStyles";

const RestaurantInitializer: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeTacoMama = async () => {
      try {
        // Check if Taco Mama exists
        const restaurantRef = doc(db, "restaurants", "taco-mama");
        const restaurantDoc = await getDoc(restaurantRef);

        if (!restaurantDoc.exists()) {
          // Create Taco Mama restaurant document
          await setDoc(restaurantRef, {
            name: "Taco Mama",
            location: "HILLSBORO VILLAGE",
            address: "1612 21st Ave S, Nashville, TN 37212",
            website: "https://tacomamaonline.com/",
            image:
              "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop",
            cuisines: ["Mexican", "Tacos"],
            acceptsCommodoreCash: true,
            rating: 4.5,
            reviewCount: "200+",
            deliveryTime: "15-25 min",
            deliveryFee: 3.99,
            createdAt: new Date().toISOString(),
          });

          // Upload menu
          await uploadTacoMamaMenu();
          console.log("Taco Mama restaurant initialized successfully");
        } else {
          console.log("Taco Mama restaurant already exists");
        }

        setInitialized(true);
      } catch (err) {
        console.error("Error initializing restaurant:", err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    initializeTacoMama();
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default RestaurantInitializer;
