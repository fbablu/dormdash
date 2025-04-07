// app/services/deliveryTrackingService.ts
// Contributor: @Fardeen Bablu
// Time spent: 3 hours

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import {
  calculateDistance,
  calculateOptimalRoute,
} from "../utils/routingUtils";
import { db } from "../config/firebase";
import {
  doc,
  updateDoc,
  onSnapshot,
  setDoc,
  getDoc,
  collection,
  query,
  where,
} from "firebase/firestore";

// Tracking interval in milliseconds (10 seconds)
const TRACKING_INTERVAL = 10000;

// Keys for AsyncStorage
const TRACKING_ENABLED_KEY = "delivery_tracking_enabled";
const LOCATION_UPDATES_KEY = "location_updates";
const CURRENT_DELIVERY_KEY = "current_delivery";

// Location update type
export interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: number;
  orderId: string;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

// Delivery status type
export type DeliveryStatus =
  | "pending"
  | "accepted"
  | "picked_up"
  | "delivered"
  | "cancelled";

// Delivery route stage type
export type RouteStage = "to_restaurant" | "to_customer" | "completed";

// Delivery tracking type
export interface DeliveryTracking {
  orderId: string;
  delivererId: string;
  customerLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  restaurantLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  status: DeliveryStatus;
  routeStage: RouteStage;
  estimatedTimeRemaining?: number; // in minutes
  distanceRemaining?: number; // in kilometers
  route?: {
    from: {
      latitude: number;
      longitude: number;
    };
    to: {
      latitude: number;
      longitude: number;
    };
    waypoints: Array<{
      latitude: number;
      longitude: number;
    }>;
  };
  lastUpdated: number;
}

// Subscription cleanup functions
let locationSubscription: Location.LocationSubscription | null = null;
let trackingInterval: NodeJS.Timeout | null = null;
let firestoreUnsubscribe: (() => void) | null = null;

// Initialize the delivery tracking service
export const initializeTrackingService = async (): Promise<boolean> => {
  try {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.error("Location permission denied");
      return false;
    }

    // Check if tracking was previously enabled
    const trackingEnabled = await AsyncStorage.getItem(TRACKING_ENABLED_KEY);
    if (trackingEnabled === "true") {
      const currentDeliveryJson =
        await AsyncStorage.getItem(CURRENT_DELIVERY_KEY);
      if (currentDeliveryJson) {
        const currentDelivery = JSON.parse(currentDeliveryJson);
        // Resume tracking for the current delivery
        await startTracking(
          currentDelivery.orderId,
          currentDelivery.delivererId,
        );
      }
    }

    return true;
  } catch (error) {
    console.error("Error initializing tracking service:", error);
    return false;
  }
};

// Start tracking a delivery
export const startTracking = async (
  orderId: string,
  delivererId: string,
): Promise<boolean> => {
  try {
    // Stop any existing tracking
    await stopTracking();

    // Get initial location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    // Create initial tracking data
    const trackingData: DeliveryTracking = {
      orderId,
      delivererId,
      currentLocation: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      },
      status: "accepted",
      routeStage: "to_restaurant",
      lastUpdated: Date.now(),
    };

    // Save current delivery
    await AsyncStorage.setItem(
      CURRENT_DELIVERY_KEY,
      JSON.stringify(trackingData),
    );
    await AsyncStorage.setItem(TRACKING_ENABLED_KEY, "true");

    // Start location updates
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 10, // Update every 10 meters
        timeInterval: TRACKING_INTERVAL,
      },
      (location) => {
        handleLocationUpdate(orderId, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          orderId,
          accuracy: location.coords.accuracy,
          heading: location.coords.heading,
          speed: location.coords.speed,
        });
      },
    );

    // Start periodic updates
    trackingInterval = setInterval(() => {
      syncTrackingData(orderId, delivererId);
    }, TRACKING_INTERVAL);

    // Listen for order status changes
    listenToOrderUpdates(orderId);

    return true;
  } catch (error) {
    console.error("Error starting tracking:", error);
    return false;
  }
};

// Stop tracking the current delivery
export const stopTracking = async (): Promise<void> => {
  try {
    // Remove location subscription
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    // Clear interval
    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }

    // Remove Firestore listener
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
      firestoreUnsubscribe = null;
    }

    // Clear tracking flags
    await AsyncStorage.setItem(TRACKING_ENABLED_KEY, "false");
    await AsyncStorage.removeItem(CURRENT_DELIVERY_KEY);
  } catch (error) {
    console.error("Error stopping tracking:", error);
  }
};

