const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const DbClient = new PrismaClient();

// Утилита для работы с переводами
class TranslationsManager {
  constructor() {
    this.translationsPath = path.join(__dirname, '..', '..', '..', 'frontend', 'src', 'i18n', 'translations.json');
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

  addCategoryTranslation(categoryName, categoryId, nameEn = null, nameRu = null) {
    const translations = this.readTranslations();
    if (!translations) return false;

    const categoryKey = `category_${categoryId}`;
    
    // Добавляем переводы для всех языков
    Object.keys(translations).forEach(lang => {
      if (!translations[lang].common) {
        translations[lang].common = {};
      }
      
      // Используем соответствующий перевод для каждого языка
      let translation = nameEn || categoryName; // по умолчанию английское
      if (lang === 'ru' && nameRu) {
        translation = nameRu;
      } else if (lang === 'en' && nameEn) {
        translation = nameEn;
      } else if (lang === 'be') {
        // Белорусский - можно использовать русский как основу
        translation = nameRu || nameEn || categoryName;
      } else if (lang === 'uk') {
        // Украинский - можно использовать русский как основу
        translation = nameRu || nameEn || categoryName;
      } else if (lang === 'de') {
        // Немецкий - используем английский как основу
        translation = nameEn || categoryName;
      } else if (lang === 'es') {
        // Испанский - используем английский как основу
        translation = nameEn || categoryName;
      } else if (lang === 'pt') {
        // Португальский - используем английский как основу
        translation = nameEn || categoryName;
      } else if (lang === 'zh') {
        // Упрощенный китайский - используем английский как основу
        translation = nameEn || categoryName;
      }
      
      translations[lang].common[categoryKey] = translation;
    });

    return this.writeTranslations(translations);
  }

  updateCategoryTranslation(categoryName, categoryId, nameEn = null, nameRu = null) {
    const translations = this.readTranslations();
    if (!translations) return false;

    const categoryKey = `category_${categoryId}`;
    
    Object.keys(translations).forEach(lang => {
      if (translations[lang].common) {
        // Используем соответствующий перевод для каждого языка
        let translation = nameEn || categoryName; // по умолчанию английское
        if (lang === 'ru' && nameRu) {
          translation = nameRu;
        } else if (lang === 'en' && nameEn) {
          translation = nameEn;
        } else if (lang === 'be') {
          // Белорусский - можно использовать русский как основу
          translation = nameRu || nameEn || categoryName;
        } else if (lang === 'uk') {
          // Украинский - можно использовать русский как основу
          translation = nameRu || nameEn || categoryName;
        } else if (lang === 'de') {
          // Немецкий - используем английский как основу
          translation = nameEn || categoryName;
        } else if (lang === 'es') {
          // Испанский - используем английский как основу
          translation = nameEn || categoryName;
        } else if (lang === 'pt') {
          // Португальский - используем английский как основу
          translation = nameEn || categoryName;
        } else if (lang === 'zh') {
          // Упрощенный китайский - используем английский как основу
          translation = nameEn || categoryName;
        }
        
        translations[lang].common[categoryKey] = translation;
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
}

const translationsManager = new TranslationsManager();

class categoryController {
  async addCategory(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (authorizationHeader) {
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length === 2) {
          const token = tokenArray[1];
          let decodedToken;
          try {
            decodedToken = jwt.verify(token, process.env.SECRET);
          } 
          catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }
          const roles = decodedToken.roles;
          if (!roles.includes("ADMIN")) {
            return res.status(403).json("You don't have enough rights");
          }
          const { name, nameEn, nameRu, parentId } = req.body;
          
          // Check if the category already exists
          const existingCategory = await DbClient.category.findUnique({
            where: {
              name,
            },
          });
          if (existingCategory) {
            // Return an error response if the category already exists
            return res.status(409).send("Category already exists");
          }

          // If parentId is provided, check if parent category exists
          if (parentId) {
            const parentCategory = await DbClient.category.findUnique({
              where: {
                id: parseInt(parentId),
              },
            });
            if (!parentCategory) {
              return res.status(404).json({ message: "Parent category not found" });
            }
          }

          const category = await DbClient.category.create({
            data: {
              name: nameEn || name, // основное название = английское
              nameEn: nameEn || name,
              nameRu: nameRu || "",
              parentId: parentId ? parseInt(parentId) : null,
            },
          });
          
          // Автоматически добавляем перевод в translations.json
          translationsManager.addCategoryTranslation(name, category.id, nameEn, nameRu);
          
          return res.json(category);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Category creation error" });
    }
  }

  async getAllCategories(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (authorizationHeader) {
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length === 2) {
          const token = tokenArray[1];
          let decodedToken;
          try {
            decodedToken = jwt.verify(token, process.env.SECRET);
          } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }
          const roles = decodedToken.roles;
          if (!roles.includes("ADMIN")) {
            return res.status(403).json("You don't have enough rights");
          }
          // Получаем все категории плоским списком
          const categories = await DbClient.category.findMany({
            orderBy: [
              { parentId: 'asc' },
              { name: 'asc' }
            ]
          });

          // Строим дерево
          function buildTree(items, parentId = null) {
            const normalizedParentId = parentId !== null && parentId !== undefined ? Number(parentId) : null;
            return items
              .filter(item => (item.parentId !== null && item.parentId !== undefined ? Number(item.parentId) : null) === normalizedParentId)
              .map(item => ({
                ...item,
                children: buildTree(items, item.id)
              }));
          }

          const tree = buildTree(categories);
          return res.json(tree);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Categories error" });
    }
  }

  async getCategoryById(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (authorizationHeader) {
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length === 2) {
          const token = tokenArray[1];
          let decodedToken;
          try {
            decodedToken = jwt.verify(token, process.env.SECRET);
          } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }
          const roles = decodedToken.roles;
          if (!roles.includes("ADMIN")) {
            return res.status(403).json("You don't have enough rights");
          }
          const id = parseInt(req.query.id);
          if (!Number.isInteger(id)) {
            return res.status(400).json({ message: "Invalid category ID" });
          }
          const category = await DbClient.category.findUnique({
            where: {
              id,
            },
          });
          if (!category) {
            return res.status(404).json({ message: "Category not found" });
          }
          return res.json(category);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Category error" });
    }
  }

  async deleteCategory(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (authorizationHeader) {
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length === 2) {
          const token = tokenArray[1];
          let decodedToken;
          try {
            decodedToken = jwt.verify(token, process.env.SECRET);
          } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }
          const roles = decodedToken.roles;
          if (!roles.includes("ADMIN")) {
            return res.status(403).json("You don't have enough rights");
          }
          const id = parseInt(req.query.id);
          if (!Number.isInteger(id)) {
            return res.status(400).json({ message: "Invalid category ID" });
          }

          // Удаление категории и всех связанных с ней курсов в рамках одной транзакции
          await DbClient.$transaction(async (prisma) => {
            await DbClient.course.deleteMany({
              where: {
                category: Number(id),
              },
            });

            const category = await DbClient.category.delete({
              where: {
                id: Number(id),
              },
            });

            if (!category) {
              return res.status(404).json({ message: "Category not found" });
            }

            // Автоматически удаляем перевод из translations.json
            translationsManager.removeCategoryTranslation(id);

            return res.json(category);
          });
        }
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Category deletion error" });
    }
  }

