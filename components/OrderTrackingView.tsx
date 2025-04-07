// components/OrderTrackingView.tsx
// Contributors: @Fardeen Bablu, @YourName
// Time spent: 3 hours

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { Marker, Polyline } from "react-native-maps"; // Use regular MapView, not Google Maps specific
import { DeliveryTracking } from "@/app/services/deliveryTrackingService";

interface OrderTrackingViewProps {
  orderId: string;
  status: string;
  trackingData?: DeliveryTracking | null;
}

const OrderTrackingView = ({
  orderId,
  status,
  trackingData,
}: OrderTrackingViewProps) => {
  // Render progress indicators
  const renderProgressIndicators = () => {
    const stages = ["accepted", "picked_up", "delivered"];
    const currentIndex = stages.indexOf(status as any);

    return (
      <View style={styles.progressContainer}>
        {stages.map((stage, index) => {
          const isCompleted = index <= currentIndex;
          const isActive = index === currentIndex;

          let stageName = "";
          switch (stage) {
            case "accepted":
              stageName = "Accepted";
              break;
            case "picked_up":
              stageName = "Picked Up";
              break;
            case "delivered":
              stageName = "Delivered";
              break;
          }

          return (
            <View key={stage} style={styles.stageContainer}>
              <View
                style={[
                  styles.stageCircle,
                  isCompleted ? styles.completedStage : {},
                  isActive ? styles.activeStage : {},
                ]}
              >
                {isCompleted && <Feather name="check" size={16} color="#fff" />}
              </View>
              <Text
                style={[
                  styles.stageText,
                  isActive ? styles.activeStageText : {},
                  isCompleted ? styles.completedStageText : {},
                ]}
              >
                {stageName}
              </Text>

              {index < stages.length - 1 && (
                <View
                  style={[
                    styles.stageLine,
                    isCompleted ? styles.completedStageLine : {},
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderProgressIndicators()}

      {/* Simplified status display instead of map */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>
          {status === "accepted"
            ? "Preparing Order"
            : status === "picked_up"
              ? "On the way to delivery"
              : "Delivered"}
        </Text>

        {trackingData && (
          <Text style={styles.statusDescription}>
            {trackingData.routeStage === "to_restaurant"
              ? "Driver is heading to the restaurant"
              : trackingData.routeStage === "to_customer"
                ? "Driver is bringing your order"
                : "Delivery completed"}
          </Text>
        )}
      </View>

      {/* Progress bar for current stage */}
      {trackingData && trackingData.routeStage !== "completed" && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarLabel}>
            <Text style={styles.progressBarText}>
              {trackingData.routeStage === "to_restaurant"
                ? "On the way to restaurant"
                : "Delivering to customer"}
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: "50%" }]} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 10,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  stageContainer: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  stageCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  completedStage: {
    backgroundColor: "#4CAF50",
  },
  activeStage: {
    backgroundColor: "#2196F3",
  },
  stageText: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
  },
  activeStageText: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  completedStageText: {
    color: "#4CAF50",
  },
  stageLine: {
    position: "absolute",
    top: 12,
    right: -50,
    width: 100,
    height: 2,
    backgroundColor: "#e0e0e0",
    zIndex: -1,
  },
  completedStageLine: {
    backgroundColor: "#4CAF50",
  },
  statusContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: "#666",
  },
  progressBarContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  progressBarLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  progressBarText: {
    fontSize: 14,
    color: "#757575",
  },
  progressBarTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#2196F3",
    borderRadius: 3,
  },
});

export default OrderTrackingView;
