import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translations from './i18n/translations.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: translations.en },
      ru: { translation: translations.ru },
      be: { translation: translations.be },
      de: { translation: translations.de },
      es: { translation: translations.es },
      pt: { translation: translations.pt },
      uk: { translation: translations.uk },
      zh: { translation: translations.zh }
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Ensure language is properly set on initialization
const savedLanguage = localStorage.getItem('language') || 'en';
console.log('i18n initialization: savedLanguage:', savedLanguage, 'i18n.language:', i18n.language);

// Force language change on initialization
console.log('i18n: Setting initial language to', savedLanguage);
i18n.changeLanguage(savedLanguage);

// Verify translations are loaded
console.log('i18n: Available languages:', Object.keys(i18n.store.data));
console.log('i18n: Current language data:', i18n.store.data[savedLanguage]?.translation?.comments);

// Listen for language changes in localStorage
window.addEventListener('storage', (e) => {
  if (e.key === 'language') {
    const newLanguage = e.newValue || 'en';
    console.log('i18n: localStorage changed to', newLanguage);
    if (i18n.language !== newLanguage) {
      i18n.changeLanguage(newLanguage);
      // Dispatch custom event to force component updates
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLanguage }));
    }
  }
});

// Listen for i18n language changes
i18n.on('languageChanged', (lng) => {
  console.log('i18n: Language changed to', lng);
  // Dispatch custom event to force component updates
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: lng }));
});

export default i18n; 