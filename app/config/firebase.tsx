// app/config/firebase.tsx
import { Auth } from "firebase/auth";
import { Firestore } from "firebase/firestore";
import { FirebaseStorage } from "firebase/storage";
import { mockAuth, mockDb } from "../utils/mockAuth";

export const auth = mockAuth as unknown as Auth;
export const db = mockDb as unknown as Firestore;
export const storage = {} as unknown as FirebaseStorage;

// Export default object as well
export default {
  app: {},
  auth: mockAuth as unknown as Auth,
  db: mockDb as unknown as Firestore,
  storage: {} as unknown as FirebaseStorage,
};
