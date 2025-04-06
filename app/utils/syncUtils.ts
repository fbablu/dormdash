// app/utils/syncUtils.ts
// Contributor: @Fardeen Bablu
// Time spent: 1 hour

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  getFirestore,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Utility to sync data between Firebase and AsyncStorage
 * This provides resilience when the network is unavailable.
 */
export const syncManager = {
  // Sync orders between Firebase and AsyncStorage
  syncOrders: async (userId: string): Promise<boolean> => {
    try {
      // First get local orders
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      const localOrders = ordersJson ? JSON.parse(ordersJson) : [];

      // Try to fetch from Firebase
      try {
        // Make sure we're using a valid Firestore instance
        const firestore = getFirestore();
        const ordersCollection = collection(firestore, "orders");
        const ordersQuery = query(
          ordersCollection,
          where("customerId", "==", userId),
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        const firebaseOrders: any[] = [];

        ordersSnapshot.forEach((doc) => {
          firebaseOrders.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        if (firebaseOrders.length > 0) {
          // Merge orders (prefer Firebase versions for any duplicates)
          const mergedOrders = mergeData(localOrders, firebaseOrders, "id");

          // Save merged orders back to AsyncStorage
          await AsyncStorage.setItem(
            "dormdash_orders",
            JSON.stringify(mergedOrders),
          );
          return true;
        }
      } catch (error) {
        console.error("Error syncing with Firebase:", error);
        // Continue with local data
      }

      // Try to push local orders to Firebase
      if (localOrders.length > 0) {
        try {
          const firestore = getFirestore();
          for (const order of localOrders) {
            // Only push if it doesn't have a pendingSync flag
            if (!order.pendingSync) {
              await setDoc(doc(firestore, "orders", order.id), {
                ...order,
                pendingSync: true,
              });
            }
          }
        } catch (error) {
          console.error("Error pushing to Firebase:", error);
          // Mark orders for future sync
          const markedOrders = localOrders.map((order: any) => ({
            ...order,
            pendingSync: true,
          }));

          await AsyncStorage.setItem(
            "dormdash_orders",
            JSON.stringify(markedOrders),
          );
        }
      }

      return true;
    } catch (error) {
      console.error("Sync error:", error);
      return false;
    }
  },

  // Sync delivery requests
  syncDeliveries: async (userId: string): Promise<boolean> => {
    // Similar implementation as syncOrders but for deliveries
    // This would focus on orders where delivererId matches userId
    try {
      const ordersJson = await AsyncStorage.getItem("dormdash_orders");
      const allOrders = ordersJson ? JSON.parse(ordersJson) : [];

      // Filter for deliveries by this user
      const localDeliveries = allOrders.filter(
        (order: any) => order.delivererId === userId,
      );

      // Try to fetch from Firebase
      try {
        const firestore = getFirestore();
        const ordersCollection = collection(firestore, "orders");
        const deliveriesQuery = query(
          ordersCollection,
          where("delivererId", "==", userId),
        );

        const deliveriesSnapshot = await getDocs(deliveriesQuery);
        const firebaseDeliveries: any[] = [];

        deliveriesSnapshot.forEach((doc) => {
          firebaseDeliveries.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        if (firebaseDeliveries.length > 0) {
          // Update the orders with the firebase deliveries
          const updatedOrders = [...allOrders];

          // Replace any matching orders with the Firebase versions
          firebaseDeliveries.forEach((fbDelivery) => {
            const index = updatedOrders.findIndex(
              (o) => o.id === fbDelivery.id,
            );
            if (index >= 0) {
              updatedOrders[index] = fbDelivery;
            } else {
              updatedOrders.push(fbDelivery);
            }
          });

          // Save updated orders back to AsyncStorage
          await AsyncStorage.setItem(
            "dormdash_orders",
            JSON.stringify(updatedOrders),
          );
          return true;
        }
      } catch (error) {
        console.error("Error syncing deliveries with Firebase:", error);
      }

      return true;
    } catch (error) {
      console.error("Delivery sync error:", error);
      return false;
    }
  },
};

// Helper function to merge arrays of objects based on an ID field
function mergeData<T>(localData: T[], remoteData: T[], idField: string): T[] {
  const merged: T[] = [...localData];
  const localIds = new Set(localData.map((item: any) => item[idField]));

  remoteData.forEach((remoteItem: any) => {
    const localIndex = localData.findIndex(
      (item: any) => item[idField] === remoteItem[idField],
    );

    if (localIndex >= 0) {
      // Update existing item
      merged[localIndex] = remoteItem;
    } else {
      // Add new item
      merged.push(remoteItem);
    }
  });

  return merged;
}

export default syncManager;