// Handle a new location update
const handleLocationUpdate = async (
  orderId: string,
  locationUpdate: LocationUpdate,
): Promise<void> => {
  try {
    // Get existing updates
    const updatesJson = await AsyncStorage.getItem(LOCATION_UPDATES_KEY);
    const updates: LocationUpdate[] = updatesJson
      ? JSON.parse(updatesJson)
      : [];

    // Add new update
    updates.push(locationUpdate);

    // Keep only the last 50 updates to avoid using too much storage
    const trimmedUpdates = updates.slice(-50);

    // Save updates
    await AsyncStorage.setItem(
      LOCATION_UPDATES_KEY,
      JSON.stringify(trimmedUpdates),
    );

    // Update current delivery tracking data
    const currentDeliveryJson =
      await AsyncStorage.getItem(CURRENT_DELIVERY_KEY);
    if (currentDeliveryJson) {
      const tracking: DeliveryTracking = JSON.parse(currentDeliveryJson);

      // Update current location
      tracking.currentLocation = {
        latitude: locationUpdate.latitude,
        longitude: locationUpdate.longitude,
        timestamp: locationUpdate.timestamp,
      };

      // Update distance and time estimates if we have destination info
      if (
        tracking.routeStage === "to_restaurant" &&
        tracking.restaurantLocation
      ) {
        const distance = calculateDistance(
          locationUpdate.latitude,
          locationUpdate.longitude,
          tracking.restaurantLocation.latitude,
          tracking.restaurantLocation.longitude,
        );

        tracking.distanceRemaining = distance;
        tracking.estimatedTimeRemaining = Math.ceil((distance / 20) * 60); // 20km/h average speed
      } else if (
        tracking.routeStage === "to_customer" &&
        tracking.customerLocation
      ) {
        const distance = calculateDistance(
          locationUpdate.latitude,
          locationUpdate.longitude,
          tracking.customerLocation.latitude,
          tracking.customerLocation.longitude,
        );

        tracking.distanceRemaining = distance;
        tracking.estimatedTimeRemaining = Math.ceil((distance / 20) * 60); // 20km/h average speed
      }

      tracking.lastUpdated = Date.now();

      // Save updated tracking data
      await AsyncStorage.setItem(
        CURRENT_DELIVERY_KEY,
        JSON.stringify(tracking),
      );

      // Sync with Firebase if possible
      try {
        const trackingRef = doc(db, "delivery_tracking", orderId);
        await updateDoc(trackingRef, {
          currentLocation: tracking.currentLocation,
          distanceRemaining: tracking.distanceRemaining,
          estimatedTimeRemaining: tracking.estimatedTimeRemaining,
          lastUpdated: tracking.lastUpdated,
        });
      } catch (error) {
        console.log("Error syncing with Firebase, using local storage only");
      }
    }
  } catch (error) {
    console.error("Error handling location update:", error);
  }
};

// Sync tracking data with Firebase
const syncTrackingData = async (
  orderId: string,
  delivererId: string,
): Promise<void> => {
  try {
    const currentDeliveryJson =
      await AsyncStorage.getItem(CURRENT_DELIVERY_KEY);
    if (!currentDeliveryJson) return;

    const tracking: DeliveryTracking = JSON.parse(currentDeliveryJson);

    // Attempt to sync with Firebase
    try {
      const trackingRef = doc(db, "delivery_tracking", orderId);
      await setDoc(trackingRef, tracking, { merge: true });
    } catch (error) {
      console.log(
        "Error syncing with Firebase, using local storage only",
        error,
      );
    }
  } catch (error) {
    console.error("Error syncing tracking data:", error);
  }
};

// Listen for order status updates
const listenToOrderUpdates = (orderId: string): void => {
  try {
    // Listen to changes in the order document
    const orderRef = doc(db, "orders", orderId);
    firestoreUnsubscribe = onSnapshot(
      orderRef,
      async (doc) => {
        if (doc.exists()) {
          const orderData = doc.data();

          // Update local tracking status
          const currentDeliveryJson =
            await AsyncStorage.getItem(CURRENT_DELIVERY_KEY);
          if (currentDeliveryJson) {
            const tracking: DeliveryTracking = JSON.parse(currentDeliveryJson);

            // Update status if changed
            if (orderData.status !== tracking.status) {
              tracking.status = orderData.status;

              // Update route stage based on status
              if (orderData.status === "picked_up") {
                tracking.routeStage = "to_customer";
              } else if (orderData.status === "delivered") {
                tracking.routeStage = "completed";
                // Stop tracking if delivered
                await stopTracking();
              }

              // Save updated tracking
              await AsyncStorage.setItem(
                CURRENT_DELIVERY_KEY,
                JSON.stringify(tracking),
              );
            }
          }
        }
      },
      (error) => {
        console.error("Error listening to order updates:", error);
      },
    );
  } catch (error) {
    console.error("Error setting up order listener:", error);
  }
};