  async updateCategory(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (authorizationHeader) {
        const tokenArray = authorizationHeader.split(" ");
        if (tokenArray.length === 2) {
          const token = tokenArray[1];
          let decodedToken;
          try {
            decodedToken = jwt.verify(token, process.env.SECRET);
          } catch (err) {
            return res.status(401).json({ message: "Invalid token" });
          }
          const roles = decodedToken.roles;
          if (!roles.includes("ADMIN")) {
            return res.status(403).json("You don't have enough rights");
          }
          const id = parseInt(req.query.id);
          if (!Number.isInteger(id)) {
            return res.status(400).json({ message: "Invalid category ID" });
          }
          const { name, nameEn, nameRu } = req.body;

          // Check if the category already exists (excluding current category)
          const existingCategory = await DbClient.category.findFirst({
            where: {
              name,
              id: { not: id }
            },
          });
          if (existingCategory) {
            // Return an error response if the category already exists
            return res.status(409).send("Category already exists");
          }
          
          const category = await DbClient.category.update({
            where: {
              id: Number(id),
            },
            data: {
              name: nameEn || name, // основное название = английское
              nameEn: nameEn || name,
              nameRu: nameRu || "",
            },
          });
          
          // Автоматически обновляем перевод в translations.json
          translationsManager.updateCategoryTranslation(name, id, nameEn, nameRu);
          
          return res.json(category);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Category update error" });
    }
  }
}

module.exports = new categoryController();
