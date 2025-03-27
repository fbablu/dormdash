// app/components/restaurant/ReviewsSection.tsx
// Contributor: @Fardeen Bablu
// Time spent: 2 hours

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/app/context/AuthContext";
import {
  Review,
  getRestaurantReviews,
  getUserReviewForRestaurant,
  addReview,
  updateReview,
  deleteReview,
} from "@/app/utils/ratingsUtils";
import { Color } from "@/GlobalStyles";

interface ReviewsSectionProps {
  restaurantId: string;
  restaurantName: string;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  restaurantId,
  restaurantName,
}) => {
  const { user, isSignedIn } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [showEditReview, setShowEditReview] = useState(false);

  // Form state
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);

  // Load reviews
  useEffect(() => {
    loadReviews();
  }, [restaurantId]);

  // Check if user has already reviewed
  useEffect(() => {
    if (isSignedIn && user) {
      checkUserReview();
    }
  }, [isSignedIn, user, restaurantId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const fetchedReviews = await getRestaurantReviews(restaurantId);
      setReviews(fetchedReviews);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreReviews = async () => {
    if (loadingMore) return;

    setLoadingMore(true);
    try {
      const currentCount = reviews.length;
      const additionalReviews = await getRestaurantReviews(
        restaurantId,
        10 + currentCount,
      );
      // Only take new reviews
      setReviews(additionalReviews);
    } catch (error) {
      console.error("Error loading more reviews:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const checkUserReview = async () => {
    if (!user) return;

    try {
      const review = await getUserReviewForRestaurant(user.id, restaurantId);
      setUserReview(review);

      if (review) {
        setRating(review.rating);
        setReviewText(review.text);
      }
    } catch (error) {
      console.error("Error checking user review:", error);
    }
  };

  const handleAddReview = async () => {
    if (!isSignedIn || !user) {
      Alert.alert("Sign In Required", "Please sign in to leave a review.");
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert("Error", "Please enter a review.");
      return;
    }

    try {
      // If user already has a review, update it
      if (userReview) {
        await updateReview(userReview.id, {
          rating,
          text: reviewText.trim(),
        });
      } else {
        // Otherwise add a new review
        await addReview({
          userId: user.id,
          userName: user.name,
          restaurantId,
          rating,
          text: reviewText.trim(),
        });
      }

      // Reset form and refresh reviews
      setShowAddReview(false);
      setShowEditReview(false);
      await loadReviews();
      await checkUserReview();
    } catch (error) {
      console.error("Error saving review:", error);
      Alert.alert("Error", "Failed to save your review. Please try again.");
    }
  };

  const handleEditReview = () => {
    if (!userReview) return;

    setRating(userReview.rating);
    setReviewText(userReview.text);
    setShowEditReview(true);
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete your review?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteReview(userReview.id);
              setUserReview(null);
              await loadReviews();
              Alert.alert("Success", "Your review has been deleted.");
            } catch (error) {
              console.error("Error deleting review:", error);
              Alert.alert(
                "Error",
                "Failed to delete your review. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderRatingStars = (rating: number) => {
    return (
      <View style={styles.ratingStars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Feather
            key={star}
            name={star <= rating ? "star" : "star"}
            size={16}
            color={star <= rating ? "#FFD700" : "#E0E0E0"}
          />
        ))}
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => {
    const isUsersReview = user && item.userId === user.id;

    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewerName}>{item.userName}</Text>
          {renderRatingStars(item.rating)}
        </View>

        <Text style={styles.reviewDate}>
          {formatDate(item.createdAt as Date)}
        </Text>

        <Text style={styles.reviewText}>{item.text}</Text>

        {isUsersReview && (
          <View style={styles.reviewActions}>
            <TouchableOpacity
              style={styles.reviewAction}
              onPress={handleEditReview}
            >
              <Feather name="edit-2" size={14} color="#666" />
              <Text style={styles.reviewActionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reviewAction}
              onPress={handleDeleteReview}
            >
              <Feather name="trash-2" size={14} color="#ff6b6b" />
              <Text style={[styles.reviewActionText, styles.deleteText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderRatingSelector = () => {
    return (
      <View style={styles.ratingSelector}>
        <Text style={styles.ratingLabel}>Your Rating:</Text>
        <View style={styles.starSelector}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Feather
                name="star"
                size={32}
                color={star <= rating ? "#FFD700" : "#E0E0E0"}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Customer Reviews</Text>

        {isSignedIn && !showAddReview && !showEditReview && (
          <TouchableOpacity
            style={styles.addReviewButton}
            onPress={() => {
              if (userReview) {
                handleEditReview();
              } else {
                setShowAddReview(true);
              }
            }}
          >
            <Feather
              name={userReview ? "edit-2" : "plus"}
              size={16}
              color="#fff"
            />
            <Text style={styles.addReviewText}>
              {userReview ? "Edit Review" : "Add Review"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add/Edit Review Form */}
      {(showAddReview || showEditReview) && (
        <View style={styles.reviewForm}>
          <Text style={styles.reviewFormTitle}>
            {showEditReview ? "Edit Your Review" : "Add Your Review"}
          </Text>

          {renderRatingSelector()}

          <TextInput
            style={styles.reviewInput}
            multiline
            placeholder={`Share your thoughts about ${restaurantName}...`}
            value={reviewText}
            onChangeText={setReviewText}
          />

          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAddReview(false);
                setShowEditReview(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddReview}
            >
              <Text style={styles.submitButtonText}>
                {showEditReview ? "Update" : "Submit"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Reviews List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.colorBurlywood} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : reviews.length > 0 ? (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.reviewsList}
          onEndReached={loadMoreReviews}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={Color.colorBurlywood}
                style={styles.loadMoreIndicator}
              />
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyReviews}>
          <Feather name="message-square" size={32} color="#ddd" />
          <Text style={styles.emptyReviewsText}>No reviews yet</Text>
          <Text style={styles.emptyReviewsSubtext}>
            Be the first to review this restaurant!
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  addReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addReviewText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  reviewForm: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  reviewFormTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  ratingSelector: {
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  starSelector: {
    flexDirection: "row",
    justifyContent: "center",
  },
  starButton: {
    padding: 8,
  },
  reviewInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
    fontSize: 16,
    marginBottom: 16,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
  },
  reviewsList: {
    paddingBottom: 20,
  },
  reviewItem: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  ratingStars: {
    flexDirection: "row",
  },
  reviewDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
  },
  reviewActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  reviewAction: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  reviewActionText: {
    fontSize: 12,
    marginLeft: 4,
    color: "#666",
  },
  deleteText: {
    color: "#ff6b6b",
  },
  emptyReviews: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyReviewsText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyReviewsSubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  loadMoreIndicator: {
    padding: 16,
  },
});

export default ReviewsSection;
