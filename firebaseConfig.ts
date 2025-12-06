// firebaseConfig.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
import {
  doc,
  getDoc,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';

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

const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  // Firebase yapılandırması eksik ancak uygulama çalışmaya devam eder
}

// Tekil uygulama kurulumunu garanti et
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Auth: React Native için AsyncStorage persistence, web için normal getAuth
export const auth: Auth =
  Platform.OS === 'web'
    ? firebaseAuth.getAuth(app)
    : firebaseAuth.initializeAuth(app, {
      // getReactNativePersistence isn't typed in some firebase/auth versions for RN.
      // @ts-ignore - some SDK typings don't expose this helper, but it's available at runtime.
      persistence: (firebaseAuth as any).getReactNativePersistence(AsyncStorage),
    });

// Firestore: RN için long-polling ve memory cache ile başlatmayı dene; hata olursa fallback yap
let db: Firestore;
// RN ve Web için farklı Firestore başlatma stratejileri
if (Platform.OS === 'web') {
  // Web ortamında varsayılan getFirestore kullan
  db = getFirestore(app);
} else {
  try {
    // React Native'de long-polling ve memory cache ile başlat
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    });
  } catch (error: any) {
    db = getFirestore(app);
  }
}

export { db };
export const storage: FirebaseStorage = getStorage(app);

// Firebase bağlantı durumu kontrolü
export const checkFirebaseConnection = async () => {
  try {
    const testDoc = doc(db, '_test', 'connection');
    await getDoc(testDoc);
    return true;
  } catch (error: any) {
    return false;
  }
};

// Firestore hatalarını yakalama ve loglama
export const handleFirestoreError = (error: any, context = '') => {
  const userFriendlyMessages: Record<string, string> = {
    'permission-denied': 'Bu işlem için yetkiniz yok',
    unavailable: 'Sunucu şu anda kullanılamıyor, lütfen tekrar deneyin',
    unauthenticated: 'Oturum süreniz dolmuş, lütfen tekrar giriş yapın',
    'network-request-failed': 'İnternet bağlantınızı kontrol edin',
  };

  return userFriendlyMessages[error?.code] ?? 'Beklenmeyen bir hata oluştu';
};