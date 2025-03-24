// src/controllers/authController.ts
// Contributor: @Fardeen Bablu
// time spent: 60 minutes

import { Request, Response } from 'express';
import { auth, db } from '../config/firebase';
import jwt from 'jsonwebtoken';
import { User } from '../types';

const usersCollection = db.collection('users');

// Helper to create a JWT token
const createToken = (user: { uid: string; email: string; role?: string }) => {
  return jwt.sign(
    { 
      uid: user.uid, 
      email: user.email,
      role: user.role || 'user'
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

export const authenticateWithGoogle = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify the Google ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists in Firestore
    const userDoc = await usersCollection.doc(uid).get();
    
    let userData: User;
    const isVanderbiltUser = email.endsWith('@vanderbilt.edu');
    const now = new Date();

    if (!userDoc.exists) {
      // Create new user
      userData = {
        id: uid,
        name: name || 'Vanderbilt Student',
        email,
        imageUrl: picture,
        isVanderbiltUser,
        role: 'user', // Default role
        createdAt: now,
        updatedAt: now,
        favorites: []
      };

      // Check for admin emails
      const adminEmails = ['admin@gmail.com', 'taco-mama@gmail.com', 'dormdash.vu@gmail.com'];
      if (adminEmails.includes(email)) {
        userData.role = 'admin';
      }

      // Check for restaurant owner emails
      const restaurantOwnerMap: Record<string, string> = {
        'taco-mama@gmail.com': 'taco-mama',
        'banh-mi-roll@gmail.com': 'banh-mi-roll'
      };

      if (email in restaurantOwnerMap) {
        userData.role = 'restaurant_owner';
      }

      // Create user in Firestore
      await usersCollection.doc(uid).set(userData);
    } else {
      // Get existing user data
      userData = userDoc.data() as User;
      
      // Update last login
      await usersCollection.doc(uid).update({
        updatedAt: now
      });
    }

    // Create JWT token
    const token = createToken({
      uid,
      email,
      role: userData.role
    });

    return res.status(200).json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const checkAuth = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userDoc = await usersCollection.doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data() as User;
    
    return res.status(200).json({
      authenticated: true,
      user: userData
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ error: 'Authentication check failed' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get fresh user data
    const userDoc = await usersCollection.doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data() as User;
    
    // Create new token
    const token = createToken({
      uid: req.user.uid,
      email: req.user.email,
      role: userData.role
    });

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ error: 'Token refresh failed' });
  }
};