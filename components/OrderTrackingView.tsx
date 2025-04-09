// components/OrderTrackingView.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import DeliveryMap from "./delivery/DeliveryMap";
import { DeliveryTracking } from "@/app/services/deliveryTrackingService";

interface OrderTrackingViewProps {
  orderId: string;
  status: string;
  trackingData?: DeliveryTracking | null;
}

const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  orderId,
  status,
  trackingData,
}) => {
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
      <DeliveryMap tracking={trackingData || null} isDeliverer={true} />
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
});

export default OrderTrackingView;
