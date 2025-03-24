// app/utils/ratingsUtils.ts
// Contributor: @Fardeen Bablu
// Time spent: 1 hour

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  deleteDoc,
  updateDoc,
  orderBy,
  limit,
  serverTimestamp,
  FieldValue,
} from "firebase/firestore";
import { db } from "../config/firebase";

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
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("restaurantId", "==", restaurantId),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    );

    const reviewsSnapshot = await getDocs(q);
    const reviews: Review[] = [];

    reviewsSnapshot.forEach((doc) => {
      const data = doc.data();
      reviews.push({
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        restaurantId: data.restaurantId,
        rating: data.rating,
        text: data.text,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

    return reviews;
  } catch (error) {
    console.error(
      `Error fetching reviews for restaurant ${restaurantId}:`,
      error,
    );
    throw error;
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
    const reviewData = {
      ...review,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "reviews"), reviewData);

    // Update restaurant rating average
    await updateRestaurantRating(review.restaurantId);

    return docRef.id;
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
    const reviewRef = doc(db, "reviews", reviewId);
    const reviewDoc = await getDoc(reviewRef);

    if (!reviewDoc.exists()) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    await updateDoc(reviewRef, updates);

    // Update restaurant rating average
    const restaurantId = reviewDoc.data().restaurantId;
    await updateRestaurantRating(restaurantId);
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
    const reviewRef = doc(db, "reviews", reviewId);
    const reviewDoc = await getDoc(reviewRef);

    if (!reviewDoc.exists()) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    const restaurantId = reviewDoc.data().restaurantId;

    await deleteDoc(reviewRef);

    // Update restaurant rating average
    await updateRestaurantRating(restaurantId);
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
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("userId", "==", userId),
      where("restaurantId", "==", restaurantId),
    );

    const reviewsSnapshot = await getDocs(q);

    if (reviewsSnapshot.empty) {
      return null;
    }

    const doc = reviewsSnapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      userId: data.userId,
      userName: data.userName,
      restaurantId: data.restaurantId,
      rating: data.rating,
      text: data.text,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error(
      `Error fetching user review for restaurant ${restaurantId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Update a restaurant's overall rating based on reviews
 * @param restaurantId Restaurant ID
 * @returns Promise that resolves when the rating is updated
 */
export const updateRestaurantRating = async (
  restaurantId: string,
): Promise<void> => {
  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("restaurantId", "==", restaurantId));

    const reviewsSnapshot = await getDocs(q);

    if (reviewsSnapshot.empty) {
      // No reviews, use default rating
      const restaurantRef = doc(db, "restaurants", restaurantId);
      await updateDoc(restaurantRef, {
        rating: 5.0,
        reviewCount: "0",
      });
      return;
    }

    // Calculate average rating
    let totalRating = 0;
    reviewsSnapshot.forEach((doc) => {
      totalRating += doc.data().rating;
    });

    const averageRating = totalRating / reviewsSnapshot.size;
    const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place

    // Update restaurant document
    const restaurantRef = doc(db, "restaurants", restaurantId);
    await updateDoc(restaurantRef, {
      rating: roundedRating,
      reviewCount: `${reviewsSnapshot.size}+`,
    });
  } catch (error) {
    console.error(
      `Error updating rating for restaurant ${restaurantId}:`,
      error,
    );
    throw error;
  }
};

/**
 * Find restaurants with high ratings for a specific cuisine
 * @param cuisine Cuisine type
 * @param minRating Minimum rating (default: 4.0)
 * @param limitCount Maximum number of results
 * @returns Promise with array of restaurant IDs
 */
export const findTopRatedRestaurantsByCuisine = async (
  cuisine: string,
  minRating: number = 4.0,
  limitCount: number = 5,
): Promise<string[]> => {
  try {
    const restaurantsRef = collection(db, "restaurants");
    const q = query(
      restaurantsRef,
      where("cuisine", "array-contains", cuisine),
      where("rating", ">=", minRating),
      orderBy("rating", "desc"),
      limit(limitCount),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.id);
  } catch (error) {
    console.error(
      `Error finding top rated restaurants for cuisine ${cuisine}:`,
      error,
    );
    throw error;
  }
};
