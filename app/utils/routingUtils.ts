// app/utils/routingUtils.ts
// Contributor: @Fardeen Bablu
// Time spent: 2.5 hours

import { getDorms, getRestaurants } from "@/lib/data/dataLoader";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Interface for location coordinates
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Interface for waypoint
export interface Waypoint extends Coordinates {
  name?: string;
  type?: "restaurant" | "dorm" | "intersection";
}

// Interface for a route
export interface Route {
  from: Coordinates;
  to: Coordinates;
  waypoints: Waypoint[];
  distance: number; // in kilometers
  duration: number; // in minutes
}

// Earth radius in kilometers
const EARTH_RADIUS = 6371;

// Default walking speed in km/h
const DEFAULT_WALKING_SPEED = 4.5;

// Default biking speed in km/h
const DEFAULT_BIKING_SPEED = 15;

// Average speed in km/h (accounts for traffic, stops, etc.)
const AVERAGE_SPEED = 20;

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS * c;

  return distance;
};

// Convert degrees to radians
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Calculate bearing between two coordinates
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const startLat = toRadians(lat1);
  const startLng = toRadians(lon1);
  const destLat = toRadians(lat2);
  const destLng = toRadians(lon2);

  const y = Math.sin(destLng - startLng) * Math.cos(destLat);
  const x =
    Math.cos(startLat) * Math.sin(destLat) -
    Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
  let brng = Math.atan2(y, x);
  brng = ((brng * 180) / Math.PI + 360) % 360; // Convert to degrees

  return brng;
};

// Calculate estimated travel time based on distance and mode of transport
export const calculateTravelTime = (
  distance: number,
  mode: "walking" | "biking" | "driving" = "driving",
): number => {
  let speed: number;

  switch (mode) {
    case "walking":
      speed = DEFAULT_WALKING_SPEED;
      break;
    case "biking":
      speed = DEFAULT_BIKING_SPEED;
      break;
    case "driving":
    default:
      speed = AVERAGE_SPEED;
      break;
  }

  // Time in minutes
  return (distance / speed) * 60;
};

// Generate intermediate waypoints along the route for smoother navigation
export const generateWaypoints = (
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  numPoints: number = 10,
): Waypoint[] => {
  const waypoints: Waypoint[] = [];

  for (let i = 1; i <= numPoints; i++) {
    const fraction = i / (numPoints + 1);

    // Linear interpolation between start and end points
    const lat = startLat + fraction * (endLat - startLat);
    const lon = startLon + fraction * (endLon - startLon);

    waypoints.push({
      latitude: lat,
      longitude: lon,
      type: "intersection",
    });
  }

  return waypoints;
};

// Simple greedy algorithm to calculate an optimal route
// In a real app, this would call a routing API like Google Directions
export const calculateOptimalRoute = async (
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
): Promise<{
  from: Coordinates;
  to: Coordinates;
  waypoints: Waypoint[];
}> => {
  // Simulated waypoints between start and end
  // In a real app, these would come from a routing API
  const waypoints = generateWaypoints(startLat, startLon, endLat, endLon, 8);

  return {
    from: { latitude: startLat, longitude: startLon },
    to: { latitude: endLat, longitude: endLon },
    waypoints: waypoints,
  };
};

// Get location coordinates for a restaurant by ID
export const getRestaurantCoordinates = async (
  restaurantId: string,
): Promise<Coordinates | null> => {
  try {
    const allRestaurants = await getRestaurants();

    // Find restaurant by ID (which is derived from the name)
    const restaurant = allRestaurants.find(
      (r: any) =>
        r.name.toLowerCase().replace(/[^a-z0-9]/g, "-") === restaurantId,
    );

    if (restaurant && restaurant.coordinates) {
      const [lat, lon] = restaurant.coordinates
        .split(",")
        .map((coord: string) => parseFloat(coord.trim()));
      return { latitude: lat, longitude: lon };
    }

    return null;
  } catch (error) {
    console.error("Error getting restaurant coordinates:", error);
    return null;
  }
};

// Get location coordinates for a dorm by name
export const getDormCoordinates = async (
  dormName: string,
): Promise<Coordinates | null> => {
  try {
    const allDorms = await getDorms();

    // Find dorm by name
    const dorm = allDorms.find(
      (d: any) =>
        d.name.toLowerCase() === dormName.toLowerCase() ||
        d.name.toLowerCase().includes(dormName.toLowerCase()),
    );

    if (dorm && dorm.coordinates) {
      const [lat, lon] = dorm.coordinates
        .split(",")
        .map((coord: string) => parseFloat(coord.trim()));
      return { latitude: lat, longitude: lon };
    }

    return null;
  } catch (error) {
    console.error("Error getting dorm coordinates:", error);
    return null;
  }
};