// Get the current delivery tracking info
export const getCurrentDeliveryTracking =
  async (): Promise<DeliveryTracking | null> => {
    try {
      const trackingJson = await AsyncStorage.getItem(CURRENT_DELIVERY_KEY);
      return trackingJson ? JSON.parse(trackingJson) : null;
    } catch (error) {
      console.error("Error getting current delivery tracking:", error);
      return null;
    }
  };

// Update the route stage and recalculate route
export const updateRouteStage = async (
  orderId: string,
  newStage: RouteStage,
): Promise<boolean> => {
  try {
    const currentDeliveryJson =
      await AsyncStorage.getItem(CURRENT_DELIVERY_KEY);
    if (!currentDeliveryJson) return false;

    const tracking: DeliveryTracking = JSON.parse(currentDeliveryJson);
    tracking.routeStage = newStage;

    // Recalculate route based on new stage
    if (
      tracking.currentLocation &&
      ((newStage === "to_restaurant" && tracking.restaurantLocation) ||
        (newStage === "to_customer" && tracking.customerLocation))
    ) {
      const destination =
        newStage === "to_restaurant"
          ? tracking.restaurantLocation
          : tracking.customerLocation;

      if (destination) {
        // Calculate optimal route
        const route = await calculateOptimalRoute(
          tracking.currentLocation.latitude,
          tracking.currentLocation.longitude,
          destination.latitude,
          destination.longitude,
        );

        if (route) {
          tracking.route = route;
        }
      }
    }

    tracking.lastUpdated = Date.now();

    // Save updated tracking
    await AsyncStorage.setItem(CURRENT_DELIVERY_KEY, JSON.stringify(tracking));

    // Sync with Firebase if possible
    try {
      const trackingRef = doc(db, "delivery_tracking", orderId);
      await updateDoc(trackingRef, {
        routeStage: tracking.routeStage,
        route: tracking.route,
        lastUpdated: tracking.lastUpdated,
      });
    } catch (error) {
      console.log("Error syncing with Firebase, using local storage only");
    }

    return true;
  } catch (error) {
    console.error("Error updating route stage:", error);
    return false;
  }
};

// Get delivery tracking for a specific order
export const getDeliveryTracking = async (
  orderId: string,
): Promise<DeliveryTracking | null> => {
  try {
    // First check if it's the current delivery
    const currentDeliveryJson =
      await AsyncStorage.getItem(CURRENT_DELIVERY_KEY);
    if (currentDeliveryJson) {
      const currentDelivery: DeliveryTracking = JSON.parse(currentDeliveryJson);
      if (currentDelivery.orderId === orderId) {
        return currentDelivery;
      }
    }

    // Otherwise try to get from Firebase
    try {
      const trackingRef = doc(db, "delivery_tracking", orderId);
      const trackingDoc = await getDoc(trackingRef);

      if (trackingDoc.exists()) {
        return trackingDoc.data() as DeliveryTracking;
      }
    } catch (error) {
      console.log("Error getting tracking from Firebase:", error);
    }

    return null;
  } catch (error) {
    console.error("Error getting delivery tracking:", error);
    return null;
  }
};

// Start a delivery tracking subscription for the customer
export let customerTrackingUnsubscribe: (() => void) | null = null;

export const startCustomerTracking = (
  orderId: string,
  onUpdate: (tracking: DeliveryTracking) => void,
): void => {
  try {
    // First clean up any existing subscription
    if (customerTrackingUnsubscribe) {
      customerTrackingUnsubscribe();
      customerTrackingUnsubscribe = null;
    }

    // Listen to tracking updates
    const trackingRef = doc(db, "delivery_tracking", orderId);
    customerTrackingUnsubscribe = onSnapshot(
      trackingRef,
      (doc) => {
        if (doc.exists()) {
          const tracking = doc.data() as DeliveryTracking;
          onUpdate(tracking);
        }
      },
      (error) => {
        console.error("Error in customer tracking subscription:", error);
      },
    );
  } catch (error) {
    console.error("Error starting customer tracking:", error);
  }
};

export const stopCustomerTracking = (): void => {
  if (customerTrackingUnsubscribe) {
    customerTrackingUnsubscribe();
    customerTrackingUnsubscribe = null;
  }
};

export default {
  initializeTrackingService,
  startTracking,
  stopTracking,
  getCurrentDeliveryTracking,
  updateRouteStage,
  getDeliveryTracking,
  startCustomerTracking,
  stopCustomerTracking,
};
