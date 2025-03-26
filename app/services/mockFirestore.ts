import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface for mock collection queries
interface QueryOptions {
  where?: [string, string, any];
  orderBy?: [string, 'asc' | 'desc'];
  limit?: number;
}

// Generic mock firestore service
const firestoreService = {
  // Get a collection
  collection: (collectionName: string) => {
    return {
      // Get a document reference
      doc: (docId: string) => {
        return {
          // Get document data
          get: async () => {
            try {
              // Get all items in collection
              const items = await firestoreService.getCollection(collectionName);
              
              // Find the specific document
              const document = items.find((item: any) => item.id === docId);
              
              if (!document) {
                return {
                  exists: false,
                  data: () => null,
                  id: docId
                };
              }
              
              return {
                exists: true,
                data: () => document,
                id: docId
              };
            } catch (error) {
              console.error(`Error getting document ${collectionName}/${docId}:`, error);
              return {
                exists: false,
                data: () => null,
                id: docId
              };
            }
          },
          
          // Set document data
          set: async (data: any, options?: any) => {
            try {
              // Get current collection
              const items = await firestoreService.getCollection(collectionName);
              
              // Check if document exists
              const existingIndex = items.findIndex((item: any) => item.id === docId);
              
              if (existingIndex >= 0) {
                // Update existing document
                if (options?.merge) {
                  items[existingIndex] = { ...items[existingIndex], ...data };
                } else {
                  items[existingIndex] = { id: docId, ...data };
                }
              } else {
                // Add new document
                items.push({ id: docId, ...data });
              }
              
              // Save updated collection
              await AsyncStorage.setItem(collectionName, JSON.stringify(items));
              return true;
            } catch (error) {
              console.error(`Error setting document ${collectionName}/${docId}:`, error);
              return false;
            }
          },
          
          // Update document data
          update: async (data: any) => {
            try {
              // Get current collection
              const items = await firestoreService.getCollection(collectionName);
              
              // Find the document
              const existingIndex = items.findIndex((item: any) => item.id === docId);
              
              if (existingIndex >= 0) {
                // Update existing document
                items[existingIndex] = { ...items[existingIndex], ...data };
                
                // Save updated collection
                await AsyncStorage.setItem(collectionName, JSON.stringify(items));
                return true;
              }
              
              return false;
            } catch (error) {
              console.error(`Error updating document ${collectionName}/${docId}:`, error);
              return false;
            }
          }
        };
      },
      
      // Add a document with auto-generated ID
      add: async (data: any) => {
        try {
          // Generate an ID
          const docId = `auto-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          // Get current collection
          const items = await firestoreService.getCollection(collectionName);
          
          // Add new document
          items.push({ id: docId, ...data });
          
          // Save updated collection
          await AsyncStorage.setItem(collectionName, JSON.stringify(items));
          
          return { id: docId };
        } catch (error) {
          console.error(`Error adding document to ${collectionName}:`, error);
          return { id: `error-${Date.now()}` };
        }
      },
      
      // Query collection
      where: (field: string, operator: string, value: any) => {
        return {
          // Add orderBy to query
          orderBy: (orderField: string, direction: 'asc' | 'desc' = 'asc') => {
            return {
              // Execute query
              get: async () => {
                try {
                  // Get all items in collection
                  const items = await firestoreService.getCollection(collectionName);
                  
                  // Filter by where clause
                  let results = items.filter((item: any) => {
                    if (operator === '==') return item[field] === value;
                    if (operator === '!=') return item[field] !== value;
                    if (operator === '>') return item[field] > value;
                    if (operator === '>=') return item[field] >= value;
                    if (operator === '<') return item[field] < value;
                    if (operator === '<=') return item[field] <= value;
                    if (operator === 'array-contains') return Array.isArray(item[field]) && item[field].includes(value);
                    return false;
                  });
                  
                  // Sort by orderBy clause
                  results.sort((a: any, b: any) => {
                    if (direction === 'asc') {
                      return a[orderField] > b[orderField] ? 1 : -1;
                    } else {
                      return a[orderField] < b[orderField] ? 1 : -1;
                    }
                  });
                  
                  return {
                    empty: results.length === 0,
                    docs: results.map((doc: any) => ({
                      id: doc.id,
                      data: () => doc,
                      exists: true
                    })),
                    forEach: (callback: Function) => {
                      results.forEach(doc => {
                        callback({
                          id: doc.id,
                          data: () => doc,
                          exists: true
                        });
                      });
                    }
                  };
                } catch (error) {
                  console.error(`Error executing query on ${collectionName}:`, error);
                  return {
                    empty: true,
                    docs: [],
                    forEach: () => {}
                  };
                }
              }
            };
          },
          
          // Execute query without ordering
          get: async () => {
            try {
              // Get all items in collection
              const items = await firestoreService.getCollection(collectionName);
              
              // Filter by where clause
              let results = items.filter((item: any) => {
                if (operator === '==') return item[field] === value;
                if (operator === '!=') return item[field] !== value;
                if (operator === '>') return item[field] > value;
                if (operator === '>=') return item[field] >= value;
                if (operator === '<') return item[field] < value;
                if (operator === '<=') return item[field] <= value;
                if (operator === 'array-contains') return Array.isArray(item[field]) && item[field].includes(value);
                return false;
              });
              
              return {
                empty: results.length === 0,
                docs: results.map((doc: any) => ({
                  id: doc.id,
                  data: () => doc,
                  exists: true
                })),
                forEach: (callback: Function) => {
                  results.forEach(doc => {
                    callback({
                      id: doc.id,
                      data: () => doc,
                      exists: true
                    });
                  });
                }
              };
            } catch (error) {
              console.error(`Error executing query on ${collectionName}:`, error);
              return {
                empty: true,
                docs: [],
                forEach: () => {}
              };
            }
          }
        };
      },
      
      // Get all documents in a collection
      get: async () => {
        try {
          const items = await firestoreService.getCollection(collectionName);
          return {
            empty: items.length === 0,
            docs: items.map((doc: any) => ({
              id: doc.id,
              data: () => doc,
              exists: true
            })),
            forEach: (callback: Function) => {
              items.forEach(doc => {
                callback({
                  id: doc.id,
                  data: () => doc,
                  exists: true
                });
              });
            }
          };
        } catch (error) {
          console.error(`Error getting collection ${collectionName}:`, error);
          return {
            empty: true,
            docs: [],
            forEach: () => {}
          };
        }
      }
    };
  },
  
  // Helper function to get a collection from AsyncStorage
  getCollection: async (collectionName: string): Promise<any[]> => {
    try {
      const data = await AsyncStorage.getItem(collectionName);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting collection ${collectionName}:`, error);
      return [];
    }
  },
  
  // Initialize the database with sample data
  initializeDatabase: async () => {
    // Check if already initialized
    const initialized = await AsyncStorage.getItem('db_initialized');
    if (initialized === 'true') return;
    
    // Add sample data for common collections
    const collections = {
      'users': [
        {
          id: 'mock-user-1',
          name: 'Test User',
          email: 'test@vanderbilt.edu',
          isVerified: true,
          createdAt: new Date().toISOString(),
          favorites: ['taco-mama', 'bahn-mi']
        }
      ],
      'orders': [],
      'deliveries': []
    };
    
    // Store sample data
    for (const [collection, data] of Object.entries(collections)) {
      await AsyncStorage.setItem(collection, JSON.stringify(data));
    }
    
    // Mark as initialized
    await AsyncStorage.setItem('db_initialized', 'true');
    console.log('Mock database initialized');
  }
};

// Initialize database when module is loaded
firestoreService.initializeDatabase();

export default firestoreService;