/**
 * Firestore Session Management Service
 * Handles saving, loading, and managing calculation sessions
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

const SESSIONS_COLLECTION = 'calculationSessions';

/**
 * Save a new calculation session
 */
export async function saveSession(userId, sessionData) {
  try {
    console.log('Saving session for user:', userId);
    console.log('Session data:', {
      propertyAddress: sessionData.contractData.propertyAddress,
      hasContractData: !!sessionData.contractData,
      hasResult: !!sessionData.result
    });

    const sessionRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
      userId,
      contractData: sessionData.contractData,
      result: sessionData.result,
      propertyAddress: sessionData.contractData.propertyAddress || 'Untitled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('Session saved successfully with ID:', sessionRef.id);
    return sessionRef.id;
  } catch (error) {
    console.error('Error saving session:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId) {
  try {
    console.log('Fetching sessions for user:', userId);

    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      console.log('Found session:', doc.id, doc.data());
      sessions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log('Total sessions found:', sessions.length);

    // Sort by createdAt in JavaScript instead of Firestore to avoid composite index requirement
    sessions.sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime; // descending order
    });

    return sessions;
  } catch (error) {
    console.error('Error fetching sessions:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
}

/**
 * Get a specific session by ID
 */
export async function getSession(sessionId) {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('Session not found');
    }
  } catch (error) {
    console.error('Error fetching session:', error);
    throw error;
  }
}

/**
 * Update a session
 */
export async function updateSession(sessionId, updates) {
  try {
    const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId) {
  try {
    await deleteDoc(doc(db, SESSIONS_COLLECTION, sessionId));
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}
