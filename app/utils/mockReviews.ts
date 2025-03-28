// app/utils/mockReviews.ts
// Contributor: @Fardeen Bablu
// Time spent: 2 hours

import AsyncStorage from "@react-native-async-storage/async-storage";

const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Storage key for reviews
const REVIEWS_STORAGE_KEY = "dormdash_reviews";

// Review interface definition
export interface Review {
  id: string;
  userId: string;
  userName: string;
  restaurantId: string;
  rating: number;
  text: string;
  createdAt: Date;
}

/**
 * Get all reviews for a restaurant from AsyncStorage
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
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limitCount);

    // Convert createdAt strings to Date objects
    return restaurantReviews.map((review) => ({
      ...review,
      createdAt: new Date(review.createdAt),
    }));
  } catch (error) {
    console.error(
      `Error fetching reviews for restaurant ${restaurantId}:`,
      error,
    );
    return [];
  }
};

/**
 * Get a user's review for a specific restaurant
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

    if (!userReview) return null;

    // Convert createdAt string to Date object
    return {
      ...userReview,
      createdAt: new Date(userReview.createdAt),
    };
  } catch (error) {
    console.error(
      `Error fetching user review for restaurant ${restaurantId}:`,
      error,
    );
    return null;
  }
};

/**
 * Add a new review
 * @param review Review data (without ID)
 * @returns Promise with the new review ID
 */
export const addReview = async (
  review: Omit<Review, "id" | "createdAt">,
): Promise<string> => {
  try {
    // Get existing reviews
    const reviewsJson = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
    const allReviews: Review[] = reviewsJson ? JSON.parse(reviewsJson) : [];

    // Check if user already reviewed this restaurant
    const existingReviewIndex = allReviews.findIndex(
      (r) =>
        r.userId === review.userId && r.restaurantId === review.restaurantId,
    );

    // Generate new review with ID and timestamp
    const newReview: Review = {
      ...review,
      id: generateUUID(),
      createdAt: new Date(),
    };

    let updatedReviews: Review[];

    if (existingReviewIndex >= 0) {
      // Update existing review
      updatedReviews = [...allReviews];
      updatedReviews[existingReviewIndex] = newReview;
    } else {
      // Add new review
      updatedReviews = [...allReviews, newReview];
    }

    // Save updated reviews
    await AsyncStorage.setItem(
      REVIEWS_STORAGE_KEY,
      JSON.stringify(updatedReviews),
    );

    // Update restaurant rating
    await updateRestaurantRating(review.restaurantId);

    return newReview.id;
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

    // Find the review to update
    const reviewIndex = allReviews.findIndex((r) => r.id === reviewId);

    if (reviewIndex === -1) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    // Update the review
    const updatedReview = {
      ...allReviews[reviewIndex],
      ...updates,
    };

    const updatedReviews = [...allReviews];
    updatedReviews[reviewIndex] = updatedReview;

    // Save updated reviews
    await AsyncStorage.setItem(
      REVIEWS_STORAGE_KEY,
      JSON.stringify(updatedReviews),
    );

    // Update restaurant rating
    await updateRestaurantRating(allReviews[reviewIndex].restaurantId);
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

    // Find the review to delete
    const reviewToDelete = allReviews.find((r) => r.id === reviewId);

    if (!reviewToDelete) {
      throw new Error(`Review with ID ${reviewId} not found`);
    }

    const restaurantId = reviewToDelete.restaurantId;

    // Remove the review
    const updatedReviews = allReviews.filter((r) => r.id !== reviewId);

    // Save updated reviews
    await AsyncStorage.setItem(
      REVIEWS_STORAGE_KEY,
      JSON.stringify(updatedReviews),
    );

    // Update restaurant rating
    await updateRestaurantRating(restaurantId);
  } catch (error) {
    console.error(`Error deleting review ${reviewId}:`, error);
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
    // Get all reviews
    const reviewsJson = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
    const allReviews: Review[] = reviewsJson ? JSON.parse(reviewsJson) : [];

    // Filter reviews for this restaurant
    const restaurantReviews = allReviews.filter(
      (review) => review.restaurantId === restaurantId,
    );

    if (restaurantReviews.length === 0) {
      console.log(
        `No reviews for restaurant ${restaurantId}, using default rating`,
      );
      return;
    }

    // Calculate average rating
    const totalRating = restaurantReviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    );
    const averageRating = totalRating / restaurantReviews.length;
    const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place

    console.log(
      `Updated rating for restaurant ${restaurantId}: ${roundedRating} (${restaurantReviews.length} reviews)`,
    );
  } catch (error) {
    console.error(
      `Error updating rating for restaurant ${restaurantId}:`,
      error,
    );
  }
};

// Initialize with some default reviews for testing
export const initializeSampleReviews = async (): Promise<void> => {
  try {
    // Check if reviews already exist
    const existingReviews = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
    if (existingReviews) {
      return; // Reviews already initialized
    }

    // Sample reviews for demo
    const sampleReviews: Omit<Review, "id">[] = [
      {
        userId: "mock-user-1",
        userName: "John D.",
        restaurantId: "taco-mama",
        rating: 5,
        text: "Best tacos I've had on campus! Quick delivery too.",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        userId: "mock-user-2",
        userName: "Sarah W.",
        restaurantId: "taco-mama",
        rating: 4,
        text: "Great food but a bit pricey for students.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        userId: "mock-user-3",
        userName: "Mike K.",
        restaurantId: "banh-mi-roll",
        rating: 5,
        text: "Authentic Vietnamese sandwiches! The fresh rolls are amazing too.",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ];

    const reviewsWithIds: Review[] = sampleReviews.map((review) => ({
      ...review,
      id: generateUUID(),
    }));

    // Save sample reviews
    await AsyncStorage.setItem(
      REVIEWS_STORAGE_KEY,
      JSON.stringify(reviewsWithIds),
    );
    console.log("Sample reviews initialized");
  } catch (error) {
    console.error("Error initializing sample reviews:", error);
  }
};
