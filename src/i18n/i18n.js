// ─────────────────────────────────────────────────────────
// i18n.js — Language Configuration
// Supports English and Hindi. Remembers user's choice.
// ─────────────────────────────────────────────────────────
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

// Get saved language from localStorage, default to Hindi
const savedLanguage = localStorage.getItem('thekedaar_lang') || 'hi';

i18n
  .use(initReactI18next)
  .init({
    resources: translations,
    lng: savedLanguage,
    fallbackLng: 'en',  // if Hindi translation missing, use English
    interpolation: {
      escapeValue: false, // React handles XSS protection
    },
  });

export default i18n;
