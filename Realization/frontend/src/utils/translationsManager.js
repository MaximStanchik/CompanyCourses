import fs from 'fs';
import path from 'path';

class TranslationsManager {
  constructor() {
    this.translationsPath = path.join(process.cwd(), 'src', 'i18n', 'translations.json');
  }

  readTranslations() {
    try {
      const data = fs.readFileSync(this.translationsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading translations file:', error);
      return null;
    }
  }

  writeTranslations(translations) {
    try {
      fs.writeFileSync(this.translationsPath, JSON.stringify(translations, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error writing translations file:', error);
      return false;
    }
  }

  addCategoryTranslation(categoryName, categoryId) {
    const translations = this.readTranslations();
    if (!translations) return false;

    const categoryKey = `category_${categoryId}`;
    
    Object.keys(translations).forEach(lang => {
      if (!translations[lang].common) {
        translations[lang].common = {};
      }
      translations[lang].common[categoryKey] = categoryName;
    });

    return this.writeTranslations(translations);
  }

  updateCategoryTranslation(categoryName, categoryId) {
    const translations = this.readTranslations();
    if (!translations) return false;

    const categoryKey = `category_${categoryId}`;
    
    Object.keys(translations).forEach(lang => {
      if (translations[lang].common) {
        translations[lang].common[categoryKey] = categoryName;
      }
    });

    return this.writeTranslations(translations);
  }

  removeCategoryTranslation(categoryId) {
    const translations = this.readTranslations();
    if (!translations) return false;

    const categoryKey = `category_${categoryId}`;
    
    Object.keys(translations).forEach(lang => {
      if (translations[lang].common && translations[lang].common[categoryKey]) {
        delete translations[lang].common[categoryKey];
      }
    });

    return this.writeTranslations(translations);
  }

  getCategoryTranslation(categoryId, language = 'en') {
    const translations = this.readTranslations();
    if (!translations || !translations[language] || !translations[language].common) {
      return null;
    }

    const categoryKey = `category_${categoryId}`;
    return translations[language].common[categoryKey];
  }
}

export default TranslationsManager; 