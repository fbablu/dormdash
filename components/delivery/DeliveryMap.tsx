// components/delivery/DeliveryMap.tsx
// Contributor: @Fardeen Bablu
// Time spent: 4 hours

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";

import Svg, {
  Rect,
  Circle,
  Text as SvgText,
  G,
  Polyline,
} from "react-native-svg";

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

const MapSVGView: React.FC<{
  tracking: DeliveryTracking | null;
  restaurantCoords?: Coordinates;
  customerCoords?: Coordinates;
  currentCoords?: Coordinates;
}> = ({ tracking, restaurantCoords, customerCoords, currentCoords }) => {
  const { width } = Dimensions.get("window");
  const mapWidth = width - 40;
  const mapHeight = 300;

  const calcBounds = () => {
    let minLat = 90,
      maxLat = -90,
      minLon = 180,
      maxLon = -180;

    [currentCoords, restaurantCoords, customerCoords].forEach((coord) => {
      if (coord) {
        minLat = Math.min(minLat, coord.latitude);
        maxLat = Math.max(maxLat, coord.latitude);
        minLon = Math.min(minLon, coord.longitude);
        maxLon = Math.max(maxLon, coord.longitude);
      }
    });

    const latBuffer = (maxLat - minLat) * 0.1 || 0.01;
    const lonBuffer = (maxLon - minLon) * 0.1 || 0.01;

    return {
      minLat: minLat - latBuffer,
      maxLat: maxLat + latBuffer,
      minLon: minLon - lonBuffer,
      maxLon: maxLon + lonBuffer,
    };
  };

  const bounds = calcBounds();

  const mapToViewport = (lat: number, lon: number) => {
    const x =
      ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * mapWidth;
    const y =
      ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * mapHeight;
    return { x, y };
  };

  return (
    <View style={styles.mapContainer}>
      <Svg
        width={mapWidth}
        height={mapHeight}
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
      >
        {/* Background */}
        <Rect
          width={mapWidth}
          height={mapHeight}
          fill="#f5f5f5"
          rx={10}
          ry={10}
        />

        {/* Route */}
        {tracking?.route?.waypoints && (
          <>
            <Polyline
              points={tracking.route.waypoints
                .map((wp) => {
                  const { x, y } = mapToViewport(wp.latitude, wp.longitude);
                  return `${x},${y}`;
                })
                .join(" ")}
              stroke="#4a6fa5"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="5,5"
            />
            {tracking.route.waypoints.map((wp, index) => {
              const { x, y } = mapToViewport(wp.latitude, wp.longitude);
              return (
                <Circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={3}
                  fill="#4a6fa5"
                  opacity={0.7}
                />
              );
            })}
          </>
        )}

        {/* Restaurant Marker */}
        {restaurantCoords &&
          (() => {
            const { x, y } = mapToViewport(
              restaurantCoords.latitude,
              restaurantCoords.longitude,
            );
            return (
              <G>
                <Circle cx={x} cy={y} r={10} fill="#f39c12" />
                <SvgText
                  x={x}
                  y={y + 5}
                  fontSize="10"
                  textAnchor="middle"
                  fill="white"
                >
                  R
                </SvgText>
              </G>
            );
          })()}

        {/* Customer Marker */}
        {customerCoords &&
          (() => {
            const { x, y } = mapToViewport(
              customerCoords.latitude,
              customerCoords.longitude,
            );
            return (
              <G>
                <Circle cx={x} cy={y} r={10} fill="#2ecc71" />
                <SvgText
                  x={x}
                  y={y + 5}
                  fontSize="10"
                  textAnchor="middle"
                  fill="white"
                >
                  C
                </SvgText>
              </G>
            );
          })()}

        {/* Current Location Marker */}
        {currentCoords &&
          (() => {
            const { x, y } = mapToViewport(
              currentCoords.latitude,
              currentCoords.longitude,
            );
            return (
              <G>
                <Circle cx={x} cy={y} r={8} fill="#3498db" />
                <Circle cx={x} cy={y} r={12} fill="#3498db" fillOpacity={0.3} />
              </G>
            );
          })()}
      </Svg>

      {/* Legend */}
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

  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );

  useEffect(() => {
    const setupLocation = async () => {
      setIsLocating(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Permission to access location was denied");
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (isDeliverer) {
          locationSubscription.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Highest,
              distanceInterval: 10,
              timeInterval: 5000,
            },
            (location) => {
              const { latitude, longitude } = location.coords;
              setCurrentLocation({ latitude, longitude });

              updateEtaAndDistance(
                latitude,
                longitude,
                destination?.latitude,
                destination?.longitude,
              );
            },
          );
        }
      } catch (err) {
        setLocationError("Could not get your location");
      } finally {
        setIsLocating(false);
      }
    };

    setupLocation();

    return () => {
      locationSubscription.current?.remove();
    };
  }, [isDeliverer]);

  useEffect(() => {
    if (!tracking) return;

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

    if (currentLocation && dest) {
      updateEtaAndDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        dest.latitude,
        dest.longitude,
      );
    }
  }, [tracking, currentLocation]);

  const updateEtaAndDistance = (
    startLat?: number,
    startLon?: number,
    endLat?: number,
    endLon?: number,
  ) => {
    if (
      startLat == null ||
      startLon == null ||
      endLat == null ||
      endLon == null
    )
      return;

    const dist = calculateDistance(startLat, startLon, endLat, endLon);
    setDistance(dist);

    const travelTime = calculateTravelTime(dist, "driving");
    const etaDate = new Date(Date.now() + travelTime * 60 * 1000);
    setEta(formatETA(etaDate));
  };

  return (
    <View style={styles.container}>
      {isLocating ? (
        <ActivityIndicator size="large" color={Color.primary} />
      ) : locationError ? (
        <Text style={styles.errorText}>{locationError}</Text>
      ) : (
        <>
          <MapSVGView
            tracking={tracking}
            restaurantCoords={tracking?.restaurantLocation}
            customerCoords={tracking?.customerLocation}
            currentCoords={currentLocation ?? undefined}
          />
          {eta && (
            <Text style={styles.etaText}>
              ETA: {eta} ({distance?.toFixed(2)} km)
            </Text>
          )}
        </>
      )}
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