// Calculate ETA based on current position and destination
export const calculateETA = (
  currentLat: number,
  currentLon: number,
  destLat: number,
  destLon: number,
  mode: "walking" | "biking" | "driving" = "driving",
): Date => {
  const distance = calculateDistance(currentLat, currentLon, destLat, destLon);
  const travelTimeMinutes = calculateTravelTime(distance, mode);

  // Calculate arrival time
  const now = new Date();
  const arrivalTime = new Date(now.getTime() + travelTimeMinutes * 60000);

  return arrivalTime;
};

// Get campus navigation landmarks for better routing
export const getCampusLandmarks = async (): Promise<Waypoint[]> => {
  try {
    // First try to get from AsyncStorage
    const landmarksJson = await AsyncStorage.getItem("campus_landmarks");
    if (landmarksJson) {
      return JSON.parse(landmarksJson);
    }

    // If not in storage, use default Vanderbilt landmarks
    const defaultLandmarks: Waypoint[] = [
      {
        name: "Vanderbilt Main Gate",
        latitude: 36.145204,
        longitude: -86.802772,
        type: "intersection",
      },
      {
        name: "Alumni Lawn",
        latitude: 36.146667,
        longitude: -86.803611,
        type: "intersection",
      },
      {
        name: "Kirkland Hall",
        latitude: 36.147659,
        longitude: -86.803365,
        type: "intersection",
      },
      {
        name: "Library Lawn",
        latitude: 36.145278,
        longitude: -86.801944,
        type: "intersection",
      },
      {
        name: "Rand Hall",
        latitude: 36.146734,
        longitude: -86.804071,
        type: "intersection",
      },
      {
        name: "21st Ave & Wedgewood",
        latitude: 36.142847,
        longitude: -86.801524,
        type: "intersection",
      },
      {
        name: "Blakemore & 21st Ave",
        latitude: 36.149004,
        longitude: -86.802876,
        type: "intersection",
      },
      {
        name: "Highland & 25th Ave",
        latitude: 36.142473,
        longitude: -86.810026,
        type: "intersection",
      },
    ];

    // Save to AsyncStorage for future use
    await AsyncStorage.setItem(
      "campus_landmarks",
      JSON.stringify(defaultLandmarks),
    );

    return defaultLandmarks;
  } catch (error) {
    console.error("Error getting campus landmarks:", error);
    return [];
  }
};

// Find the nearest landmark to a given position
export const findNearestLandmark = async (
  lat: number,
  lon: number,
): Promise<Waypoint | null> => {
  try {
    const landmarks = await getCampusLandmarks();
    if (landmarks.length === 0) return null;

    let nearestLandmark = landmarks[0];
    let shortestDistance = calculateDistance(
      lat,
      lon,
      landmarks[0].latitude,
      landmarks[0].longitude,
    );

    for (let i = 1; i < landmarks.length; i++) {
      const distance = calculateDistance(
        lat,
        lon,
        landmarks[i].latitude,
        landmarks[i].longitude,
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestLandmark = landmarks[i];
      }
    }

    return nearestLandmark;
  } catch (error) {
    console.error("Error finding nearest landmark:", error);
    return null;
  }
};

