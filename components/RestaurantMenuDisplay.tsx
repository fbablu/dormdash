// app/components/RestaurantMenuDisplay.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Color } from "@/GlobalStyles";
import {
  getRestaurantMenu,
  MenuCategory,
  MenuItem,
} from "@/app/utils/RestaurantMenuIntegration";
import { useCart } from "@/app/context/CartContext";

interface RestaurantMenuDisplayProps {
  restaurantId: string;
  restaurantName: string;
}

const RestaurantMenuDisplay: React.FC<RestaurantMenuDisplayProps> = ({
  restaurantId,
  restaurantName,
}) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const { cartItems, addItemsToCart } = useCart();

  useEffect(() => {
    loadMenu();
  }, [restaurantId]);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const menu = await getRestaurantMenu(restaurantId);
      if (menu && menu.length > 0) {
        setCategories(menu);
        setActiveCategory(menu[0].id);
      } else {
        console.log(`No menu found for restaurant ${restaurantId}`);
      }
    } catch (error) {
      console.error("Error loading menu:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    addItemsToCart([
      {
        name: item.name,
        quantity: 1,
        price: item.price,
      },
    ]);

    Alert.alert("Added to Cart", `${item.name} has been added to your cart.`, [
      { text: "OK" },
    ]);
  };

  const getItemQuantityInCart = (itemName: string): number => {
    const item = cartItems.find((item) => item.name === itemName);
    return item ? item.quantity : 0;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.colorBurlywood} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Feather name="menu" size={50} color="#ddd" />
        <Text style={styles.emptyStateText}>
          No menu available for {restaurantName}
        </Text>
        <Text style={styles.emptyStateSubtext}>
          The restaurant hasn't published their menu yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryTab,
                activeCategory === item.id && styles.activeCategoryTab,
              ]}
              onPress={() => setActiveCategory(item.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === item.id && styles.activeCategoryText,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Menu Items */}
      <FlatList
        data={categories.find((cat) => cat.id === activeCategory)?.items || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemDescription}>{item.description}</Text>
              <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.menuItemActions}>
              {getItemQuantityInCart(item.name) > 0 ? (
                <View style={styles.addedBadge}>
                  <Text style={styles.addedText}>
                    {getItemQuantityInCart(item.name)} in cart
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addToCart(item)}
              >
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.menuList}
        ListEmptyComponent={
          <View style={styles.emptyCategory}>
            <Text style={styles.emptyCategoryText}>
              No items in this category
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  activeCategoryTab: {
    backgroundColor: Color.colorBurlywood,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeCategoryText: {
    color: "#fff",
  },
  menuList: {
    padding: 16,
  },
  emptyCategory: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCategoryText: {
    fontSize: 16,
    color: "#666",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  menuItemContent: {
    flex: 1,
    marginRight: 12,
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
    alignItems: "flex-end",
  },
  addedBadge: {
    backgroundColor: "#e0f2f1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  addedText: {
    color: "#00897b",
    fontSize: 12,
    fontWeight: "500",
  },
  addButton: {
    backgroundColor: Color.colorBurlywood,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
});

export default RestaurantMenuDisplay;
