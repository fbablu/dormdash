// app/(tabs)/profile/notifications.tsx
// Contributors: @Fardeen Bablu, @Yuening Li
// Time spent: 1 hour

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ScrollView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_STORAGE_KEY = "dormdash_notifications";

// Define notification settings types
interface NotificationSetting {
  id: string;
  title: string;
  enabled: boolean;
  type: string; // 'push', 'sms', 'email', etc.
}

const NotificationsScreen = () => {
  const [notificationSettings, setNotificationSettings] = useState<
    NotificationSetting[]
  >([
    {
      id: "order_updates",
      title: "Order Updates",
      enabled: true,
      type: "Push; Off: SMS",
    },
    { id: "store_offers", title: "Store Offers", enabled: true, type: "Push" },
    {
      id: "dormdash_offers",
      title: "DormDash Offers",
      enabled: true,
      type: "Push",
    },
    {
      id: "recommendations",
      title: "Recommendations",
      enabled: true,
      type: "Push",
    },
    { id: "reminders", title: "Reminders", enabled: true, type: "Push" },
    {
      id: "product_updates",
      title: "Product Updates & News",
      enabled: true,
      type: "Push",
    },
  ]);

  // Load saved notification settings on mount
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(
          NOTIFICATIONS_STORAGE_KEY,
        );
        if (savedSettings) {
          setNotificationSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error("Error loading notification settings:", error);
      }
    };

    loadSavedSettings();
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  const toggleNotification = async (id: string) => {
    // Update the notification setting
    const updatedSettings = notificationSettings.map((setting) =>
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting,
    );

    setNotificationSettings(updatedSettings);

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(updatedSettings),
      );
    } catch (error) {
      console.error("Error saving notification settings:", error);
      Alert.alert("Error", "Failed to save notification settings");
    }
  };

  const handleSaveChanges = async () => {
    try {
      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(notificationSettings),
      );
      Alert.alert("Success", "Notification settings updated successfully");
      router.back();
    } catch (error) {
      console.error("Error saving notification settings:", error);
      Alert.alert("Error", "Failed to save notification settings");
    }
  };

  const sendTestNotification = () => {
    // Find which notifications are enabled
    const enabledNotifications = notificationSettings.filter(
      (setting) => setting.enabled,
    );

    if (enabledNotifications.length === 0) {
      Alert.alert(
        "No Notifications Enabled",
        "Please enable at least one notification type to test.",
      );
      return;
    }

    // Select a random enabled notification type for the test
    const randomNotification =
      enabledNotifications[
        Math.floor(Math.random() * enabledNotifications.length)
      ];

    // Show an alert that simulates a notification
    Alert.alert(
      "DormDash Test Notification",
      `This is a test ${randomNotification.title} notification that would be sent via ${randomNotification.type}`,
      [
        { text: "Dismiss", style: "cancel" },
        {
          text: "View Details",
          onPress: () =>
            Alert.alert(
              "Notification Action",
              "You tapped on the notification!",
            ),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.heading}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {notificationSettings.map((setting, index) => (
          <View key={setting.id} style={styles.notificationItem}>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationTitle}>{setting.title}</Text>
              <Text style={styles.notificationType}>
                {setting.enabled ? `On: ${setting.type}` : "Off"}
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#d9d9d9", true: "#cfae70" }}
              thumbColor="#ffffff"
              ios_backgroundColor="#d9d9d9"
              onValueChange={() => toggleNotification(setting.id)}
              value={setting.enabled}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.testButton}
          onPress={sendTestNotification}
        >
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  notificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 4,
  },
  notificationType: {
    fontSize: 14,
    color: "#666",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#cfae70",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  testButton: {
    backgroundColor: "#d9d9d9",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  testButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default NotificationsScreen;
