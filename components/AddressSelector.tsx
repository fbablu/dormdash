// components/AddressSelector.tsx
// Contributor: @Fardeen Bablu
// Time spent: 1.5 hours

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDorms } from "@/lib/data/dataLoader";

interface Dorm {
  name: string;
  address: string;
  coordinates: string;
}

interface AddressSelectorProps {
  onAddressChange?: (address: string) => void;
}

const CURRENT_ADDRESS_KEY = "dormdash_current_address";
const DEFAULT_ADDRESS = "Vanderbilt Campus";

const AddressSelector: React.FC<AddressSelectorProps> = ({
  onAddressChange,
}) => {
  const [currentAddress, setCurrentAddress] = useState<string>(DEFAULT_ADDRESS);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    loadCurrentAddress();
    loadDorms();
  }, []);

  const loadCurrentAddress = async () => {
    try {
      const savedAddress = await AsyncStorage.getItem(CURRENT_ADDRESS_KEY);
      if (savedAddress) {
        setCurrentAddress(savedAddress);
        onAddressChange?.(savedAddress);
      }
    } catch (error) {
      console.error("Error loading current address:", error);
    }
  };

  const loadDorms = async () => {
    try {
      const dormData = await getDorms();
      setDorms(dormData);
    } catch (error) {
      console.error("Error loading dorms:", error);
    }
  };

  const handleSelectAddress = async (address: string) => {
    try {
      setCurrentAddress(address);
      await AsyncStorage.setItem(CURRENT_ADDRESS_KEY, address);
      setModalVisible(false);
      onAddressChange?.(address);
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  const filteredDorms = dorms.filter((dorm) => {
    const query = searchQuery.toLowerCase();
    return (
      dorm.name.toLowerCase().includes(query) ||
      dorm.address.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <TouchableOpacity
        style={styles.locationSelector}
        onPress={() => setModalVisible(true)}
      >
        <Feather name="map-pin" size={20} color="black" />
        <Text style={styles.locationText}>{currentAddress}</Text>
        <Feather name="chevron-down" size={20} color="black" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Delivery Address</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Feather name="search" size={20} color="gray" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search dorms..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredDorms}
              keyExtractor={(item) => item.name}
              contentContainerStyle={styles.dormsList}
              ListHeaderComponent={
                <TouchableOpacity
                  style={styles.addressItem}
                  onPress={() => handleSelectAddress(DEFAULT_ADDRESS)}
                >
                  <Feather
                    name="home"
                    size={20}
                    color={
                      currentAddress === DEFAULT_ADDRESS ? "#cfae70" : "#666"
                    }
                  />
                  <Text
                    style={[
                      styles.addressText,
                      currentAddress === DEFAULT_ADDRESS &&
                        styles.activeAddressText,
                    ]}
                  >
                    {DEFAULT_ADDRESS}
                  </Text>
                  {currentAddress === DEFAULT_ADDRESS && (
                    <Feather name="check" size={20} color="#cfae70" />
                  )}
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.addressItem}
                  onPress={() => handleSelectAddress(item.name)}
                >
                  <Feather
                    name="map-pin"
                    size={20}
                    color={currentAddress === item.name ? "#cfae70" : "#666"}
                  />
                  <View style={styles.addressDetails}>
                    <Text
                      style={[
                        styles.addressText,
                        currentAddress === item.name &&
                          styles.activeAddressText,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.addressSubtext} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                  {currentAddress === item.name && (
                    <Feather name="check" size={20} color="#cfae70" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#D9D9D9",
    padding: 8,
    borderRadius: 24,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  dormsList: {
    paddingBottom: 20,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  addressDetails: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 16,
    color: "#333",
  },
  activeAddressText: {
    fontWeight: "bold",
    color: "#cfae70",
  },
  addressSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});

export default AddressSelector;
