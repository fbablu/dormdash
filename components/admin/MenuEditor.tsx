// components/admin/MenuEditor.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Color } from "@/GlobalStyles";
import { generateMenuItemId } from "@/app/utils/menuIntegration";
import {
  getMenuCategories,
  saveCategory,
  deleteCategory,
} from "@/app/utils/firebaseAdapter";

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

interface MenuEditorProps {
  restaurantId?: string;
  restaurantName?: string;
  onSave?: () => void;
}

const MenuEditor: React.FC<MenuEditorProps> = ({
  restaurantId,
  restaurantName,
  onSave,
}) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(
    null,
  );
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  // New category state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // New/edit item state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  // Load existing menu data on mount
  useEffect(() => {
    if (restaurantId) {
      loadMenu();
    }
  }, [restaurantId]);

  const loadMenu = async () => {
    if (!restaurantId) {
      Alert.alert("Error", "Restaurant ID is required");
      return;
    }

    setLoading(true);
    try {
      // Use our adapter function instead of direct Firebase calls
      const loadedCategories = await getMenuCategories(restaurantId);

      // Sort alphabetically
      loadedCategories.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(loadedCategories);

      // Select first category if available
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

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    if (!restaurantId) {
      Alert.alert("Error", "Restaurant ID is required");
      return;
    }

    setLoading(true);
    try {
      // Generate category ID from name
      const categoryId = newCategoryName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");

      // Check if category with this ID already exists
      const existingCategory = categories.find((cat) => cat.id === categoryId);
      if (existingCategory) {
        Alert.alert("Error", `Category "${newCategoryName}" already exists`);
        setLoading(false);
        return;
      }

      // Create new category
      const newCategory: MenuCategory = {
        id: categoryId,
        name: newCategoryName,
        items: [],
      };

      // Use our adapter function to save to "Firebase"
      const success = await saveCategory(restaurantId, categoryId, {
        name: newCategoryName,
        items: [],
      });

      if (success) {
        // Update local state
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        setSelectedCategory(newCategory);
        setNewCategoryName("");
        setShowCategoryModal(false);
      } else {
        Alert.alert("Error", "Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      Alert.alert("Error", "Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (category: MenuCategory) => {
    if (!restaurantId) return;

    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}" and all its items?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Use our adapter function to delete from "Firebase"
              const success = await deleteCategory(restaurantId, category.id);

              if (success) {
                // Update local state
                const updatedCategories = categories.filter(
                  (cat) => cat.id !== category.id,
                );
                setCategories(updatedCategories);

                // Select another category if available
                if (selectedCategory?.id === category.id) {
                  setSelectedCategory(
                    updatedCategories.length > 0 ? updatedCategories[0] : null,
                  );
                }
              } else {
                Alert.alert("Error", "Failed to delete category");
              }
            } catch (error) {
              console.error("Error deleting category:", error);
              Alert.alert("Error", "Failed to delete category");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // Open add/edit item modal
  const openItemModal = (item?: MenuItem) => {
    if (item) {
      // Edit existing item
      setEditingItem(item);
      setItemName(item.name);
      setItemDescription(item.description || "");
      setItemPrice(item.price.toString());
    } else {
      // Add new item
      setEditingItem(null);
      setItemName("");
      setItemDescription("");
      setItemPrice("");
    }
    setShowItemModal(true);
  };

  // Save item (add or update)
  const handleSaveItem = async () => {
    if (!selectedCategory || !restaurantId) {
      Alert.alert("Error", "Please select a category first");
      return;
    }

    if (!itemName.trim()) {
      Alert.alert("Error", "Item name is required");
      return;
    }

    const price = parseFloat(itemPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    setLoading(true);
    try {
      // Create new item or update existing one
      const item: MenuItem = {
        id: editingItem?.id || generateMenuItemId(itemName),
        name: itemName.trim(),
        description: itemDescription.trim(),
        price: price,
      };

      let updatedItems: MenuItem[];

      if (editingItem) {
        // Update existing item
        updatedItems = selectedCategory.items.map((i) =>
          i.id === editingItem.id ? item : i,
        );
      } else {
        // Add new item
        updatedItems = [...selectedCategory.items, item];
      }

      // Use our adapter function to save to "Firebase"
      const success = await saveCategory(restaurantId, selectedCategory.id, {
        name: selectedCategory.name,
        items: updatedItems,
      });

      if (success) {
        // Update local state
        const updatedCategories = categories.map((cat) => {
          if (cat.id === selectedCategory.id) {
            return { ...cat, items: updatedItems };
          }
          return cat;
        });

        setCategories(updatedCategories);
        setSelectedCategory({ ...selectedCategory, items: updatedItems });
        setShowItemModal(false);
      } else {
        Alert.alert("Error", "Failed to save item");
      }
    } catch (error) {
      console.error("Error saving item:", error);
      Alert.alert("Error", "Failed to save item");
    } finally {
      setLoading(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (item: MenuItem) => {
    if (!selectedCategory || !restaurantId) return;

    Alert.alert(
      "Delete Item",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Remove item from category
              const updatedItems = selectedCategory.items.filter(
                (i) => i.id !== item.id,
              );

              // Use our adapter function to save to "Firebase"
              const success = await saveCategory(
                restaurantId,
                selectedCategory.id,
                {
                  name: selectedCategory.name,
                  items: updatedItems,
                },
              );

              if (success) {
                // Update local state
                const updatedCategories = categories.map((cat) => {
                  if (cat.id === selectedCategory.id) {
                    return { ...cat, items: updatedItems };
                  }
                  return cat;
                });

                setCategories(updatedCategories);
                setSelectedCategory({
                  ...selectedCategory,
                  items: updatedItems,
                });
              } else {
                Alert.alert("Error", "Failed to delete item");
              }
            } catch (error) {
              console.error("Error deleting item:", error);
              Alert.alert("Error", "Failed to delete item");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderCategoryItem = ({ item }: { item: MenuCategory }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory?.id === item.id && styles.selectedCategoryItem,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <Text
        style={[
          styles.categoryItemText,
          selectedCategory?.id === item.id && styles.selectedCategoryItemText,
        ]}
      >
        {item.name}
      </Text>
      <Text style={styles.itemCount}>{item.items.length} items</Text>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCategory(item)}
      >
        <Feather name="trash-2" size={16} color="#ff6b6b" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render the rest of the component (UI code)
  // ...

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {restaurantName ? `${restaurantName} Menu` : "Restaurant Menu Editor"}
      </Text>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Color.colorBurlywood} />
        </View>
      )}

      <View
        style={[
          styles.contentContainer,
          isMobile && styles.mobileContentContainer,
        ]}
      >
        {/* Categories Sidebar */}
        <View
          style={[
            styles.categoriesSidebar,
            isMobile && styles.mobileCategoriesSidebar,
          ]}
        >
          <View style={styles.categoriesHeader}>
            <Text style={styles.sidebarTitle}>Categories</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCategoryModal(true)}
            >
              <Feather name="plus" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoriesList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No categories yet</Text>
            }
          />
        </View>

        {/* Menu Items */}
        <View style={styles.menuItemsContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>
              {selectedCategory ? selectedCategory.name : "Select a category"}
            </Text>

            {selectedCategory && (
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={() => openItemModal()}
              >
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.addItemButtonText}>Add Item</Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedCategory ? (
            <FlatList
              data={selectedCategory.items}
              renderItem={({ item }) => (
                <View style={styles.menuItem}>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemName}>{item.name}</Text>
                    <Text style={styles.menuItemDescription}>
                      {item.description}
                    </Text>
                    <Text style={styles.menuItemPrice}>
                      ${item.price.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.menuItemActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openItemModal(item)}
                    >
                      <Feather name="edit-2" size={18} color="#4caf50" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteItem(item)}
                    >
                      <Feather name="trash-2" size={18} color="#ff6b6b" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.menuItemsList}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Feather name="menu" size={40} color="#ddd" />
                  <Text style={styles.emptyStateText}>
                    No items in this category
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Tap the "Add Item" button to add your first menu item
                  </Text>
                </View>
              }
            />
          ) : (
            <View style={styles.emptyState}>
              <Feather name="menu" size={40} color="#ddd" />
              <Text style={styles.emptyStateText}>
                Select a category or create one
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Add Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Category</Text>

            <Text style={styles.modalLabel}>Category Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="e.g. Appetizers, Main Courses, Drinks"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleAddCategory}
              >
                <Text style={styles.modalSaveButtonText}>Add Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal
        visible={showItemModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
            </Text>

            <Text style={styles.modalLabel}>Item Name</Text>
            <TextInput
              style={styles.modalInput}
              value={itemName}
              onChangeText={setItemName}
              placeholder="e.g. Caesar Salad"
            />

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              value={itemDescription}
              onChangeText={setItemDescription}
              placeholder="Describe the item..."
              multiline
              numberOfLines={3}
            />

            <Text style={styles.modalLabel}>Price ($)</Text>
            <TextInput
              style={styles.modalInput}
              value={itemPrice}
              onChangeText={setItemPrice}
              placeholder="9.99"
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowItemModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveItem}
              >
                <Text style={styles.modalSaveButtonText}>
                  {editingItem ? "Update Item" : "Add Item"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Define styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: Color.colorBurlywood,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
  },
  mobileContentContainer: {
    flexDirection: "column",
  },
  categoriesSidebar: {
    width: "40%",
    borderRightWidth: 1,
    borderRightColor: "#eee",
    backgroundColor: "#f9f9f9",
  },
  mobileCategoriesSidebar: {
    width: "100%",
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    maxHeight: 200,
  },
  categoriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: Color.colorBurlywood,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesList: {
    padding: 8,
  },
  categoryItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "column",
  },
  selectedCategoryItem: {
    borderColor: Color.colorBurlywood,
    backgroundColor: "#faf5eb",
  },
  categoryItemText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  selectedCategoryItemText: {
    color: Color.colorBurlywood,
    fontWeight: "bold",
  },
  itemCount: {
    fontSize: 12,
    color: "#888",
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },
  menuItemsContainer: {
    flex: 1,
    padding: 16,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addItemButton: {
    backgroundColor: Color.colorBurlywood,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addItemButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  menuItemsList: {
    paddingBottom: 20,
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
    marginTop: 12,
    marginBottom: 4,
    color: "#666",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: "#888",
  },
  menuItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
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
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: "500",
    color: Color.colorBurlywood,
  },
  menuItemActions: {
    justifyContent: "center",
    gap: 12,
  },
  actionButton: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelButtonText: {
    color: "#666",
  },
  modalSaveButton: {
    backgroundColor: Color.colorBurlywood,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  modalSaveButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});

export default MenuEditor;
