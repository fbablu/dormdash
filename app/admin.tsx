// app/admin.tsx
// Contributor: @Fardeen Bablu
// Time spent: 1 hour

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "./context/AuthContext";
import { Color } from "@/GlobalStyles";
import MenuUploader from "@/components/admin/MenuUploader";
import MenuManager from "@/components/admin/MenuManager";

// Admin emails 
const ADMIN_EMAILS = [
  "admin@gmail.com",
  "dormdash.vu@gmail.com",
];

// Restaurant owner to restaurant mapping
const RESTAURANT_OWNER_MAP: Record<string, string> = {
  "taco-mama@gmail.com": "taco-mama",
  "banh-mi-roll@gmail.com": "banh-mi-roll",
};

export default function AdminScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("menu-upload");

  // Check if current user is an admin
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  // Check if current user is a restaurant owner
  const isRestaurantOwner = user && user.email in RESTAURANT_OWNER_MAP;

  // Get owned restaurant ID if applicable
  const ownedRestaurantId =
    isRestaurantOwner && user ? RESTAURANT_OWNER_MAP[user.email] : undefined;

  const handleBackPress = () => {
    router.back();
  };

  // If not an admin or restaurant owner, show unauthorized message
  if (!isAdmin && !isRestaurantOwner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.heading}>Admin Panel</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.unauthorizedContainer}>
          <Feather name="lock" size={64} color="#ccc" />
          <Text style={styles.unauthorizedTitle}>Unauthorized Access</Text>
          <Text style={styles.unauthorizedText}>
            Sorry, you don't have permission to access the admin panel.
          </Text>
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.backToHomeText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.heading}>Admin Panel</Text>
        <View style={styles.placeholder} />
      </View>

      {/* User role banner */}
      <View style={styles.roleBanner}>
        <Feather name="shield" size={16} color="#fff" />
        <Text style={styles.roleText}>
          {isAdmin ? "Admin Access" : "Restaurant Owner Access"}
        </Text>
        {isRestaurantOwner && (
          <Text style={styles.restaurantText}>
            {RESTAURANT_OWNER_MAP[user!.email]}
          </Text>
        )}
      </View>

      {/* Admin Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "menu-upload" && styles.activeTab]}
          onPress={() => setActiveTab("menu-upload")}
        >
          <Feather
            name="upload"
            size={20}
            color={activeTab === "menu-upload" ? Color.colorBurlywood : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "menu-upload" && styles.activeTabText,
            ]}
          >
            Upload Menu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "menu-editor" && styles.activeTab]}
          onPress={() => setActiveTab("menu-editor")}
        >
          <Feather
            name="edit"
            size={20}
            color={activeTab === "menu-editor" ? Color.colorBurlywood : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "menu-editor" && styles.activeTabText,
            ]}
          >
            Edit Menu
          </Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "approvals" && styles.activeTab]}
            onPress={() => setActiveTab("approvals")}
          >
            <Feather
              name="check-circle"
              size={20}
              color={activeTab === "approvals" ? Color.colorBurlywood : "#666"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "approvals" && styles.activeTabText,
              ]}
            >
              Approvals
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === "menu-upload" && (
          <MenuUploader
            restaurantId={ownedRestaurantId}
            restaurantName={
              ownedRestaurantId &&
              ownedRestaurantId
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
            }
            onComplete={() => {
              Alert.alert("Success", "Menu uploaded successfully");
            }}
          />
        )}

        {activeTab === "menu-editor" && (
          <MenuManager
            restaurantId={ownedRestaurantId}
            restaurantName={
              ownedRestaurantId &&
              ownedRestaurantId
                .split("-")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
            }
            onComplete={() => {
              Alert.alert("Success", "Menu updated successfully");
            }}
          />
        )}

        {activeTab === "approvals" && isAdmin && (
          <View style={styles.comingSoonContainer}>
            <Feather name="clipboard" size={64} color="#ddd" />
            <Text style={styles.comingSoonText}>Approval Management</Text>
            <Text style={styles.comingSoonSubtext}>
              This feature is coming soon. You'll be able to review and approve
              menu changes submitted by restaurant owners.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  roleBanner: {
    backgroundColor: Color.colorBurlywood,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  roleText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  restaurantText: {
    color: "#fff",
    fontStyle: "italic",
    marginLeft: 8,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  unauthorizedTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  backToHomeButton: {
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backToHomeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Color.colorBurlywood,
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: Color.colorBurlywood,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  comingSoonText: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
