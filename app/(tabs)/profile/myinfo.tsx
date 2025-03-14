// app/(tabs)/profile/myinfo.tsx
// Contributors: @Fardeen Bablu, @Yuening Li
// Time spent: 45 minutes

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const USER_INFO_STORAGE_KEY = 'dormdash_user_info';

interface UserInfo {
  name: string;
  email: string;
  password: string;
  phone: string;
}

const MyInfoScreen = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "Lily Li",
    email: "yuening.li@vanderbilt.edu",
    password: "••••••••",
    phone: "857-472-xxxx"
  });
  
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const savedInfo = await AsyncStorage.getItem(USER_INFO_STORAGE_KEY);
      if (savedInfo) {
        setUserInfo(JSON.parse(savedInfo));
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const saveUserInfo = async () => {
    try {
      await AsyncStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(userInfo));
    } catch (error) {
      console.error("Error saving user info:", error);
      Alert.alert("Error", "Failed to save your information");
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleEdit = (field: string, value: string) => {
    setEditMode(field);
    setEditValue(value);
  };

  const handleSave = () => {
    if (!editMode) return;
    
    // Basic validation
    if (editMode === 'email' && !editValue.includes('@')) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }
    
    if (editMode === 'phone' && editValue.length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number");
      return;
    }
    
    // Update user info
    const updatedInfo = { ...userInfo, [editMode]: editValue };
    setUserInfo(updatedInfo);
    
    // Save to storage
    AsyncStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(updatedInfo))
      .then(() => {
        setEditMode(null);
        setEditValue("");
      })
      .catch(error => {
        console.error("Error saving:", error);
        Alert.alert("Error", "Failed to save changes");
      });
  };

  const handleCancel = () => {
    setEditMode(null);
    setEditValue("");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Here you would typically make an API call to delete the account
            // For now, we'll just navigate back to the onboarding screen
            AsyncStorage.clear()
              .then(() => {
                router.replace("/onboarding");
              })
              .catch(error => {
                console.error("Error clearing storage:", error);
                Alert.alert("Error", "Failed to delete account");
              });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.heading}>My Information</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Name Field */}
        <InfoField 
          label="Your Name"
          value={userInfo.name}
          onEdit={() => handleEdit('name', userInfo.name)}
          editable={true}
          isEditing={editMode === 'name'}
        />
        
        {/* Email Field */}
        <InfoField 
          label="Vanderbilt Email"
          value={userInfo.email}
          onEdit={() => handleEdit('email', userInfo.email)}
          editable={true}
          isEditing={editMode === 'email'}
        />
        
        {/* Password Field */}
        <InfoField 
          label="Password"
          value={userInfo.password}
          onEdit={() => handleEdit('password', '')}
          editable={true}
          isEditing={editMode === 'password'}
        />
        
        {/* Phone Field */}
        <InfoField 
          label="Phone Number"
          value={userInfo.phone}
          onEdit={() => handleEdit('phone', userInfo.phone)}
          editable={true}
          isEditing={editMode === 'phone'}
        />
        
        {/* Edit Mode */}
        {editMode && (
          <View style={styles.editContainer}>
            <Text style={styles.editLabel}>
              Edit {editMode.charAt(0).toUpperCase() + editMode.slice(1)}:
            </Text>
            <TextInput
              style={styles.editInput}
              value={editValue}
              onChangeText={setEditValue}
              secureTextEntry={editMode === 'password'}
              autoCapitalize={editMode === 'email' ? 'none' : 'words'}
              keyboardType={editMode === 'phone' ? 'phone-pad' : editMode === 'email' ? 'email-address' : 'default'}
              autoFocus
            />
            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
        >
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

interface InfoFieldProps {
  label: string;
  value: string;
  onEdit: () => void;
  editable: boolean;
  isEditing: boolean;
}

const InfoField = ({ label, value, onEdit, editable, isEditing }: InfoFieldProps) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldValueContainer}>
      <Text style={[styles.fieldValue, isEditing && styles.fieldValueEditing]}>
        {value}
      </Text>
      {editable && !isEditing && (
        <TouchableOpacity onPress={onEdit}>
          <Feather name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.fieldDivider} />
  </View>
);

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
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  fieldValueContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  fieldValue: {
    fontSize: 18,
    color: "#000",
  },
  fieldValueEditing: {
    color: "#999",
  },
  fieldDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginTop: 8,
  },
  editContainer: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  editInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelButton: {
    padding: 10,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
  saveButton: {
    backgroundColor: "#cfae70",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  deleteButton: {
    alignItems: "center",
    padding: 16,
    marginTop: 16,
    marginBottom: 40,
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#ff6b6b",
    textDecorationLine: "underline",
  }
});

export default MyInfoScreen;