// app/utils/adminAuth.tsx
// Contributor: @Fardeen Bablu
// Time spent: 45 minutes

import React from "react";
import { View, Text } from "react-native";
import { User } from "../context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

// Admin emails list
export const ADMIN_EMAILS = [
  "admin@gmail.com",
  "taco-mama@gmail.com",
  "dormdash.vu@gmail.com",
];

// Restaurant owner emails mapped to their restaurants
export const RESTAURANT_ADMIN_MAP: Record<string, string> = {
  "taco-mama@gmail.com": "taco-mama",
  "banh-mi-roll@gmail.com": "banh-mi-roll",
};

export const isAdmin = (user: User | null): boolean => {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email);
};

export const isRestaurantOwner = (user: User | null): boolean => {
  if (!user || !user.email) return false;
  return Object.keys(RESTAURANT_ADMIN_MAP).includes(user.email);
};

export const getOwnedRestaurantId = (user: User | null): string | null => {
  if (!user || !user.email) return null;
  return RESTAURANT_ADMIN_MAP[user.email] || null;
};

// Function to submit menu for approval
export const submitMenuForApproval = async (
  restaurantId: string,
  menuData: any,
): Promise<boolean> => {
  try {
    // Store pending menu changes in a separate "pending_approvals" collection
    const approvalRef = doc(db, "pending_approvals", restaurantId);
    await setDoc(approvalRef, {
      menuData,
      status: "pending",
      submittedAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
    });

    // Send email notification (would be implemented via Cloud Functions)
    // For now, just log
    console.log(
      `Menu changes for ${restaurantId} submitted for approval to dormdash.vu@gmail.com`,
    );
    return true;
  } catch (error) {
    console.error("Error submitting menu for approval:", error);
    return false;
  }
};

// Default export component to satisfy router requirement
const AdminAuth: React.FC = () => {
  return (
    <View style={{ display: "none" }}>
      <Text>Admin Authentication Utilities</Text>
    </View>
  );
};

export default AdminAuth;
