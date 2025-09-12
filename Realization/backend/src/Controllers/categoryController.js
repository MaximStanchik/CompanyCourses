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
      let translation = categoryName; // по умолчанию оригинальное название
      
      if (lang === 'ru') {
        translation = nameRu || categoryName;
      } else if (lang === 'en') {
        translation = nameEn || categoryName;
      } else if (lang === 'be') {
        translation = categoryName; // по умолчанию оригинальное
      } else if (lang === 'uk') {
        translation = categoryName; // по умолчанию оригинальное
      } else if (lang === 'de') {
        translation = categoryName; // по умолчанию оригинальное
      } else if (lang === 'es') {
        translation = categoryName; // по умолчанию оригинальное
      } else if (lang === 'pt') {
        translation = categoryName; // по умолчанию оригинальное
      } else if (lang === 'zh') {
        translation = categoryName; // по умолчанию оригинальное
      }
  
      translations[lang].common[categoryKey] = translation;
    });
  
    return this.writeTranslations(translations);
  }

  updateCategoryTranslation(categoryName, categoryId, nameEn = null, nameRu = null, nameZh = null, nameDe = null, nameEs = null, namePt = null, nameUk = null, nameBe = null) {
    const translations = this.readTranslations();
    if (!translations) return false;
  
    const categoryKey = `category_${categoryId}`;
    
    // Обновляем переводы ТОЛЬКО для тех языков, которые явно переданы
    if (nameEn !== null && translations.en && translations.en.common) {
      translations.en.common[categoryKey] = nameEn || categoryName;
    }
    
    if (nameRu !== null && translations.ru && translations.ru.common) {
      translations.ru.common[categoryKey] = nameRu || categoryName;
    }
    
    if (nameZh !== null && translations.zh && translations.zh.common) {
      translations.zh.common[categoryKey] = nameZh || categoryName;
    }
    
    if (nameDe !== null && translations.de && translations.de.common) {
      translations.de.common[categoryKey] = nameDe || categoryName;
    }
    
    if (nameEs !== null && translations.es && translations.es.common) {
      translations.es.common[categoryKey] = nameEs || categoryName;
    }
    
    if (namePt !== null && translations.pt && translations.pt.common) {
      translations.pt.common[categoryKey] = namePt || categoryName;
    }
    
    if (nameUk !== null && translations.uk && translations.uk.common) {
      translations.uk.common[categoryKey] = nameUk || categoryName;
    }
    
    if (nameBe !== null && translations.be && translations.be.common) {
      translations.be.common[categoryKey] = nameBe || categoryName;
    }
  
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
          const { name, nameEn, nameRu, nameZh, nameDe, nameEs, namePt, nameUk, nameBe, parentId } = req.body;
          
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
              nameZh: nameZh || "",
              nameDe: nameDe || "",
              nameEs: nameEs || "",
              namePt: namePt || "",
              nameUk: nameUk || "",
              nameBe: nameBe || "",
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

          // Возвращаем плоский список вместо дерева
          return res.json(categories);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Categories error" });
    }
  }

  async getPublicCategories(req, res) {
    try {
      // Публичный endpoint для получения категорий - не требует авторизации
      const categories = await DbClient.category.findMany({
        select: {
          id: true,
          name: true,
          nameEn: true,
          nameRu: true,
          parentId: true
        },
        orderBy: [
          { parentId: 'asc' },
          { name: 'asc' }
        ]
      });

      return res.json(categories);
    } catch (e) {
      console.error('getPublicCategories error:', e);
      res.status(500).json({ message: "Error loading categories" });
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

          // Проверяем, используется ли категория в курсах
          const coursesUsingCategory = await DbClient.course.findMany({
            where: {
              category: Number(id),
            },
            select: {
              id: true,
              name: true
            }
          });

          // Проверяем, используется ли категория в связях курсов с категориями
          const coursesUsingCategoryRelation = await DbClient.courseCategory.findMany({
            where: {
              categoryId: Number(id),
            },
            include: {
              course: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });

          // Если категория используется в курсах, запрещаем удаление
          if (coursesUsingCategory.length > 0 || coursesUsingCategoryRelation.length > 0) {
            const usedInCourses = [
              ...coursesUsingCategory.map(c => ({ id: c.id, name: c.name })),
              ...coursesUsingCategoryRelation.map(cc => ({ id: cc.course.id, name: cc.course.name }))
            ];
            
            return res.status(409).json({ 
              message: "Cannot delete category that is used in courses",
              usedInCourses: usedInCourses
            });
          }

          // Проверяем, есть ли подкатегории
          const subcategories = await DbClient.category.findMany({
            where: {
              parentId: Number(id),
            },
            select: {
              id: true,
              name: true,
              nameEn: true,
              nameRu: true
            }
          });

          // Если есть подкатегории, проверяем, используются ли они в курсах
          if (subcategories.length > 0) {
            for (const subcategory of subcategories) {
              const subcategoryCourses = await DbClient.course.findMany({
                where: {
                  category: subcategory.id,
                },
                select: {
                  id: true,
                  name: true
                }
              });

              const subcategoryRelationCourses = await DbClient.courseCategory.findMany({
                where: {
                  categoryId: subcategory.id,
                },
                include: {
                  course: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              });

              if (subcategoryCourses.length > 0 || subcategoryRelationCourses.length > 0) {
                const usedInCourses = [
                  ...subcategoryCourses.map(c => ({ id: c.id, name: c.name })),
                  ...subcategoryRelationCourses.map(cc => ({ id: cc.course.id, name: cc.course.name }))
                ];
                
                return res.status(409).json({ 
                  message: `Cannot delete category because its subcategory "${subcategory.nameEn || subcategory.name}" is used in courses`,
                  usedInCourses: usedInCourses
                });
              }
            }
          }

          // Если категория не используется, удаляем её
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
  
          const { name, nameEn, nameRu, nameZh, nameDe, nameEs, namePt, nameUk, nameBe } = req.body;
  
          // Получаем текущую категорию для сохранения существующих значений
          const currentCategory = await DbClient.category.findUnique({
            where: { id: Number(id) },
          });
  
          if (!currentCategory) {
            return res.status(404).json({ message: "Category not found" });
          }
  
          // Check if the category already exists (excluding current category)
          const existingCategory = await DbClient.category.findFirst({
            where: {
              name: nameEn || name,
              id: { not: id }
            },
          });
  
          if (existingCategory) {
            return res.status(409).send("Category already exists");
          }
  
          // Подготавливаем данные для обновления
          const updateData = {
            name: nameEn !== undefined ? (nameEn || currentCategory.nameEn) : currentCategory.name,
            nameEn: nameEn !== undefined ? (nameEn || currentCategory.nameEn) : currentCategory.nameEn,
            nameRu: nameRu !== undefined ? (nameRu || currentCategory.nameRu) : currentCategory.nameRu,
            nameZh: nameZh !== undefined ? (nameZh || currentCategory.nameZh) : currentCategory.nameZh,
            nameDe: nameDe !== undefined ? (nameDe || currentCategory.nameDe) : currentCategory.nameDe,
            nameEs: nameEs !== undefined ? (nameEs || currentCategory.nameEs) : currentCategory.nameEs,
            namePt: namePt !== undefined ? (namePt || currentCategory.namePt) : currentCategory.namePt,
            nameUk: nameUk !== undefined ? (nameUk || currentCategory.nameUk) : currentCategory.nameUk,
            nameBe: nameBe !== undefined ? (nameBe || currentCategory.nameBe) : currentCategory.nameBe,
          };
  
          const category = await DbClient.category.update({
            where: { id: Number(id) },
            data: updateData,
          });
  
          // Автоматически обновляем перевод в translations.json
          // Передаем только те поля, которые были изменены
          translationsManager.updateCategoryTranslation(
            category.name,
            id,
            nameEn !== undefined ? nameEn : null,
            nameRu !== undefined ? nameRu : null,
            nameZh !== undefined ? nameZh : null,
            nameDe !== undefined ? nameDe : null,
            nameEs !== undefined ? nameEs : null,
            namePt !== undefined ? namePt : null,
            nameUk !== undefined ? nameUk : null,
            nameBe !== undefined ? nameBe : null
          );
  
          return res.json(category);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Category update error" });
    }
  }

  async getCategoryUsageInfo(req, res) {
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

          // Получаем все категории
          const categories = await DbClient.category.findMany({
            select: {
              id: true,
              name: true,
              nameEn: true,
              nameRu: true,
              parentId: true
            }
          });

          const usageInfo = {};

          // Проверяем каждую категорию на использование в курсах
          for (const category of categories) {
            // Проверяем прямое использование в поле category
            const directUsage = await DbClient.course.findMany({
              where: {
                category: category.id,
              },
              select: {
                id: true,
                name: true
              }
            });

            // Проверяем использование в связях courseCategory
            const relationUsage = await DbClient.courseCategory.findMany({
              where: {
                categoryId: category.id,
              },
              include: {
                course: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            });

            const allUsage = [
              ...directUsage.map(c => ({ id: c.id, name: c.name })),
              ...relationUsage.map(cc => ({ id: cc.course.id, name: cc.course.name }))
            ];

            if (allUsage.length > 0) {
              usageInfo[category.id] = {
                categoryName: category.nameEn || category.name,
                usedInCourses: allUsage
              };
            }
          }

          return res.json(usageInfo);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Error getting category usage info" });
    }
  }
}

module.exports = new categoryController();
