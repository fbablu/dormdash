// app/services/mockDbService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const DB_PREFIX = "db_";

// Define a Document type with index signature
interface Document {
  id: string;
  [key: string]: any; // This allows string indexing
}

export const mockDbService = {
  getDoc: async <T>(collection: string, id: string): Promise<T | null> => {
    try {
      const collectionKey = `${DB_PREFIX}${collection}`;
      const collectionJson = await AsyncStorage.getItem(collectionKey);
      const collectionData = collectionJson ? JSON.parse(collectionJson) : {};
      return (collectionData[id] as T) || null;
    } catch (error) {
      console.error(`Error getting doc ${collection}/${id}:`, error);
      return null;
    }
  },

  setDoc: async <T>(collection: string, id: string, data: T): Promise<void> => {
    try {
      const collectionKey = `${DB_PREFIX}${collection}`;
      const collectionJson = await AsyncStorage.getItem(collectionKey);
      const collectionData = collectionJson ? JSON.parse(collectionJson) : {};

      collectionData[id] = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(collectionKey, JSON.stringify(collectionData));
    } catch (error) {
      console.error(`Error setting doc ${collection}/${id}:`, error);
      throw error;
    }
  },

  addDoc: async <T>(collection: string, data: T): Promise<string> => {
    const id = `doc_${Math.random().toString(36).substring(2)}`;
    await mockDbService.setDoc(collection, id, data);
    return id;
  },

  deleteDoc: async (collection: string, id: string): Promise<void> => {
    const collectionKey = `${DB_PREFIX}${collection}`;
    const collectionJson = await AsyncStorage.getItem(collectionKey);
    const collectionData = collectionJson ? JSON.parse(collectionJson) : {};

    if (collectionData[id]) {
      delete collectionData[id];
      await AsyncStorage.setItem(collectionKey, JSON.stringify(collectionData));
    }
  },

  query: async <T>(
    collection: string,
    conditions: Array<{ field: string; operator: string; value: any }>,
  ): Promise<T[]> => {
    const collectionKey = `${DB_PREFIX}${collection}`;
    const collectionJson = await AsyncStorage.getItem(collectionKey);
    const collectionData = collectionJson ? JSON.parse(collectionJson) : {};

    // Convert object to array with IDs
    const docs: Document[] = Object.entries(collectionData).map(
      ([id, data]) => ({
        id,
        ...(data as object),
      }),
    );

    // Filter based on conditions
    return docs.filter((doc) =>
      conditions.every(({ field, operator, value }) => {
        const fieldValue = doc[field]; // This is now valid with index signature

        switch (operator) {
          case "==":
            return fieldValue === value;
          case "!=":
            return fieldValue !== value;
          case ">":
            return fieldValue > value;
          case ">=":
            return fieldValue >= value;
          case "<":
            return fieldValue < value;
          case "<=":
            return fieldValue <= value;
          case "in":
            return Array.isArray(value) && value.includes(fieldValue);
          default:
            return false;
        }
      }),
    ) as T[];
  },
};