// Generate a more realistic route using campus landmarks
export const generateCampusRoute = async (
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
): Promise<Route> => {
  try {
    // First check direct distance
    const directDistance = calculateDistance(
      startLat,
      startLon,
      endLat,
      endLon,
    );

    // For very short distances (less than 300m), just use direct route
    if (directDistance < 0.3) {
      const waypoints = generateWaypoints(
        startLat,
        startLon,
        endLat,
        endLon,
        3,
      );
      return {
        from: { latitude: startLat, longitude: startLon },
        to: { latitude: endLat, longitude: endLon },
        waypoints,
        distance: directDistance,
        duration: calculateTravelTime(directDistance),
      };
    }

    // For longer routes, use landmarks for more realistic paths
    const landmarks = await getCampusLandmarks();
    const routeWaypoints: Waypoint[] = [];

    // Add start point
    routeWaypoints.push({
      latitude: startLat,
      longitude: startLon,
      type: "intersection",
    });

    // Find nearest landmark to start and end points
    const nearestToStart = await findNearestLandmark(startLat, startLon);
    const nearestToEnd = await findNearestLandmark(endLat, endLon);

    if (
      nearestToStart &&
      calculateDistance(
        startLat,
        startLon,
        nearestToStart.latitude,
        nearestToStart.longitude,
      ) < 1
    ) {
      routeWaypoints.push(nearestToStart);
    }

    // Add intermediate campus landmarks that make sense for the route
    // This is a simplified algorithm - in a real app you'd use a proper routing service

    // Get direction of travel
    const bearing = calculateBearing(startLat, startLon, endLat, endLon);

    // Select landmarks that are roughly in the same direction
    for (const landmark of landmarks) {
      // Skip the landmarks we've already added
      if (landmark === nearestToStart || landmark === nearestToEnd) continue;

      const landmarkBearing = calculateBearing(
        startLat,
        startLon,
        landmark.latitude,
        landmark.longitude,
      );
      const bearingDiff = Math.abs(bearing - landmarkBearing);
      const normalizedDiff =
        bearingDiff > 180 ? 360 - bearingDiff : bearingDiff;

      // If the landmark is roughly in the same direction (within 45 degrees)
      // and is not too far from the path
      if (normalizedDiff < 45) {
        // Calculate distance from start to landmark
        const distanceToLandmark = calculateDistance(
          startLat,
          startLon,
          landmark.latitude,
          landmark.longitude,
        );

        // Calculate distance from landmark to end
        const distanceFromLandmarkToEnd = calculateDistance(
          landmark.latitude,
          landmark.longitude,
          endLat,
          endLon,
        );

        // Only add if this doesn't add more than 30% to the direct distance
        if (
          distanceToLandmark + distanceFromLandmarkToEnd <
          directDistance * 1.3
        ) {
          routeWaypoints.push(landmark);
        }
      }
    }

    // Sort waypoints by distance from start
    routeWaypoints.sort((a, b) => {
      const distA = calculateDistance(
        startLat,
        startLon,
        a.latitude,
        a.longitude,
      );
      const distB = calculateDistance(
        startLat,
        startLon,
        b.latitude,
        b.longitude,
      );
      return distA - distB;
    });

    // Add nearest to end if it exists and isn't already in the route
    if (
      nearestToEnd &&
      calculateDistance(
        endLat,
        endLon,
        nearestToEnd.latitude,
        nearestToEnd.longitude,
      ) < 1 &&
      !routeWaypoints.includes(nearestToEnd)
    ) {
      routeWaypoints.push(nearestToEnd);
    }

    // Add end point
    routeWaypoints.push({
      latitude: endLat,
      longitude: endLon,
      type: "intersection",
    });

    // Calculate total distance and duration
    let totalDistance = 0;
    for (let i = 0; i < routeWaypoints.length - 1; i++) {
      totalDistance += calculateDistance(
        routeWaypoints[i].latitude,
        routeWaypoints[i].longitude,
        routeWaypoints[i + 1].latitude,
        routeWaypoints[i + 1].longitude,
      );
    }

    const duration = calculateTravelTime(totalDistance);

    return {
      from: { latitude: startLat, longitude: startLon },
      to: { latitude: endLat, longitude: endLon },
      waypoints: routeWaypoints,
      distance: totalDistance,
      duration: duration,
    };
  } catch (error) {
    console.error("Error generating campus route:", error);

    // Fallback to simple route
    const waypoints = generateWaypoints(startLat, startLon, endLat, endLon, 5);
    const distance = calculateDistance(startLat, startLon, endLat, endLon);

    return {
      from: { latitude: startLat, longitude: startLon },
      to: { latitude: endLat, longitude: endLon },
      waypoints,
      distance,
      duration: calculateTravelTime(distance),
    };
  }
};

// Format an ETA into a user-friendly string
export const formatETA = (eta: Date): string => {
  const now = new Date();
  const diffMinutes = Math.round((eta.getTime() - now.getTime()) / 60000);

  if (diffMinutes < 1) {
    return "Less than a minute";
  } else if (diffMinutes === 1) {
    return "1 minute";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (minutes === 0) {
      return hours === 1 ? "1 hour" : `${hours} hours`;
    } else {
      return `${hours} hr ${minutes} min`;
    }
  }
};

// Get ETA with time string
export const getETAWithTime = (
  currentLat: number,
  currentLon: number,
  destLat: number,
  destLon: number,
  mode: "walking" | "biking" | "driving" = "driving",
): { eta: Date; etaString: string; timeString: string } => {
  const eta = calculateETA(currentLat, currentLon, destLat, destLon, mode);
  const etaString = formatETA(eta);

  // Format the arrival time
  const timeString = eta.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return { eta, etaString, timeString };
};
