// app/components/admin/MenuUploader.tsx
// Contributor: @Fardeen Bablu
// Time spent: 1.5 hours

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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { parseAndUploadMenuJson, transformMenuToFirebaseFormat, MenuCategory } from "@/app/utils/menuParser";
import { saveRestaurant } from "@/app/utils/menuIntegration";
import { Color } from "@/GlobalStyles";
import { Location, Cuisine } from "@/app/types/restaurants";

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
  const [jsonText, setJsonText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<MenuCategory[] | null>(null);
  const [email, setEmail] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [cuisines, setCuisines] = useState<string>("");

  // Preview the menu data
  const handlePreview = () => {
    try {
      if (!jsonText.trim()) {
        Alert.alert("Error", "Please enter JSON data");
        return;
      }

      // Parse the JSON
      const menuData = JSON.parse(jsonText);

      // Transform to Firebase format
      const categories = transformMenuToFirebaseFormat(menuData);

      setPreviewData(categories);
      Alert.alert(
        "Success",
        `Parsed ${categories.length} menu categories successfully`,
      );
    } catch (error) {
      console.error("JSON parsing error:", error);
      Alert.alert("Error", "Invalid JSON format. Please check your data.");
    }
  };

  // Upload the menu data to Firebase
  const handleUpload = async () => {
    if (!restaurantName.trim()) {
      Alert.alert("Error", "Please enter a restaurant name");
      return;
    }

    if (!jsonText.trim()) {
      Alert.alert("Error", "Please enter menu JSON data");
      return;
    }

    // Generate restaurant ID if not provided
    const restId =
      restaurantId || restaurantName.toLowerCase().replace(/[^a-z0-9]/g, "-");

    setLoading(true);
    try {
      // Parse the JSON
      const menuData = JSON.parse(jsonText);

      // Convert string location to Location enum type
      let locationValue: Location = "HILLSBORO VILLAGE";
      
      // Try to match the entered location with one of the enum values
      if (location) {
        const normalizedLocation = location.toUpperCase();
        const availableLocations: Location[] = [
          "HILLSBORO VILLAGE", 
          "MIDTOWN", 
          "WEST END AVENUE", 
          "ELLISTON PLACE", 
          "ON-CAMPUS", 
          "KOSHER/OUT OF CAMPUS RADIUS"
        ];
        
        const matchedLocation = availableLocations.find(
          loc => loc === normalizedLocation
        );
        
        if (matchedLocation) {
          locationValue = matchedLocation;
        }
      }

      // Convert string cuisines to Cuisine enum array
      const cuisineValues: Cuisine[] = [];
      
      if (cuisines) {
        const cuisineStrings = cuisines.split(",").map(c => c.trim());
        
        const availableCuisines: Cuisine[] = [
          "Vietnamese", "Asian", "Coffee", "Cafe", "American", "Breakfast", 
          "BBQ", "Healthy", "Bowls", "Smoothies", "Sandwiches", "Burgers", 
          "Ice Cream", "Desserts", "Noodles", "Chinese", "Japanese", "Sushi", 
          "Mexican", "Tacos", "Juice", "Tex-Mex", "Pizza", "Italian", "Southern", 
          "Chicken", "Hawaiian", "Poke", "Indian", "Fast Food", "Asian Fusion", 
          "Diner", "Pasta", "Thai", "Bubble Tea", "Beverages", "Kosher", "Vegetarian"
        ];
        
        cuisineStrings.forEach(cuisine => {
          // Find matching cuisine or use the first available as fallback
          const matchedCuisine = availableCuisines.find(
            c => c.toLowerCase() === cuisine.toLowerCase()
          );
          
          if (matchedCuisine) {
            cuisineValues.push(matchedCuisine);
          }
        });
        
        // If no valid cuisines found, add a default one
        if (cuisineValues.length === 0) {
          cuisineValues.push("American");
        }
      } else {
        // Default cuisine if none provided
        cuisineValues.push("American");
      }

      // Save restaurant information first
      await saveRestaurant(
        {
          name: restaurantName,
          location: locationValue,
          address: address || "1600 21st Ave S, Nashville, TN 37212",
          website: website || "https://example.com",
          cuisine: cuisineValues,
          acceptsCommodoreCash: true,
          image:
            "https://images.unsplash.com/photo-1592415486689-125cbbfcbee2?q=60&w=800&auto=format&fit=crop",
          rating: 4.5,
          reviewCount: "100+",
          deliveryTime: "15-25 min",
          deliveryFee: 3.99,
        },
        restId,
      );

      // Upload the menu data
      const success = await parseAndUploadMenuJson(restId, menuData);

      if (success) {
        Alert.alert(
          "Success",
          `Menu uploaded successfully for ${restaurantName}`,
        );
        setRestaurantId(restId);

        // Notify admin of pending approval if email is provided
        if (email) {
          console.log(`Sending approval notification to ${email}`);
          // In a real implementation, this would send an email
          Alert.alert(
            "Admin Notification",
            `An email notification would be sent to ${email} for approval.`,
          );
        }

        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error("Failed to upload menu");
      }
    } catch (error) {
      console.error("Error uploading menu:", error);
      Alert.alert(
        "Error",
        "Failed to upload menu. Please check your data and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    Alert.alert(
      "Reset Form",
      "Are you sure you want to reset the form? All data will be cleared.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setJsonText("");
            setPreviewData(null);
            if (!initialRestaurantId) {
              setRestaurantId(undefined);
            }
            if (!initialRestaurantName) {
              setRestaurantName("");
            }
            setEmail("");
            setLocation("");
            setAddress("");
            setWebsite("");
            setCuisines("");
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurant Menu Uploader</Text>

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
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. HILLSBORO VILLAGE, MIDTOWN"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter restaurant address"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="Enter restaurant website"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Cuisines (comma-separated)</Text>
            <TextInput
              style={styles.input}
              value={cuisines}
              onChangeText={setCuisines}
              placeholder="e.g. Mexican, Tacos"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Admin Email for Approval</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter admin email for approval notifications"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* Menu JSON Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu JSON Data</Text>
          <Text style={styles.instructions}>
            Enter the menu data in JSON format. The structure should match the
            Taco Mama menu format.
          </Text>

          <TextInput
            style={styles.jsonInput}
            value={jsonText}
            onChangeText={setJsonText}
            placeholder="Paste JSON menu data here..."
            multiline
            numberOfLines={10}
          />

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.previewButton]}
              onPress={handlePreview}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Preview</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleReset}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preview Section */}
        {previewData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>

            {previewData.map((category, index) => (
              <View key={index} style={styles.previewCategory}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.itemCount}>
                  {category.items.length} items
                </Text>

                {/* Show the first 3 items from each category */}
                {category.items.slice(0, 3).map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.previewItem}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>
                      ${item.price.toFixed(2)}
                    </Text>
                  </View>
                ))}

                {category.items.length > 3 && (
                  <Text style={styles.moreItems}>
                    + {category.items.length - 3} more items
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Upload Button */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleUpload}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Feather name="upload-cloud" size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>Upload Menu to Database</Text>
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
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  instructions: {
    marginBottom: 10,
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
  },
  jsonInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 200,
    textAlignVertical: "top",
    fontFamily: "monospace",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  previewButton: {
    backgroundColor: "#4CAF50",
  },
  resetButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  previewCategory: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  itemCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  previewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemName: {
    fontSize: 14,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "500",
  },
  moreItems: {
    marginTop: 8,
    color: "#666",
    fontStyle: "italic",
    fontSize: 14,
  },
  uploadButton: {
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default MenuUploader;