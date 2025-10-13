// firebaseConfig.ts
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase config .env'den çekiliyor (Expo: EXPO_PUBLIC_*)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_MEASUREMENT_ID, // opsiyonel (web)
};

// Environment variables kontrolü
const requiredEnvVars = [
  'EXPO_PUBLIC_API_KEY',
  'EXPO_PUBLIC_AUTH_DOMAIN', 
  'EXPO_PUBLIC_PROJECT_ID',
  'EXPO_PUBLIC_STORAGE_BUCKET',
  'EXPO_PUBLIC_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_APP_ID'
];

const missingVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingVars.length > 0) {
  console.warn('⚠️ Firebase yapılandırması eksik:', missingVars.join(', '));
  console.warn('📝 .env dosyası oluşturun ve Firebase Console\'dan değerleri alın');
}

// Tekil uygulama kurulumunu garanti et
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Basit Firebase servisleri
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);