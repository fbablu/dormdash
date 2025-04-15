// app/utils/firebaseAdapter.ts
import { db } from "../config/firebase";

// Define a type for menu categories
type MenuCategory = {
  name?: string;
  items?: any[];
};

// Helper functions for menu operations
export async function getMenuCategories(restaurantId: string) {
  try {
    const menuPath = `restaurants/${restaurantId}/menu`;
    const menuRef = db.collection(menuPath);
    const menuSnapshot = await menuRef.get();

    if (menuSnapshot.empty) {
      return [];
    }

    const categories: any[] = [];
    menuSnapshot.forEach((doc) => {
      const data = doc.data() as MenuCategory;
      categories.push({
        id: doc.id,
        name: data.name || doc.id,
        items: Array.isArray(data.items) ? data.items : [],
      });
    });

    return categories;
  } catch (error) {
    console.error(`Error fetching menu for ${restaurantId}:`, error);
    return [];
  }
}

export async function getCategoryItems(
  restaurantId: string,
  categoryId: string,
) {
  try {
    const docPath = `restaurants/${restaurantId}/menu/${categoryId}`;
    const docRef = db.doc(docPath);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return null;
    }

    return docSnapshot.data();
  } catch (error) {
    console.error(`Error fetching category ${categoryId}:`, error);
    return null;
  }
}

export async function saveCategory(
  restaurantId: string,
  categoryId: string,
  data: any,
) {
  try {
    const docPath = `restaurants/${restaurantId}/menu/${categoryId}`;
    const docRef = db.doc(docPath);
    await docRef.set(data);
    return true;
  } catch (error) {
    console.error(`Error saving category ${categoryId}:`, error);
    return false;
  }
}

export async function deleteCategory(restaurantId: string, categoryId: string) {
  try {
    const docPath = `restaurants/${restaurantId}/menu/${categoryId}`;
    const docRef = db.doc(docPath);
    await docRef.delete();
    return true;
  } catch (error) {
    console.error(`Error deleting category ${categoryId}:`, error);
    return false;
  }
}
