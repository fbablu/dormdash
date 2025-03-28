// app/(tabs)/profile/address.tsx
// Contributors: @Fardeen Bablu, @Yuening Li
// Time spent: 1 hour

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ADDRESS_STORAGE_KEY = "dormdash_address";

const AddressScreen = () => {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadSavedAddresses();
  }, []);

  const loadSavedAddresses = async () => {
    try {
      const savedAddresses = await AsyncStorage.getItem(ADDRESS_STORAGE_KEY);
      if (savedAddresses) {
        setAddresses(JSON.parse(savedAddresses));
        // Set the first address as current if available
        const addressList = JSON.parse(savedAddresses);
        if (addressList.length > 0) {
          setCurrentAddress(addressList[0]);
        }
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleAddAddress = () => {
    if (searchQuery.trim() === "") {
      Alert.alert("Error", "Please enter an address");
      return;
    }

    const newAddresses = [...addresses, searchQuery];
    setAddresses(newAddresses);
    setCurrentAddress(searchQuery);
    setSearchQuery("");

    // Save to AsyncStorage
    AsyncStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(newAddresses))
      .then(() => {
        Alert.alert("Success", "Address added successfully");
      })
      .catch((error) => {
        console.error("Error saving address:", error);
        Alert.alert("Error", "Failed to save address");
      });
  };

  const handleSelectAddress = (address: string) => {
    setCurrentAddress(address);
    // Save current address preference
    AsyncStorage.setItem("dormdash_current_address", address).catch((error) =>
      console.error("Error saving current address:", error),
    );
  };

  const handleDeleteAddress = (addressToDelete: string) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const newAddresses = addresses.filter(
              (address) => address !== addressToDelete,
            );
            setAddresses(newAddresses);

            // If the deleted address was the current one, set a new current address
            if (currentAddress === addressToDelete && newAddresses.length > 0) {
              setCurrentAddress(newAddresses[0]);
            } else if (newAddresses.length === 0) {
              setCurrentAddress("");
            }

            // Save to AsyncStorage
            AsyncStorage.setItem(
              ADDRESS_STORAGE_KEY,
              JSON.stringify(newAddresses),
            ).catch((error) => console.error("Error saving addresses:", error));
          },
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
        <Text style={styles.heading}>Addresses</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Search/Add Address Section */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color="gray" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for an address"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Current Location Option */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={() => {
            const demoAddress = "2401 West End Ave, Nashville, TN 37203";
            if (!addresses.includes(demoAddress)) {
              handleSelectAddress(demoAddress);
              const newAddresses = [...addresses, demoAddress];
              setAddresses(newAddresses);
              AsyncStorage.setItem(
                ADDRESS_STORAGE_KEY,
                JSON.stringify(newAddresses),
              ).catch((error) =>
                console.error("Error saving addresses:", error),
              );
            } else {
              handleSelectAddress(demoAddress);
            }
          }}
        >
          <Feather name="map-pin" size={24} color="#cfae70" />
          <Text style={styles.currentLocationText}>Use Current Location</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Saved Addresses Section */}
        <Text style={styles.sectionTitle}>Saved Addresses</Text>

        {addresses.length === 0 ? (
          <Text style={styles.emptyText}>No saved addresses</Text>
        ) : (
          addresses.map((address, index) => (
            <View key={index} style={styles.addressItem}>
              <TouchableOpacity
                style={styles.addressContent}
                onPress={() => handleSelectAddress(address)}
              >
                <View style={styles.addressRow}>
                  <Feather name="map-pin" size={20} color="#cfae70" />
                  <Text
                    style={[
                      styles.addressText,
                      currentAddress === address && styles.currentAddressText,
                    ]}
                    numberOfLines={2}
                  >
                    {address}
                  </Text>
                </View>
                {currentAddress === address && (
                  <Text style={styles.currentLabel}>Current</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteAddress(address)}
              >
                <Feather name="trash-2" size={20} color="#ff6b6b" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
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
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#000",
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#cfae70",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  currentLocationText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
  },
  addressContent: {
    flex: 1,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  currentAddressText: {
    fontWeight: "bold",
  },
  currentLabel: {
    fontSize: 12,
    color: "#cfae70",
    marginLeft: 32,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
});

export default AddressScreen;
