// src/controllers/userController.ts
// Contributor: @Fardeen Bablu
// time spent: 60 minutes

import { Request, Response } from 'express';
import { db, auth } from '../config/firebase';
import { User } from '../types';

const usersCollection = db.collection('users');

export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.params.id || req.user.uid;
    
    // Check if the user is trying to access someone else's profile
    if (userId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Cannot access another user\'s profile' });
    }

    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data() as User;
    
    return res.status(200).json({ data: userData });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.params.id || req.user.uid;
    
    // Check if the user is trying to update someone else's profile
    if (userId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Cannot update another user\'s profile' });
    }

    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fields that can be updated
    const allowedUpdates = ['name', 'phoneNumber', 'imageUrl', 'dormLocation'];
    const updates: { [key: string]: any } = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Add updatedAt timestamp
    updates.updatedAt = new Date();

    await usersCollection.doc(userId).update(updates);
    
    return res.status(200).json({ 
      message: 'Profile updated successfully',
      data: { id: userId, ...updates }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
};

export const verifyDorm = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.params.id || req.user.uid;
    
    // Only allow users to verify their own dorm
    if (userId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Cannot verify another user\'s dorm' });
    }

    const { dormCode } = req.body;
    
    if (!dormCode) {
      return res.status(400).json({ error: 'Dorm code is required' });
    }
    
    // This is a simple validation - in a real app you'd verify against a database of valid codes
    const isValidCode = /^\d{6}$/.test(dormCode);
    
    if (!isValidCode) {
      return res.status(400).json({ error: 'Invalid dorm code' });
    }

    // Mark user as verified
    await usersCollection.doc(userId).update({
      isVerified: true,
      dormLocation: 'Verified Dorm', // This could be more specific in a real app
      updatedAt: new Date()
    });
    
    return res.status(200).json({ 
      message: 'Dorm verification successful',
      data: { isVerified: true }
    });
  } catch (error) {
    console.error('Error verifying dorm:', error);
    return res.status(500).json({ error: 'Failed to verify dorm' });
  }
};

export const getFavorites = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.params.id || req.user.uid;
    
    // Only allow users to access their own favorites
    if (userId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Cannot access another user\'s favorites' });
    }

    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data() as User;
    const favorites = userData.favorites || [];
    
    return res.status(200).json({ data: favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId, restaurantName, action } = req.body;
    
    // Only allow users to modify their own favorites
    if (userId !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Cannot modify another user\'s favorites' });
    }

    if (!restaurantName || !action) {
      return res.status(400).json({ error: 'Restaurant name and action are required' });
    }

    if (action !== 'add' && action !== 'remove') {
      return res.status(400).json({ error: 'Action must be either "add" or "remove"' });
    }

    const userRef = usersCollection.doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data() as User;
    let favorites = userData.favorites || [];

    if (action === 'add') {
      // Add the restaurant if not already favorited
      if (!favorites.includes(restaurantName)) {
        favorites.push(restaurantName);
      }
    } else {
      // Remove the restaurant from favorites
      favorites = favorites.filter(name => name !== restaurantName);
    }

    // Update user's favorites
    await userRef.update({
      favorites,
      updatedAt: new Date()
    });

    return res.status(200).json({
      message: `Restaurant ${action === 'add' ? 'added to' : 'removed from'} favorites`,
      data: { success: true }
    });
  } catch (error) {
    console.error('Error updating favorites:', error);
    return res.status(500).json({ error: 'Failed to update favorites' });
  }
};