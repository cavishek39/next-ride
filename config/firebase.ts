// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app'
// Note: Firebase v12 removed the React Native persistence helper; using default getAuth for now.
import { getAuth } from 'firebase/auth'
// import { initializeAuth, getReactNativePersistence } from 'firebase/auth/react-native' // <-- if using v11
// import AsyncStorage from '@react-native-async-storage/async-storage'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration using environment variables
// Create a .env file based on .env.example and add your Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    'demo-project.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project-id',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    'demo-project.appspot.com',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
}

// Initialize Firebase App (check if already initialized to prevent duplicate-app error)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize Firebase Auth (default web-style persistence; Expo will fall back to memory on native)
const auth = getAuth(app)

// Initialize Firestore
const db = getFirestore(app)

export { auth, db }
export default app
