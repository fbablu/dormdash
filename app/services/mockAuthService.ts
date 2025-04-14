// app/services/mockAuthService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const USER_KEY = "auth_user";
const TOKEN_KEY = "auth_token";
const USERS_STORE = "auth_users";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
}

// Helper functions
const generateToken = () =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);
const generateUserId = () => "user_" + Math.random().toString(36).substring(2);

export const mockAuthService = {
  signIn: async (email: string, password: string): Promise<MockUser> => {
    const usersJson = await AsyncStorage.getItem(USERS_STORE);
    const users = usersJson ? JSON.parse(usersJson) : {};

    const userId = Object.keys(users).find((id) => users[id].email === email);
    if (!userId || users[userId].password !== password) {
      throw new Error("Invalid email or password");
    }

    const user = {
      id: userId,
      email: users[userId].email,
      name: users[userId].name,
      photoURL: users[userId].photoURL,
    };

    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    const token = generateToken();
    await AsyncStorage.setItem(TOKEN_KEY, token);

    return user;
  },

  signUp: async (
    email: string,
    password: string,
    name: string,
  ): Promise<MockUser> => {
    const usersJson = await AsyncStorage.getItem(USERS_STORE);
    const users = usersJson ? JSON.parse(usersJson) : {};

    if (Object.values(users).some((u: any) => u.email === email)) {
      throw new Error("Email already in use");
    }

    const userId = generateUserId();
    users[userId] = { email, name, password };
    await AsyncStorage.setItem(USERS_STORE, JSON.stringify(users));

    const user = { id: userId, email, name };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

    const token = generateToken();
    await AsyncStorage.setItem(TOKEN_KEY, token);

    return user;
  },

  signOut: async () => {
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  getCurrentUser: async (): Promise<MockUser | null> => {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  getToken: async (): Promise<string | null> => {
    return AsyncStorage.getItem(TOKEN_KEY);
  },

  resetPassword: async (email: string): Promise<void> => {
    console.log(`Password reset request for ${email}`);
    // In a real app, send email. For mock, we'll reset to "password123"
    const usersJson = await AsyncStorage.getItem(USERS_STORE);
    const users = usersJson ? JSON.parse(usersJson) : {};

    const userId = Object.keys(users).find((id) => users[id].email === email);
    if (!userId) throw new Error("User not found");

    users[userId].password = "password123";
    await AsyncStorage.setItem(USERS_STORE, JSON.stringify(users));
  },
};
