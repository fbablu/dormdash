// components/delivery/DeliveryMap.tsx
// Contributor: @Fardeen Bablu
// Time spent: 4 hours

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";

import { Color } from "@/GlobalStyles";
import {
  DeliveryTracking,
  RouteStage,
} from "@/app/services/deliveryTrackingService";

import {
  calculateDistance,
  calculateTravelTime,
  Coordinates,
  formatETA,
} from "@/app/utils/routingUtils";

// Dummy SVG map view since we can't use MapView in our current setup
const MapSVGView: React.FC<{
  tracking: DeliveryTracking | null;
  restaurantCoords?: Coordinates;
  customerCoords?: Coordinates;
  currentCoords?: Coordinates;
}> = ({ tracking, restaurantCoords, customerCoords, currentCoords }) => {
  const { width, height } = Dimensions.get("window");
  const mapWidth = width - 40;
  const mapHeight = 300;

  // Calculate bounds to fit all points
  const calcBounds = () => {
    let minLat = 90,
      maxLat = -90,
      minLon = 180,
      maxLon = -180;

    if (currentCoords) {
      minLat = Math.min(minLat, currentCoords.latitude);
      maxLat = Math.max(maxLat, currentCoords.latitude);
      minLon = Math.min(minLon, currentCoords.longitude);
      maxLon = Math.max(maxLon, currentCoords.longitude);
    }

    if (restaurantCoords) {
      minLat = Math.min(minLat, restaurantCoords.latitude);
      maxLat = Math.max(maxLat, restaurantCoords.latitude);
      minLon = Math.min(minLon, restaurantCoords.longitude);
      maxLon = Math.max(maxLon, restaurantCoords.longitude);
    }

    if (customerCoords) {
      minLat = Math.min(minLat, customerCoords.latitude);
      maxLat = Math.max(maxLat, customerCoords.latitude);
      minLon = Math.min(minLon, customerCoords.longitude);
      maxLon = Math.max(maxLon, customerCoords.longitude);
    }

    // Add a buffer
    const latBuffer = (maxLat - minLat) * 0.1;
    const lonBuffer = (maxLon - minLon) * 0.1;

    return {
      minLat: minLat - latBuffer,
      maxLat: maxLat + latBuffer,
      minLon: minLon - lonBuffer,
      maxLon: maxLon + lonBuffer,
    };
  };

  const bounds = calcBounds();

  // Map a coordinate to the SVG viewport
  const mapToViewport = (lat: number, lon: number) => {
    const x =
      ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * mapWidth;
    const y =
      ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * mapHeight;
    return { x, y };
  };

  // Draw route points
  const renderRoute = () => {
    if (!tracking || !tracking.route || !tracking.route.waypoints) return null;

    const pathPoints = tracking.route.waypoints
      .map((wp: { latitude: number; longitude: number }) => {
        const { x, y } = mapToViewport(wp.latitude, wp.longitude);
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <>
        <polyline
          points={pathPoints}
          stroke="#4a6fa5"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5,5"
        />

        {tracking.route.waypoints.map(
          (
            wp: { latitude: number; longitude: number },
            index: React.Key | null | undefined,
          ) => {
            const { x, y } = mapToViewport(wp.latitude, wp.longitude);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="#4a6fa5"
                opacity="0.7"
              />
            );
          },
        )}
      </>
    );
  };

  return (
    <View style={styles.mapContainer}>
      <svg
        width={mapWidth}
        height={mapHeight}
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
      >
        {/* Background */}
        <rect
          width={mapWidth}
          height={mapHeight}
          fill="#f5f5f5"
          rx="10"
          ry="10"
        />

        {/* Route */}
        {renderRoute()}

        {/* Restaurant marker */}
        {restaurantCoords &&
          (() => {
            const { x, y } = mapToViewport(
              restaurantCoords.latitude,
              restaurantCoords.longitude,
            );
            return (
              <g>
                <circle cx={x} cy={y} r="10" fill="#f39c12" />
                <text
                  x={x}
                  y={y + 5}
                  fontSize="10"
                  textAnchor="middle"
                  fill="white"
                >
                  R
                </text>
              </g>
            );
          })()}

        {/* Customer marker */}
        {customerCoords &&
          (() => {
            const { x, y } = mapToViewport(
              customerCoords.latitude,
              customerCoords.longitude,
            );
            return (
              <g>
                <circle cx={x} cy={y} r="10" fill="#2ecc71" />
                <text
                  x={x}
                  y={y + 5}
                  fontSize="10"
                  textAnchor="middle"
                  fill="white"
                >
                  C
                </text>
              </g>
            );
          })()}

        {/* Current location marker */}
        {currentCoords &&
          (() => {
            const { x, y } = mapToViewport(
              currentCoords.latitude,
              currentCoords.longitude,
            );
            return (
              <g>
                <circle cx={x} cy={y} r="8" fill="#3498db" />
                <circle cx={x} cy={y} r="12" fill="#3498db" fillOpacity="0.3" />
              </g>
            );
          })()}
      </svg>

      <View style={styles.mapLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: "#3498db" }]} />
          <Text style={styles.legendText}>Current Location</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: "#f39c12" }]} />
          <Text style={styles.legendText}>Restaurant</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendMarker, { backgroundColor: "#2ecc71" }]} />
          <Text style={styles.legendText}>Delivery Location</Text>
        </View>
      </View>
    </View>
  );
};

