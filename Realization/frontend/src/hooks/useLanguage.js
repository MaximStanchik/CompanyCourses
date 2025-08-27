import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    console.log('useLanguage: Initial check - savedLanguage:', savedLanguage, 'i18n.language:', i18n.language);
    
    // Always force language change to ensure consistency
    console.log('useLanguage: Setting language to', savedLanguage);
    i18n.changeLanguage(savedLanguage);
    setCurrentLanguage(savedLanguage);
    
    // Verify translations are available
    console.log('useLanguage: Available translations for', savedLanguage, ':', i18n.store.data[savedLanguage]?.translation?.comments);

    // Listen for language changes
    const handleLanguageChange = (lng) => {
      console.log('useLanguage: Language changed to', lng);
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    // Listen for localStorage changes
    const handleStorageChange = (e) => {
      if (e.key === 'language') {
        const newLanguage = e.newValue || 'en';
        console.log('useLanguage: localStorage changed to', newLanguage);
        if (i18n.language !== newLanguage) {
          i18n.changeLanguage(newLanguage);
          setCurrentLanguage(newLanguage);
        }
      }
    };

    // Listen for custom language change events
    const handleCustomLanguageChange = (e) => {
      console.log('useLanguage: Custom language change event:', e.detail);
      setCurrentLanguage(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('languageChanged', handleCustomLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('languageChanged', handleCustomLanguageChange);
    };
  }, [i18n]);

  return { t, i18n, currentLanguage };
}; 