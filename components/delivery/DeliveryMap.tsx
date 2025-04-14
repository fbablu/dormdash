// components/delivery/DeliveryMap.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface DeliveryMapProps {
  tracking: any | null;
  isDeliverer: boolean;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({ tracking, isDeliverer }) => {
  if (!tracking) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Feather name="map" size={64} color="#ddd" />
          <Text style={styles.noDataText}>No tracking data available</Text>
        </View>
      </View>
    );
  }

  const mapStage = tracking.routeStage || "to_restaurant";
  const locationDescription =
    mapStage === "to_restaurant"
      ? "Heading to restaurant"
      : mapStage === "to_customer"
        ? "Delivering to customer"
        : "Completed";

  return (
    <View style={styles.container}>
      <View style={styles.mapHeader}>
        <Text style={styles.locationText}>{locationDescription}</Text>
      </View>

      <View style={styles.mapContent}>
        <View style={styles.simplifiedMap}>
          <View style={styles.startPoint}>
            <Feather name="map-pin" size={24} color="#4a6fa5" />
            <Text style={styles.pointLabel}>Start</Text>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.currentPoint}>
            <Feather name="truck" size={24} color="#f39c12" />
          </View>

          <View style={styles.routeLine} />

          <View style={styles.endPoint}>
            <Feather name="flag" size={24} color="#2ecc71" />
            <Text style={styles.pointLabel}>
              {mapStage === "to_restaurant" ? "Restaurant" : "Customer"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 10,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    marginTop: 16,
    fontSize: 16,
    color: "#888",
  },
  mapHeader: {
    padding: 12,
    backgroundColor: "#4a6fa5",
    alignItems: "center",
  },
  locationText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  mapContent: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  simplifiedMap: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  startPoint: {
    alignItems: "center",
  },
  currentPoint: {
    padding: 6,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#f39c12",
  },
  endPoint: {
    alignItems: "center",
  },
  routeLine: {
    flex: 1,
    height: 3,
    backgroundColor: "#ddd",
  },
  pointLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
  },
});

export default DeliveryMap;
