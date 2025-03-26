// components/OrderTrackingView.tsx
// Contributor: @Fardeen Bablu
// Time spent: 45 minutes

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Color } from "@/GlobalStyles";

interface OrderTrackingViewProps {
  status: "pending" | "accepted" | "picked_up" | "delivered" | "cancelled";
  orderId: string;
}

const OrderTrackingView = ({ status, orderId }: OrderTrackingViewProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.orderId}>Order #{orderId.substring(6, 12)}</Text>

      <View style={styles.progressContainer}>
        {/* Step 1: Order Accepted */}
        <View style={styles.stepContainer}>
          <View
            style={[
              styles.iconCircle,
              status === "pending" ? styles.pendingStep : styles.completedStep,
            ]}
          >
            <Feather
              name="user"
              size={18}
              color={status === "pending" ? "#666" : "#fff"}
            />
          </View>
          <Text style={styles.stepText}>Accepted</Text>
        </View>

        <View
          style={[
            styles.connector,
            status === "picked_up" || status === "delivered"
              ? styles.completedConnector
              : styles.pendingConnector,
          ]}
        />

        {/* Step 2: Food Picked Up */}
        <View style={styles.stepContainer}>
          <View
            style={[
              styles.iconCircle,
              status === "picked_up" || status === "delivered"
                ? styles.completedStep
                : styles.pendingStep,
            ]}
          >
            <Feather
              name="package"
              size={18}
              color={
                status === "picked_up" || status === "delivered"
                  ? "#fff"
                  : "#666"
              }
            />
          </View>
          <Text style={styles.stepText}>Picked Up</Text>
        </View>

        <View
          style={[
            styles.connector,
            status === "delivered"
              ? styles.completedConnector
              : styles.pendingConnector,
          ]}
        />

        {/* Step 3: Delivered */}
        <View style={styles.stepContainer}>
          <View
            style={[
              styles.iconCircle,
              status === "delivered"
                ? styles.completedStep
                : styles.pendingStep,
            ]}
          >
            <Feather
              name="check"
              size={18}
              color={status === "delivered" ? "#fff" : "#666"}
            />
          </View>
          <Text style={styles.stepText}>Delivered</Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Current Status:</Text>
        <View style={[styles.statusBadge, getStatusStyle(status)]}>
          <Text style={styles.statusText}>{getStatusText(status)}</Text>
        </View>
      </View>
    </View>
  );
};

const getStatusText = (status: string) => {
  switch (status) {
    case "pending":
      return "Waiting for acceptance";
    case "accepted":
      return "Being prepared for pickup";
    case "picked_up":
      return "On the way";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "pending":
      return { backgroundColor: "#f39c12" };
    case "accepted":
      return { backgroundColor: "#3498db" };
    case "picked_up":
      return { backgroundColor: "#2ecc71" };
    case "delivered":
      return { backgroundColor: "#27ae60" };
    case "cancelled":
      return { backgroundColor: "#e74c3c" };
    default:
      return { backgroundColor: "#7f8c8d" };
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  stepContainer: {
    alignItems: "center",
    width: 70,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  completedStep: {
    backgroundColor: Color.colorBurlywood,
  },
  pendingStep: {
    backgroundColor: "#f1f1f1",
  },
  connector: {
    height: 3,
    flex: 1,
  },
  completedConnector: {
    backgroundColor: Color.colorBurlywood,
  },
  pendingConnector: {
    backgroundColor: "#f1f1f1",
  },
  stepText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statusLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
});

export default OrderTrackingView;
