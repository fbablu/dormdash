// src/controllers/restaurantController.ts
// Contributor: @Fardeen Bablu
// time spent: 60 minutes

import { Request, Response } from "express";
import { db } from "../config/firebase";
import { Restaurant, MenuCategory, MenuItem } from "../types";

const restaurantsCollection = db.collection("restaurants");

export const getAllRestaurants = async (req: Request, res: Response) => {
  try {
    const restaurantsSnapshot = await restaurantsCollection.get();

    if (restaurantsSnapshot.empty) {
      return res.status(200).json({ data: [] });
    }

    const restaurants: Restaurant[] = [];

    restaurantsSnapshot.forEach((doc) => {
      restaurants.push({ id: doc.id, ...doc.data() } as Restaurant);
    });

    return res.status(200).json({ data: restaurants });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return res.status(500).json({ error: "Failed to fetch restaurants" });
  }
};

export const getRestaurantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Restaurant ID is required" });
    }

    const restaurantDoc = await restaurantsCollection.doc(id).get();

    if (!restaurantDoc.exists) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const restaurantData = {
      id: restaurantDoc.id,
      ...restaurantDoc.data(),
    } as Restaurant;

    return res.status(200).json({ data: restaurantData });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    return res.status(500).json({ error: "Failed to fetch restaurant" });
  }
};

export const getRestaurantMenu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Restaurant ID is required" });
    }

    // Check if restaurant exists
    const restaurantDoc = await restaurantsCollection.doc(id).get();

    if (!restaurantDoc.exists) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Get menu categories
    const categoriesSnapshot = await restaurantsCollection
      .doc(id)
      .collection("menu")
      .get();

    if (categoriesSnapshot.empty) {
      return res.status(200).json({ data: [] });
    }

    const menuCategories: MenuCategory[] = [];

    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryData = categoryDoc.data() as Omit<MenuCategory, "id">;

      // Get menu items for this category
      const itemsSnapshot = await restaurantsCollection
        .doc(id)
        .collection("menu")
        .doc(categoryDoc.id)
        .collection("items")
        .get();

      const items: MenuItem[] = [];

      itemsSnapshot.forEach((itemDoc) => {
        items.push({ id: itemDoc.id, ...itemDoc.data() } as MenuItem);
      });

      menuCategories.push({
        id: categoryDoc.id,
        name: categoryData.name,
        restaurantId: id,
        items: items.length > 0 ? items : undefined,
      });
    }

    return res.status(200).json({ data: menuCategories });
  } catch (error) {
    console.error("Error fetching restaurant menu:", error);
    return res.status(500).json({ error: "Failed to fetch restaurant menu" });
  }
};

export const addOrUpdateRestaurant = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin" && req.user.role !== "restaurant_owner") {
      return res.status(403).json({
        error: "Forbidden - Admin or restaurant owner access required",
      });
    }

    const { id } = req.params;
    const restaurantData = req.body;

    if (
      !restaurantData.name ||
      !restaurantData.location ||
      !restaurantData.address
    ) {
      return res
        .status(400)
        .json({ error: "Name, location, and address are required" });
    }

    const now = new Date();

    // Check if this is an update or a new restaurant
    if (id) {
      // Update existing restaurant
      const restaurantDoc = await restaurantsCollection.doc(id).get();

      if (!restaurantDoc.exists) {
        return res.status(404).json({ error: "Restaurant not found" });
      }

      // If user is restaurant owner, check if they own this restaurant
      if (req.user.role === "restaurant_owner") {
        const restaurantData = restaurantDoc.data() as Restaurant;

        if (restaurantData.ownerId !== req.user.uid) {
          return res
            .status(403)
            .json({ error: "Forbidden - You do not own this restaurant" });
        }
      }

      // Update restaurant
      await restaurantsCollection.doc(id).update({
        ...restaurantData,
        updatedAt: now,
      });

      return res.status(200).json({
        message: "Restaurant updated successfully",
        data: { id, ...restaurantData },
      });
    } else {
      // Create new restaurant
      const newRestaurant: Omit<Restaurant, "id"> = {
        ...restaurantData,
        createdAt: now,
        updatedAt: now,
        ownerId:
          req.user.role === "restaurant_owner" ? req.user.uid : undefined,
      };

      const restaurantRef = await restaurantsCollection.add(newRestaurant);

      return res.status(201).json({
        message: "Restaurant created successfully",
        data: { id: restaurantRef.id, ...newRestaurant },
      });
    }
  } catch (error) {
    console.error("Error saving restaurant:", error);
    return res.status(500).json({ error: "Failed to save restaurant" });
  }
};

