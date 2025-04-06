// app/utils/ratingsUtils.ts
// Contributor: @Fardeen Bablu
// Time spent: 2 hours

import React from "react";
import { View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FieldValue } from "firebase/firestore";

// Storage key for reviews
const REVIEWS_STORAGE_KEY = "dormdash_reviews";

// Generate a unique ID for new reviews
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export interface Review {
  id: string;
  userId: string;
  userName: string;
  restaurantId: string;
  rating: number;
  text: string;
  createdAt: Date | FieldValue;
}

/**
 * Get all reviews for a restaurant
 * @param restaurantId Restaurant ID
 * @param limitCount Optional limit of reviews to fetch
 * @returns Promise with array of reviews
 */
export const getRestaurantReviews = async (
  restaurantId: string,
  limitCount: number = 10,
): Promise<Review[]> => {
  try {
    // Get all reviews from storage
    const reviewsJson = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
    const allReviews: Review[] = reviewsJson ? JSON.parse(reviewsJson) : [];

    // Filter reviews for this restaurant and sort by date (newest first)
    const restaurantReviews = allReviews
      .filter((review) => review.restaurantId === restaurantId)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt as Date);
        const dateB = new Date(b.createdAt as Date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limitCount);

    return restaurantReviews;
  } catch (error) {
    console.error(
      `Error fetching reviews for restaurant ${restaurantId}:`,
      error,
    );
    return [];
  }
};

/**
 * Add a new review for a restaurant
 * @param review Review data
 * @returns Promise with review ID
 */
export const addReview = async (
  review: Omit<Review, "id" | "createdAt">,
): Promise<string> => {
  try {
    // Get existing reviews
    const reviewsJson = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
    const allReviews: Review[] = reviewsJson ? JSON.parse(reviewsJson) : [];

    // Generate new review with ID and timestamp
    const newReviewId = generateUUID();
    const newReview: Review = {
      ...review,
      id: newReviewId,
      createdAt: new Date(),
    };

    // Add to reviews array
    const updatedReviews = [...allReviews, newReview];

    // Save updated reviews
    await AsyncStorage.setItem(
      REVIEWS_STORAGE_KEY,
      JSON.stringify(updatedReviews),
    );

    // No need to update restaurant rating in Expo Go
    // await updateRestaurantRating(review.restaurantId);

    return newReviewId;
  } catch (error) {
    console.error("Error adding review:", error);
    throw error;
  }
};

/**
 * Update an existing review
 * @param reviewId Review ID
 * @param updates Review updates
 * @returns Promise that resolves when the review is updated
 */
export const updateReview = async (
  reviewId: string,
  updates: Partial<
    Omit<Review, "id" | "userId" | "restaurantId" | "createdAt">
  >,
): Promise<void> => {
  try {
    // Get existing reviews
    const reviewsJson = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
    const allReviews: Review[] = reviewsJson ? JSON.parse(reviewsJson) : [];

    // Find review to update
    const reviewIndex = allReviews.findIndex((r) => r.id === reviewId);
    if (reviewIndex === -1) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    // Get restaurantId for rating update
    const restaurantId = allReviews[reviewIndex].restaurantId;

    // Update the review
    allReviews[reviewIndex] = {
      ...allReviews[reviewIndex],
      ...updates,
    };

    // Save updated reviews
    await AsyncStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(allReviews));

    // No need to update restaurant rating in Expo Go
    // await updateRestaurantRating(restaurantId);
  } catch (error) {
    console.error(`Error updating review ${reviewId}:`, error);
    throw error;
  }
};

/**
 * Delete a review
 * @param reviewId Review ID
 * @returns Promise that resolves when the review is deleted
 */
export const deleteReview = async (reviewId: string): Promise<void> => {
  try {
    // Get existing reviews
    const reviewsJson = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
    const allReviews: Review[] = reviewsJson ? JSON.parse(reviewsJson) : [];

    // Find review to delete
    const reviewIndex = allReviews.findIndex((r) => r.id === reviewId);
    if (reviewIndex === -1) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    // Get restaurantId for rating update
    const restaurantId = allReviews[reviewIndex].restaurantId;

    // Remove the review
    const updatedReviews = allReviews.filter((r) => r.id !== reviewId);

    // Save updated reviews
    await AsyncStorage.setItem(
      REVIEWS_STORAGE_KEY,
      JSON.stringify(updatedReviews),
    );

    // No need to update restaurant rating in Expo Go
    // await updateRestaurantRating(restaurantId);
  } catch (error) {
    console.error(`Error deleting review ${reviewId}:`, error);
    throw error;
  }
};

/**
 * Get user's review for a specific restaurant
 * @param userId User ID
 * @param restaurantId Restaurant ID
 * @returns Promise with review or null if not found
 */
export const getUserReviewForRestaurant = async (
  userId: string,
  restaurantId: string,
): Promise<Review | null> => {
  try {
    // Get all reviews from storage
    const reviewsJson = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
    const allReviews: Review[] = reviewsJson ? JSON.parse(reviewsJson) : [];

    // Find the user's review for this restaurant
    const userReview = allReviews.find(
      (review) =>
        review.userId === userId && review.restaurantId === restaurantId,
    );

    return userReview || null;
  } catch (error) {
    console.error(
      `Error fetching user review for restaurant ${restaurantId}:`,
      error,
    );
    return null;
  }
};

/**
 * Update a restaurant's overall rating based on reviews - MOCK VERSION
 * @param restaurantId Restaurant ID
 */
export const updateRestaurantRating = async (
  restaurantId: string,
): Promise<void> => {
  // In Expo Go, we'll just log this operation rather than try to update Firebase
  console.log(`Mock: Updated rating for restaurant ${restaurantId}`);
};

/**
 * Initialize with some sample reviews
 */
export const initializeSampleReviews = async (): Promise<void> => {
  try {
    // Check if reviews already exist
    const existingReviews = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
    if (existingReviews) {
      return; // Reviews already initialized
    }

    // Sample reviews for demo
    const sampleReviews: Review[] = [
      {
        id: generateUUID(),
        userId: "mock-user-1",
        userName: "John D.",
        restaurantId: "taco-mama",
        rating: 5,
        text: "Best tacos I've had on campus! Quick delivery too.",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        id: generateUUID(),
        userId: "mock-user-2",
        userName: "Sarah W.",
        restaurantId: "taco-mama",
        rating: 4,
        text: "Great food but a bit pricey for students.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: generateUUID(),
        userId: "mock-user-3",
        userName: "Mike K.",
        restaurantId: "banh-mi-roll",
        rating: 5,
        text: "Authentic Vietnamese sandwiches! The fresh rolls are amazing too.",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ];

    // Save sample reviews
    await AsyncStorage.setItem(
      REVIEWS_STORAGE_KEY,
      JSON.stringify(sampleReviews),
    );
    console.log("Sample reviews initialized");
  } catch (error) {
    console.error("Error initializing sample reviews:", error);
  }
};

// Required default export for Expo Router
const RatingsUtils: React.FC = () => {
  return (
    <View style={{ display: "none" }}>
      <Text>Ratings Utilities</Text>
    </View>
  );
};

export default RatingsUtils;
