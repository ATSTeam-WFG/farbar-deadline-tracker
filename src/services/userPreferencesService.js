/**
 * User Preferences Service
 * Handles saving and loading user notification preferences in Firestore
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

const PREFERENCES_COLLECTION = 'userPreferences';

/**
 * Get user notification preferences
 */
export async function getUserPreferences(userId) {
  try {
    console.log('Fetching preferences for user:', userId);

    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log('User preferences found:', docSnap.data());
      return docSnap.data();
    } else {
      console.log('No preferences found, returning defaults');
      // Return default preferences
      return {
        emailNotifications: false,
        notifyDaysBefore: 3,
        notificationTime: '09:00',
        deadlineTypes: {
          critical: true,
          urgent: true,
          warning: true,
          info: false
        }
      };
    }
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
}

/**
 * Update or create user notification preferences
 */
export async function updateUserPreferences(userId, preferences) {
  try {
    console.log('Updating preferences for user:', userId);
    console.log('New preferences:', preferences);

    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Update existing preferences
      await updateDoc(docRef, {
        ...preferences,
        updatedAt: serverTimestamp()
      });
      console.log('Preferences updated successfully');
    } else {
      // Create new preferences document
      await setDoc(docRef, {
        ...preferences,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Preferences created successfully');
    }

    return true;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
}

/**
 * Check if user has email notifications enabled
 */
export async function hasEmailNotificationsEnabled(userId) {
  try {
    const preferences = await getUserPreferences(userId);
    return preferences?.emailNotifications || false;
  } catch (error) {
    console.error('Error checking email notifications:', error);
    return false;
  }
}
