/**
 * Firebase Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project (or use existing)
 * 3. Enable Authentication > Sign-in method > Google
 * 4. Enable Firestore Database
 * 5. Go to Project Settings > General > Your apps
 * 6. Click "Add app" > Web
 * 7. Copy the config values below
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEmcTDDU-FaseONgl1OfzkH0Uwh52sCL8",
  authDomain: "farbar-deadline-tracker.firebaseapp.com",
  projectId: "farbar-deadline-tracker",
  storageBucket: "farbar-deadline-tracker.firebasestorage.app",
  messagingSenderId: "952690864905",
  appId: "1:952690864905:web:bf8675a69f15076c87d9d8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;