interface DeliveryMapProps {
  tracking: DeliveryTracking | null;
  isDeliverer?: boolean;
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  tracking,
  isDeliverer = false,
}) => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(
    null,
  );
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Location watcher subscription
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );

  // On component mount, get location permissions and start watching position
  useEffect(() => {
    const setupLocation = async () => {
      setIsLocating(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Permission to access location was denied");
          return;
        }

        // Get initial location
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Start watching position if delivering
        if (isDeliverer) {
          locationSubscription.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Highest,
              distanceInterval: 10, // Update every 10 meters
              timeInterval: 5000, // Or every 5 seconds
            },
            (location) => {
              setCurrentLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });

              // Recalculate ETA and distance
              updateEtaAndDistance(
                location.coords.latitude,
                location.coords.longitude,
                destination?.latitude,
                destination?.longitude,
              );
            },
          );
        }
      } catch (error) {
        console.error("Error setting up location:", error);
        setLocationError("Could not get your location");
      } finally {
        setIsLocating(false);
      }
    };

    setupLocation();

    // Cleanup
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [isDeliverer]);

  // Update destination when tracking changes
  useEffect(() => {
    if (!tracking) return;

    // Determine destination based on route stage
    let dest: Coordinates | null = null;

    if (
      tracking.routeStage === "to_restaurant" &&
      tracking.restaurantLocation
    ) {
      dest = {
        latitude: tracking.restaurantLocation.latitude,
        longitude: tracking.restaurantLocation.longitude,
      };
    } else if (
      tracking.routeStage === "to_customer" &&
      tracking.customerLocation
    ) {
      dest = {
        latitude: tracking.customerLocation.latitude,
        longitude: tracking.customerLocation.longitude,
      };
    }

    setDestination(dest);

    // Update ETA and distance
    if (currentLocation && dest) {
      updateEtaAndDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        dest.latitude,
        dest.longitude,
      );
    }
  }, [tracking, currentLocation]);

  // Calculate and update ETA and distance
  const updateEtaAndDistance = (
    startLat?: number,
    startLon?: number,
    endLat?: number,
    endLon?: number,
  ) => {
    if (!startLat || !startLon || !endLat || !endLon) return;

    // Calculate distance
    const dist = calculateDistance(startLat, startLon, endLat, endLon);
    setDistance(dist);

    // Calculate ETA
    const travelTime = calculateTravelTime(dist, "driving");
    const etaDate = new Date(Date.now() + travelTime * 60 * 1000);
    setEta(formatETA(etaDate));
  };

  // Determine restaurant and customer coordinates
  const getRestaurantCoords = (): Coordinates | undefined => {
    if (tracking?.restaurantLocation) {
      return {
        latitude: tracking.restaurantLocation.latitude,
        longitude: tracking.restaurantLocation.longitude,
      };
    }
    return undefined;
  };

  const getCustomerCoords = (): Coordinates | undefined => {
    if (tracking?.customerLocation) {
      return {
        latitude: tracking.customerLocation.latitude,
        longitude: tracking.customerLocation.longitude,
      };
    }
    return undefined;
  };

  // Render loading state
  if (isLocating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.colorBurlywood} />
        <Text style={styles.loadingText}>Getting location...</Text>
      </View>
    );
  }

  // Render error state
  if (locationError) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>{locationError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLocationError(null);
            setIsLocating(true);
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get stage description
  const getStageDescription = (): string => {
    if (!tracking) return "Loading route...";

    switch (tracking.routeStage) {
      case "to_restaurant":
        return "Heading to restaurant for pickup";
      case "to_customer":
        return "Delivering to customer";
      case "completed":
        return "Delivery completed";
      default:
        return "Tracking delivery";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{getStageDescription()}</Text>
        {tracking?.status === "picked_up" && (
          <View style={styles.etaBadge}>
            <Feather name="clock" size={14} color="#fff" />
            <Text style={styles.etaText}>
              {eta ? `${eta} remaining` : "Calculating..."}
            </Text>
          </View>
        )}
      </View>

      <MapSVGView
        tracking={tracking}
        restaurantCoords={getRestaurantCoords()}
        customerCoords={getCustomerCoords()}
        currentCoords={currentLocation || undefined}
      />

      <View style={styles.detailsContainer}>
        {tracking?.routeStage !== "completed" && (
          <>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Feather name="map-pin" size={16} color="#666" />
                <Text style={styles.detailLabel}>
                  {tracking?.routeStage === "to_restaurant"
                    ? "Restaurant"
                    : "Customer"}
                  :
                </Text>
              </View>
              <Text style={styles.detailValue}>
                {tracking?.routeStage === "to_restaurant"
                  ? tracking?.restaurantLocation?.address
                  : tracking?.customerLocation?.address}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Feather name="navigation" size={16} color="#666" />
                <Text style={styles.detailLabel}>Distance:</Text>
              </View>
              <Text style={styles.detailValue}>
                {distance ? `${distance.toFixed(2)} km` : "Calculating..."}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Feather name="clock" size={16} color="#666" />
                <Text style={styles.detailLabel}>ETA:</Text>
              </View>
              <Text style={styles.detailValue}>{eta || "Calculating..."}</Text>
            </View>
          </>
        )}

        {tracking?.routeStage === "completed" && (
          <View style={styles.completedContainer}>
            <Feather name="check-circle" size={48} color="#2ecc71" />
            <Text style={styles.completedText}>Delivery completed!</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 16,
  },
  headerContainer: {
    backgroundColor: Color.colorBurlywood,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  etaBadge: {
    backgroundColor: "rgba(0,0,0,0.2)",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  etaText: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 4,
    fontWeight: "500",
  },
  mapContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  mapLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
  detailsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  detailLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 100,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 6,
  },
  detailValue: {
    fontSize: 16,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  completedContainer: {
    padding: 20,
    alignItems: "center",
  },
  completedText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "#2ecc71",
  },
});

export default DeliveryMap;
