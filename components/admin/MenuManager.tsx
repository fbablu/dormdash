// app/components/admin/MenuManager.tsx
// Contributor: @Fardeen Bablu
// Time spent: 2 hours

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Color } from "@/GlobalStyles";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/app/config/firebase";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface MenuManagerProps {
  restaurantId?: string;
  restaurantName?: string;
  onComplete?: () => void;
}

const MenuManager: React.FC<MenuManagerProps> = ({
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
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(
    null,
  );
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number>(-1);
  const [editingItemName, setEditingItemName] = useState<string>("");
  const [editingItemDescription, setEditingItemDescription] =
    useState<string>("");
  const [editingItemPrice, setEditingItemPrice] = useState<string>("");
  const [showAddItem, setShowAddItem] = useState<boolean>(false);

  useEffect(() => {
    if (restaurantId) {
      loadMenu();
    }
  }, [restaurantId]);

  const loadMenu = async () => {
    if (!restaurantId) return;

    setLoading(true);
    try {
      const menuCollectionRef = collection(
        db,
        "restaurants",
        restaurantId,
        "menu",
      );
      const querySnapshot = await getDocs(menuCollectionRef);

      const loadedCategories: MenuCategory[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedCategories.push({
          id: doc.id,
          name: data.name || doc.id,
          items: Array.isArray(data.items) ? data.items : [],
        });
      });

      setCategories(loadedCategories);

      if (loadedCategories.length > 0) {
        setSelectedCategory(loadedCategories[0]);
      }
    } catch (error) {
      console.error("Error loading menu:", error);
      Alert.alert("Error", "Failed to load menu data");
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    if (!restaurantId || !selectedCategory) return;

    setLoading(true);
    try {
      const categoryRef = doc(
        db,
        "restaurants",
        restaurantId,
        "menu",
        selectedCategory.id,
      );

      await updateDoc(categoryRef, {
        items: selectedCategory.items,
      });

      Alert.alert("Success", "Menu items updated successfully");

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      Alert.alert("Error", "Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedCategory) return;

    setEditingItem(null);
    setEditingItemIndex(-1);
    setEditingItemName("");
    setEditingItemDescription("");
    setEditingItemPrice("");
    setShowAddItem(true);
  };

  const handleEditItem = (itemIndex: number) => {
    if (!selectedCategory) return;

    const item = selectedCategory.items[itemIndex];

    setEditingItem(item);
    setEditingItemIndex(itemIndex);
    setEditingItemName(item.name);
    setEditingItemDescription(item.description);
    setEditingItemPrice(item.price.toString());
    setShowAddItem(true);
  };

  const handleDeleteItem = (itemIndex: number) => {
    if (!selectedCategory) return;

    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const newItems = [...selectedCategory.items];
          newItems.splice(itemIndex, 1);

          setSelectedCategory({
            ...selectedCategory,
            items: newItems,
          });
        },
      },
    ]);
  };

  const handleSaveItem = () => {
    if (!selectedCategory) return;

    if (!editingItemName.trim()) {
      Alert.alert("Error", "Item name is required");
      return;
    }

    const price = parseFloat(editingItemPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    const newItem: MenuItem = {
      id: editingItem?.id || `item-${Date.now()}`,
      name: editingItemName.trim(),
      description: editingItemDescription.trim(),
      price,
    };

    let newItems = [...selectedCategory.items];

    if (editingItemIndex >= 0) {
      // Update existing item
      newItems[editingItemIndex] = newItem;
    } else {
      // Add new item
      newItems.push(newItem);
    }

    setSelectedCategory({
      ...selectedCategory,
      items: newItems,
    });

    setShowAddItem(false);
  };

  const renderItem = ({ item, index }: { item: MenuItem; index: number }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemName}>{item.name}</Text>
        <Text style={styles.menuItemDescription}>{item.description}</Text>
        <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.menuItemActions}>
        <TouchableOpacity
          style={styles.menuItemAction}
          onPress={() => handleEditItem(index)}
        >
          <Feather name="edit-2" size={20} color="#4caf50" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItemAction}
          onPress={() => handleDeleteItem(index)}
        >
          <Feather name="trash-2" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && categories.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Color.colorBurlywood} />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu Manager</Text>

      {categories.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No menu categories found</Text>
          <Text style={styles.emptyStateSubtext}>
            Use the Menu Uploader to add menu categories and items first.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.categoriesContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScrollContent}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory?.id === category.id &&
                      styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory?.id === category.id &&
                        styles.categoryButtonTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {selectedCategory && (
            <>
              <View style={styles.menuHeader}>
                <Text style={styles.menuSectionTitle}>
                  {selectedCategory.name}
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddItem}
                >
                  <Feather name="plus" size={16} color="#fff" />
                  <Text style={styles.addButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={selectedCategory.items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.menuListContent}
                ListEmptyComponent={
                  <View style={styles.emptyItemsState}>
                    <Text style={styles.emptyItemsText}>
                      No items in this category
                    </Text>
                    <Text style={styles.emptyItemsSubtext}>
                      Tap the Add Item button to add a new menu item.
                    </Text>
                  </View>
                }
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveChanges}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {showAddItem && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Item Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editingItemName}
                    onChangeText={setEditingItemName}
                    placeholder="Enter item name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editingItemDescription}
                    onChangeText={setEditingItemDescription}
                    placeholder="Enter item description"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Price</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.priceCurrency}>$</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={editingItemPrice}
                      onChangeText={setEditingItemPrice}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowAddItem(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveItemButton}
                    onPress={handleSaveItem}
                  >
                    <Text style={styles.saveItemButtonText}>Save Item</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: Color.colorBurlywood,
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesScrollContent: {
    paddingVertical: 4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: Color.colorBurlywood,
  },
  categoryButtonText: {
    fontWeight: "500",
  },
  categoryButtonTextActive: {
    color: "#fff",
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  menuSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addButtonText: {
    color: "#fff",
    marginLeft: 4,
  },
  menuListContent: {
    paddingBottom: 80,
  },
  emptyItemsState: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyItemsText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyItemsSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  menuItemDescription: {
    color: "#666",
    marginBottom: 4,
  },
  menuItemPrice: {
    fontWeight: "500",
    color: Color.colorBurlywood,
  },
  menuItemActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemAction: {
    padding: 8,
    marginLeft: 4,
  },
  saveButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  priceCurrency: {
    fontSize: 16,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  saveItemButton: {
    flex: 1,
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  saveItemButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default MenuManager;
