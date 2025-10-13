// firebaseConfig.js
// @ts-nocheck
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { doc, getDoc, getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
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

const missingVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingVars.length > 0) {
  console.warn('⚠️ Firebase yapılandırması eksik:', missingVars.join(', '));
  console.warn('📝 .env dosyası oluşturun ve Firebase Console\'dan değerleri alın');
}

// Tekil uygulama kurulumunu garanti et
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// React Native'de kalıcı oturum için AsyncStorage kullan
export const auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

// Firestore'u RN için long-polling + memory cache ile kur (WebChannel hatalarını azaltır)
let db;
try {
  // React Native için optimize edilmiş Firestore yapılandırması
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
    experimentalForceLongPolling: true,
    useFetchStreams: false,
    // WebChannel hatalarını azaltmak için ek ayarlar
    ignoreUndefinedProperties: true,
  });
  console.log('✅ Firestore başarıyla yapılandırıldı (long-polling mode)');
} catch (error) {
  console.warn('⚠️ Firestore yapılandırma hatası, varsayılan ayarlarla devam ediliyor:', error.message);
  db = getFirestore(app);
}

export { db };
export const storage = getStorage(app);

// Firebase bağlantı durumu kontrolü
export const checkFirebaseConnection = async () => {
  try {
    // Basit bir Firestore işlemi ile bağlantıyı test et
    const testDoc = doc(db, '_test', 'connection');
    await getDoc(testDoc);
    console.log('✅ Firebase bağlantısı başarılı');
    return true;
  } catch (error) {
    console.error('❌ Firebase bağlantı hatası:', error.message);
    return false;
  }
};

// Firestore hatalarını yakalama ve loglama
export const handleFirestoreError = (error, context = '') => {
  console.error(`❌ Firestore hatası ${context}:`, {
    code: error.code,
    message: error.message,
    stack: error.stack
  });
  
  // Kullanıcıya gösterilecek hata mesajları
  const userFriendlyMessages = {
    'permission-denied': 'Bu işlem için yetkiniz yok',
    'unavailable': 'Sunucu şu anda kullanılamıyor, lütfen tekrar deneyin',
    'unauthenticated': 'Oturum süreniz dolmuş, lütfen tekrar giriş yapın',
    'network-request-failed': 'İnternet bağlantınızı kontrol edin'
  };
  
  return userFriendlyMessages[error.code] || 'Beklenmeyen bir hata oluştu';
};