export const addOrUpdateMenuItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin" && req.user.role !== "restaurant_owner") {
      return res.status(403).json({
        error: "Forbidden - Admin or restaurant owner access required",
      });
    }

    const { restaurantId, categoryId, itemId } = req.params;
    const itemData = req.body;

    if (!restaurantId || !categoryId) {
      return res
        .status(400)
        .json({ error: "Restaurant ID and category ID are required" });
    }

    if (!itemData.name || itemData.price === undefined) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    // Check if restaurant exists
    const restaurantDoc = await restaurantsCollection.doc(restaurantId).get();

    if (!restaurantDoc.exists) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // If user is restaurant owner, check if they own this restaurant
    if (req.user.role === "restaurant_owner") {
      const restaurantData = restaurantDoc.data() as Restaurant;

      if (restaurantData.ownerId !== req.user.uid) {
        return res
          .status(403)
          .json({ error: "Forbidden - You do not own this restaurant" });
      }
    }

    // Check if category exists
    const categoryDoc = await restaurantsCollection
      .doc(restaurantId)
      .collection("menu")
      .doc(categoryId)
      .get();

    if (!categoryDoc.exists) {
      return res.status(404).json({ error: "Menu category not found" });
    }

    // Set item data
    const menuItem: Omit<MenuItem, "id"> = {
      name: itemData.name,
      description: itemData.description || "",
      price: itemData.price,
      imageUrl: itemData.imageUrl,
      categoryId,
      available: itemData.available !== undefined ? itemData.available : true,
      popular: itemData.popular,
    };

    let itemRef;

    // Check if this is an update or a new item
    if (itemId) {
      // Update existing item
      itemRef = restaurantsCollection
        .doc(restaurantId)
        .collection("menu")
        .doc(categoryId)
        .collection("items")
        .doc(itemId);

      await itemRef.update(menuItem);

      return res.status(200).json({
        message: "Menu item updated successfully",
        data: { id: itemId, ...menuItem },
      });
    } else {
      // Create new item
      itemRef = await restaurantsCollection
        .doc(restaurantId)
        .collection("menu")
        .doc(categoryId)
        .collection("items")
        .add(menuItem);

      return res.status(201).json({
        message: "Menu item created successfully",
        data: { id: itemRef.id, ...menuItem },
      });
    }
  } catch (error) {
    console.error("Error saving menu item:", error);
    return res.status(500).json({ error: "Failed to save menu item" });
  }
};

export const addOrUpdateMenuCategory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin" && req.user.role !== "restaurant_owner") {
      return res.status(403).json({
        error: "Forbidden - Admin or restaurant owner access required",
      });
    }

    const { restaurantId, categoryId } = req.params;
    const { name } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID is required" });
    }

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // Check if restaurant exists
    const restaurantDoc = await restaurantsCollection.doc(restaurantId).get();

    if (!restaurantDoc.exists) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // If user is restaurant owner, check if they own this restaurant
    if (req.user.role === "restaurant_owner") {
      const restaurantData = restaurantDoc.data() as Restaurant;

      if (restaurantData.ownerId !== req.user.uid) {
        return res
          .status(403)
          .json({ error: "Forbidden - You do not own this restaurant" });
      }
    }

    // Set category data
    const categoryData: Omit<MenuCategory, "id"> = {
      name,
      restaurantId,
    };

    let categoryRef;

    // Check if this is an update or a new category
    if (categoryId) {
      // Update existing category
      categoryRef = restaurantsCollection
        .doc(restaurantId)
        .collection("menu")
        .doc(categoryId);

      await categoryRef.update(categoryData);

      return res.status(200).json({
        message: "Menu category updated successfully",
        data: { id: categoryId, ...categoryData },
      });
    } else {
      // Create new category
      categoryRef = await restaurantsCollection
        .doc(restaurantId)
        .collection("menu")
        .add(categoryData);

      return res.status(201).json({
        message: "Menu category created successfully",
        data: { id: categoryRef.id, ...categoryData },
      });
    }
  } catch (error) {
    console.error("Error saving menu category:", error);
    return res.status(500).json({ error: "Failed to save menu category" });
  }
};
