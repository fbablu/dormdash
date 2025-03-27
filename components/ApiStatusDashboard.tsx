// components/ApiStatusDashboard.tsx
// Contributor: @Fardeen Bablu
// time spent: 3 hours

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { API_BASE_URL } from "@/lib/api/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/app/config/firebase";

interface EndpointStatus {
  endpoint: string;
  status: "success" | "error" | "pending";
  lastChecked: string;
  responseTime?: number;
  errorMessage?: string;
}

interface NetworkInfo {
  ipAddress?: string;
  platform: string;
  apiUrl: string;
  connectionType?: string;
}

const ApiStatusDashboard = () => {
  const [isApiAvailable, setIsApiAvailable] = useState<boolean | null>(null);
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [endpointStatuses, setEndpointStatuses] = useState<EndpointStatus[]>(
    [],
  );
  const [storageStats, setStorageStats] = useState<{ [key: string]: number }>(
    {},
  );
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    platform: Platform.OS,
    apiUrl: API_BASE_URL,
  });
  const [authState, setAuthState] = useState<{
    isLoggedIn: boolean;
    userId?: string;
    email?: string;
  }>({
    isLoggedIn: false,
  });

  // API endpoints to test
  const endpoints = [
    { name: "/api/health", path: "/api/health", method: "GET" },
    {
      name: "/api/users/favorites",
      path: "/api/users/favorites",
      method: "GET",
      needsAuth: true,
    },
    { name: "/api/restaurants", path: "/api/restaurants", method: "GET" },
    {
      name: "/api/user/profile",
      path: "/api/user/profile",
      method: "GET",
      needsAuth: true,
    },
  ];

  useEffect(() => {
    checkApiConnection();
    loadStorageStats();
    checkAuthState();
    fetchNetworkInfo();
  }, []);

  const fetchNetworkInfo = async () => {
    try {
      // Get local IP address (this is a simple approach, might not work in all environments)
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();

      setNetworkInfo((prev) => ({
        ...prev,
        ipAddress: data.ip,
      }));
    } catch (error) {
      console.log("Failed to fetch IP address:", error);
    }
  };

  const checkAuthState = async () => {
    try {
      // Check Firebase Auth state
      const currentUser = auth.currentUser;
      const userToken = await AsyncStorage.getItem("userToken");
      const userId = await AsyncStorage.getItem("userId");

      setAuthState({
        isLoggedIn: !!currentUser || !!userToken,
        userId: currentUser?.uid || userId || undefined,
        email: currentUser?.email || undefined,
      });
    } catch (error) {
      console.error("Error checking auth state:", error);
    }
  };

  const checkApiConnection = async () => {
    setIsCheckingApi(true);
    try {
      // Test if the API server is reachable
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch(`${API_BASE_URL}/api/health`, {
          signal: controller.signal,
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        clearTimeout(timeoutId);
        setIsApiAvailable(response.ok);

        if (response.ok) {
          checkEndpoints();
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error("API connection error:", error.message);
        setIsApiAvailable(false);
      }
    } finally {
      setIsCheckingApi(false);
    }
  };

  const checkEndpoints = async () => {
    const statusResults: EndpointStatus[] = [];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        let headers: { [key: string]: string } = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        // Add auth token if needed
        if (endpoint.needsAuth) {
          const token = await AsyncStorage.getItem("userToken");
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          } else {
            throw new Error("Authentication token not found");
          }
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
          method: endpoint.method || "GET",
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        let errorMessage;
        if (!response.ok) {
          const responseText = await response.text();
          errorMessage = `Status ${response.status}: ${responseText.substring(0, 100)}${responseText.length > 100 ? "..." : ""}`;
        }

        statusResults.push({
          endpoint: endpoint.name,
          status: response.ok ? "success" : "error",
          lastChecked: new Date().toLocaleTimeString(),
          responseTime,
          errorMessage,
        });
      } catch (error: any) {
        statusResults.push({
          endpoint: endpoint.name,
          status: "error",
          lastChecked: new Date().toLocaleTimeString(),
          errorMessage: error.message || "Unknown error",
        });
      }
    }

    setEndpointStatuses(statusResults);
  };

  const loadStorageStats = async () => {
    setIsLoadingStorage(true);
    try {
      const keys = await AsyncStorage.getAllKeys();

      const stats: { [key: string]: number } = {};

      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            // This measures size in characters, which is an approximation
            stats[key] = new TextEncoder().encode(value).length;
          } else {
            stats[key] = 0;
          }
        } catch (error) {
          console.error(`Error reading key ${key}:`, error);
          stats[key] = 0;
        }
      }

      setStorageStats(stats);
    } catch (error) {
      console.error("Error loading storage stats:", error);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const clearStorage = async () => {
    Alert.alert(
      "Clear Storage",
      "Are you sure you want to clear ALL AsyncStorage data? This is not reversible.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert("Success", "AsyncStorage data cleared");
              loadStorageStats();
              checkAuthState();
            } catch (error) {
              console.error("Error clearing storage:", error);
              Alert.alert("Error", "Failed to clear AsyncStorage data");
            }
          },
        },
      ],
    );
  };

  const clearSpecificKey = async (key: string) => {
    Alert.alert(
      "Clear Item",
      `Are you sure you want to delete "${key}" from storage?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(key);
              Alert.alert("Success", `${key} deleted`);
              loadStorageStats();
              checkAuthState();
            } catch (error) {
              console.error(`Error deleting ${key}:`, error);
              Alert.alert("Error", `Failed to delete ${key}`);
            }
          },
        },
      ],
    );
  };

  const exportStorageData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const result: Record<string, any> = {};

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        try {
          // Try to parse as JSON if possible
          result[key] = value ? JSON.parse(value) : null;
        } catch {
          // If not valid JSON, store as string
          result[key] = value;
        }
      }

      // Log to console for easy debugging
      console.log("===== ASYNCSTORAGE DATA EXPORT =====");
      console.log(JSON.stringify(result, null, 2));
      console.log("===================================");

      Alert.alert("Success", "Storage data exported to console logs");
    } catch (error) {
      console.error("Error exporting storage data:", error);
      Alert.alert("Error", "Failed to export storage data");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Status Dashboard</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            checkApiConnection();
            loadStorageStats();
            checkAuthState();
          }}
          disabled={isCheckingApi}
        >
          {isCheckingApi ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="refresh-cw" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Network Information */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>System Information</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Platform:</Text>
          <Text style={styles.statusValue}>{networkInfo.platform}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>API URL:</Text>
          <Text style={styles.statusValue}>{networkInfo.apiUrl}</Text>
        </View>
        {networkInfo.ipAddress && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>IP Address:</Text>
            <Text style={styles.statusValue}>{networkInfo.ipAddress}</Text>
          </View>
        )}
      </View>

      {/* Authentication Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Authentication Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Logged In:</Text>
          <View style={styles.statusIndicatorContainer}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: authState.isLoggedIn ? "#4caf50" : "#f44336",
                },
              ]}
            />
            <Text
              style={{ color: authState.isLoggedIn ? "#4caf50" : "#f44336" }}
            >
              {authState.isLoggedIn ? "Yes" : "No"}
            </Text>
          </View>
        </View>
        {authState.userId && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>User ID:</Text>
            <Text style={styles.statusValue}>{authState.userId}</Text>
          </View>
        )}
        {authState.email && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Email:</Text>
            <Text style={styles.statusValue}>{authState.email}</Text>
          </View>
        )}
      </View>

      {/* API Server Status */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>API Server Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Connection:</Text>
          <View style={styles.statusIndicatorContainer}>
            {isApiAvailable === null ? (
              <ActivityIndicator size="small" color="#ccae70" />
            ) : (
              <>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isApiAvailable ? "#4caf50" : "#f44336" },
                  ]}
                />
                <Text style={{ color: isApiAvailable ? "#4caf50" : "#f44336" }}>
                  {isApiAvailable ? "Connected" : "Disconnected"}
                </Text>
              </>
            )}
          </View>
        </View>

        {!isApiAvailable && (
          <View style={styles.troubleshootingCard}>
            <Text style={styles.troubleshootingTitle}>
              Troubleshooting Tips
            </Text>
            <Text style={styles.troubleshootingText}>
              • Check if the server is running (npm run dev in server directory)
            </Text>
            <Text style={styles.troubleshootingText}>
              • Verify the API_BASE_URL in config.ts matches your server address
            </Text>
            <Text style={styles.troubleshootingText}>
              • For iOS simulators, use http://127.0.0.1:3000
            </Text>
            <Text style={styles.troubleshootingText}>
              • For Android emulators, use http://10.0.2.2:3000
            </Text>
            <Text style={styles.troubleshootingText}>
              • For physical devices, use your computer's LAN IP address
            </Text>
          </View>
        )}

        {isApiAvailable && (
          <View style={styles.endpointsList}>
            <Text style={styles.endpointsTitle}>Endpoints Status</Text>
            {endpointStatuses.map((endpoint, index) => (
              <View key={index} style={styles.endpointItem}>
                <View style={styles.endpointHeader}>
                  <Text style={styles.endpointName}>{endpoint.endpoint}</Text>
                  <View
                    style={[
                      styles.endpointStatus,
                      {
                        backgroundColor:
                          endpoint.status === "success" ? "#4caf50" : "#f44336",
                      },
                    ]}
                  >
                    <Text style={styles.endpointStatusText}>
                      {endpoint.status === "success" ? "OK" : "Failed"}
                    </Text>
                  </View>
                </View>
                <View style={styles.endpointDetails}>
                  <Text style={styles.endpointDetailText}>
                    Last checked: {endpoint.lastChecked}
                  </Text>
                  {endpoint.responseTime && (
                    <Text style={styles.endpointDetailText}>
                      Response time: {endpoint.responseTime}ms
                    </Text>
                  )}
                </View>
                {endpoint.errorMessage && (
                  <View style={styles.errorMessageContainer}>
                    <Text style={styles.errorMessage}>
                      {endpoint.errorMessage}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.storageCard}>
        <View style={styles.storageHeader}>
          <Text style={styles.statusTitle}>AsyncStorage Data</Text>
          <View style={styles.storageActions}>
            <TouchableOpacity
              style={[styles.storageAction, styles.exportButton]}
              onPress={exportStorageData}
            >
              <Feather name="download" size={16} color="#ccae70" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.storageAction}
              onPress={loadStorageStats}
              disabled={isLoadingStorage}
            >
              {isLoadingStorage ? (
                <ActivityIndicator size="small" color="#ccae70" />
              ) : (
                <Feather name="refresh-cw" size={16} color="#ccae70" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.storageStats}>
          {Object.keys(storageStats).length > 0 ? (
            Object.entries(storageStats).map(([key, size], index) => (
              <View key={index} style={styles.storageItem}>
                <View style={styles.storageItemContent}>
                  <Text style={styles.storageKey} numberOfLines={1}>
                    {key}
                  </Text>
                  <Text style={styles.storageSize}>{formatBytes(size)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteItemButton}
                  onPress={() => clearSpecificKey(key)}
                >
                  <Feather name="trash-2" size={16} color="#f44336" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyStateText}>No storage data found</Text>
          )}
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={clearStorage}>
          <Text style={styles.clearButtonText}>Clear All Storage</Text>
        </TouchableOpacity>
      </View>

      {/* Firebase Configuration */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Firebase Configuration</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Auth Status:</Text>
          <View style={styles.statusIndicatorContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: auth.currentUser ? "#4caf50" : "#f44336" },
              ]}
            />
            <Text style={{ color: auth.currentUser ? "#4caf50" : "#f44336" }}>
              {auth.currentUser ? "Authenticated" : "Not Authenticated"}
            </Text>
          </View>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>API Key:</Text>
          <Text style={styles.statusValue}>
            {process.env.FIREBASE_API_KEY ? "[Set]" : "[Missing]"}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Project ID:</Text>
          <Text style={styles.statusValue}>
            {process.env.FIREBASE_PROJECT_ID || "dormdash-2bceb"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  refreshButton: {
    backgroundColor: "#ccae70",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  statusLabel: {
    color: "#666",
  },
  statusValue: {
    fontWeight: "500",
    maxWidth: "70%",
  },
  statusIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  troubleshootingCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
    padding: 12,
    marginTop: 12,
  },
  troubleshootingTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  troubleshootingText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  endpointsList: {
    marginTop: 16,
  },
  endpointsTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  endpointItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  endpointHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  endpointName: {
    fontWeight: "500",
  },
  endpointStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  endpointStatusText: {
    fontSize: 12,
    color: "#fff",
  },
  endpointDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  endpointDetailText: {
    fontSize: 12,
    color: "#666",
    marginRight: 8,
  },
  errorMessageContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#ffebee",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#f44336",
  },
  errorMessage: {
    fontSize: 12,
    color: "#d32f2f",
  },
  storageCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  storageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  storageActions: {
    flexDirection: "row",
  },
  storageAction: {
    padding: 8,
  },
  exportButton: {
    marginRight: 8,
  },
  storageStats: {
    marginBottom: 16,
  },
  storageItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  storageItemContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  storageKey: {
    flex: 1,
    color: "#333",
    marginRight: 8,
  },
  storageSize: {
    fontWeight: "500",
    color: "#666",
    width: 80,
    textAlign: "right",
  },
  deleteItemButton: {
    padding: 8,
  },
  emptyStateText: {
    textAlign: "center",
    padding: 16,
    color: "#999",
  },
  clearButton: {
    backgroundColor: "#f44336",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});

export default ApiStatusDashboard;
