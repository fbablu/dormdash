// app/utils/mockAuth.ts
import {
  auth as firebaseAuth,
  db as firebaseDb,
} from "../config/firebase.config";

export const mockAuth = firebaseAuth;
export const mockDb = firebaseDb;
