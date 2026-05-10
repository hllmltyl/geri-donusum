import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tr from './translations/tr.json';
import en from './translations/en.json';

const LANGUAGE_KEY = '@app_language';

const languageDetectorPlugin = {
  type: 'languageDetector' as const,
  async: true,
  init: () => {},
  detect: async function (callback: (lang: string) => void) {
    try {
      const language = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (language) {
        callback(language);
        return;
      }
      callback('tr'); // Varsayılan dil
    } catch (error) {
      console.log('Error reading language', error);
      callback('tr');
    }
  },
  cacheUserLanguage: async function (language: string) {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

i18n
  .use(languageDetectorPlugin)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'tr',
    compatibilityJSON: 'v3', // React Native için gerekli
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
