// components/admin/MenuUploader.tsx
// Contributor: @Fardeen Bablu
// Time spent: 2 hours

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Color } from "@/GlobalStyles";
import * as DocumentPicker from 'expo-document-picker';
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/app/config/firebase";

interface MenuUploaderProps {
  restaurantId?: string;
  restaurantName?: string;
  onComplete?: () => void;
}

const MenuUploader: React.FC<MenuUploaderProps> = ({
  restaurantId: initialRestaurantId,
  restaurantName: initialRestaurantName,
  onComplete,
}) => {
  const [restaurantId, setRestaurantId] = useState<string | undefined>(
    initialRestaurantId,
  );
  const [restaurantName, setRestaurantName] = useState<string>(
    initialRestaurantName || "",
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>("dormdash.vu@gmail.com");
  const [pdfFile, setPdfFile] = useState<{name: string, uri: string} | null>(null);

  // Select PDF menu
  const handleSelectPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        console.log('Document picker canceled');
        return;
      }
      
      // DocumentPicker.getDocumentAsync returns an array of assets when multiple is true
      const asset = result.assets[0];
      console.log('Document selected:', asset);
      setPdfFile({
        name: asset.name,
        uri: asset.uri
      });
    } catch (error) {
      console.error("Error selecting PDF:", error);
      Alert.alert("Error", "Failed to select PDF file");
    }
  };

  // Upload PDF request to database
  const handleUpload = async () => {
    if (!restaurantName.trim()) {
      Alert.alert("Error", "Please enter a restaurant name");
      return;
    }

    if (!pdfFile) {
      Alert.alert("Error", "Please select a PDF menu file");
      return;
    }

    // Generate restaurant ID if not provided
    const restId =
      restaurantId || restaurantName.toLowerCase().replace(/[^a-z0-9]/g, "-");

    setLoading(true);
    try {
      // In a real implementation, you would upload the PDF to Firebase Storage
      // For now, we'll just simulate by saving a request to Firestore
      
      // Save menu request to Firestore
      await setDoc(doc(db, "menu_requests", restId), {
        restaurantId: restId,
        restaurantName: restaurantName,
        requestedAt: new Date().toISOString(),
        status: "pending",
        requestedBy: "restaurant_owner",
        adminEmail: adminEmail,
        fileName: pdfFile.name,
        // fileUrl: would normally be a Firebase Storage URL
      });

      Alert.alert(
        "Success",
        `Menu PDF uploaded successfully! A request has been sent to ${adminEmail} for processing.`,
        [
          {
            text: "OK",
            onPress: () => {
              setPdfFile(null);
              if (onComplete) {
                onComplete();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error uploading menu request:", error);
      Alert.alert(
        "Error",
        "Failed to upload menu request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    Alert.alert(
      "Reset Form",
      "Are you sure you want to reset the form?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setPdfFile(null);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu PDF Uploader</Text>

      <ScrollView style={styles.scrollView}>
        {/* Restaurant Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Restaurant Name *</Text>
            <TextInput
              style={styles.input}
              value={restaurantName}
              onChangeText={setRestaurantName}
              placeholder="Enter restaurant name"
              editable={!initialRestaurantName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Admin Email for Processing</Text>
            <TextInput
              style={styles.input}
              value={adminEmail}
              onChangeText={setAdminEmail}
              placeholder="Enter admin email for processing"
              keyboardType="email-address"
              editable={false}
            />
            <Text style={styles.helperText}>
              Your menu will be processed by the DormDash team
            </Text>
          </View>
        </View>

        {/* PDF Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu PDF Upload</Text>
          <Text style={styles.instructions}>
            Upload your restaurant menu as a PDF file. The DormDash team will process it
            and add it to your restaurant profile.
          </Text>

          <TouchableOpacity 
            style={styles.uploadArea}
            onPress={handleSelectPdf}
          >
            {pdfFile ? (
              <View style={styles.selectedFileContainer}>
                <Feather name="file-text" size={32} color={Color.colorBurlywood} />
                <Text style={styles.selectedFileName}>{pdfFile.name}</Text>
                <TouchableOpacity 
                  style={styles.removeFileButton}
                  onPress={() => setPdfFile(null)}
                >
                  <Feather name="x" size={18} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadPrompt}>
                <Feather name="upload" size={32} color="#888" />
                <Text style={styles.uploadText}>
                  Tap to select a PDF menu file
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleReset}
              disabled={loading || !pdfFile}
            >
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Upload Button */}
      <TouchableOpacity
        style={[
          styles.uploadButton,
          (!pdfFile || !restaurantName) && styles.disabledButton
        ]}
        onPress={handleUpload}
        disabled={loading || !pdfFile || !restaurantName}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Feather name="send" size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>Submit Menu Request</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: Color.colorBurlywood,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: "500",
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  instructions: {
    marginBottom: 16,
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 20,
    minHeight: 150,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
    marginBottom: 16,
  },
  uploadPrompt: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    marginTop: 12,
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
  selectedFileContainer: {
    alignItems: "center",
    position: "relative",
    width: "100%",
  },
  selectedFileName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "500",
    color: Color.colorBurlywood,
    textAlign: "center",
    maxWidth: "80%",
  },
  removeFileButton: {
    position: "absolute",
    top: -10,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  buttonGroup: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: "center",
  },
  resetButton: {
    backgroundColor: "#f1f1f1",
  },
  buttonText: {
    fontWeight: "500",
    color: "#666",
  },
  uploadButton: {
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  disabledButton: {
    backgroundColor: "#d1c3a3",
    opacity: 0.7,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default MenuUploader;