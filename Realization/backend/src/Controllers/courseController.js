const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const { getWS } = require("../ws/websocket");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const path = require('path');
const NotificationService = require('../utils/notificationService');

// Helper functions for syllabus meta
const getSyllabusMetaPath = (courseId) => {
  const dataDir = path.join(__dirname, '../../static/course-meta');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, `course-${courseId}-syllabus.json`);
};

const readSyllabusMeta = (courseId) => {
  try {
    const metaPath = getSyllabusMetaPath(courseId);
    if (fs.existsSync(metaPath)) {
      return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }
  } catch (e) { console.warn('Failed to read syllabus meta:', e); }
  return { courseId, schedule: null, syllabus: null };
};

const writeSyllabusMeta = (courseId, meta) => {
  try {
    const metaPath = getSyllabusMetaPath(courseId);
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
  } catch (e) { console.error('Failed to write syllabus meta:', e); }
};

class courseController {
  async addCourse(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json({ message: "Invalid authorization format" });
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const roles = decodedToken.roles;
      if (!roles || !roles.includes("ADMIN")) {
        return res.status(403).json({ message: "You don't have enough rights" });
      }
      
      if (!req.body.name || !req.body.name.trim()) {
        return res.status(400).json({ message: "Course name is required" });
      }
      
      // Поиск категории по имени
      let category = null;
      if (req.body.category) {
        category = await DbClient.category.findUnique({
          where: {
            name: req.body.category,
          },
        });
      }

      // Check if the course name already exists
      const existingCourse = await DbClient.course.findFirst({
        where: {
          name: req.body.name.trim(),
        },
      });
      if (existingCourse) {
        return res.status(409).json({ message: "Course with this name already exists." });
      }

      const courseData = {
        name: req.body.name.trim(),
        description: req.body.description ?? '',
        shortDescription: req.body.shortDescription ?? '',
        workload: req.body.workload ?? '',
        learningOutcomes: req.body.learningOutcomes ?? '',
        requirements: req.body.requirements ?? '',
        learningFormat: req.body.learningFormat ?? '',
        language: req.body.language ?? '',
        level: req.body.level ?? '',
        status: req.body.status ?? 'draft',
        acquiredAssets: req.body.acquiredAssets ?? '',
      };
      if (category) {
        courseData.Category = { connect: { id: category.id } };
      }

      const createdCourse = await DbClient.course.create({ data: courseData });

      // Создаем уведомление
      try {
        const createdNotification = await DbClient.notification.create({
          data: {
            courseId: createdCourse.id,
            title: "Новый курс создан",
            message: `Администратор создал новый курс: ${createdCourse.name}`,
            type: "info",
            read: false,
            createdAt: new Date(),
          },
        });
        if (createdNotification) {
          let IO = getWS();
          if (IO) {
            IO.emit("new-notification", { createdNotification });
          }
        }
      } catch (notificationError) {
        console.warn('Failed to create notification:', notificationError);
        // Не прерываем создание курса если уведомление не создалось
      }
      
      res.status(201).json(createdCourse);
    } catch (e) {
      console.error('Course creation error:', e);
      res.status(500).json({ message: "Internal server error during course creation" });
    }
  }

  async getAllCourses(req, res) {
    try {
      // проверка, что пользователь авторизован:
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json("You are not authorized");
      } else {
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
          const whereClause = roles.includes('ADMIN') ? {} : { 
            status: {
              in: ['published']  // Обычные пользователи видят курсы со статусом 'open' или 'published'
            }
          };
          const courses = await DbClient.course.findMany({
            where: whereClause,
            select: {
              id: true,
              name: true,
              description: true,
              shortDescription: true,
              workload: true,
              learningOutcomes: true,
              requirements: true,
              learningFormat: true,
              language: true,
              level: true,
              status: true,
              logoUrl: true,
              introUrl: true,
              acquiredAssets: true,
              Category: { 
                select: { 
                  id: true,
                  name: true,
                  nameEn: true,
                  nameRu: true
                } 
              },
            },
            orderBy: {
              id: 'desc'
            }
          });
          return res.send(courses);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).send({ message: "Courses error" });
    }
  }

  async getPublicCourses(req, res) {
    try {
      // Публичный endpoint для каталога курсов - не требует авторизации
      const courses = await DbClient.course.findMany({
        where: { 
          status: {
            in: ['published']  // Показываем курсы со статусом 'open' или 'published'
          }
        },
        select: {
          id: true,
          name: true,
          description: true,
          shortDescription: true,
          workload: true,
          learningOutcomes: true,
          requirements: true,
          learningFormat: true,
          language: true,
          level: true,
          status: true,
          logoUrl: true,
          introUrl: true,
          acquiredAssets: true,
          // createdAt: true, // Убираем это поле, так как его нет в модели
          Category: { 
            select: { 
              id: true,
              name: true,
              nameEn: true,
              nameRu: true
            } 
          },
          courseCategories: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  nameRu: true
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        },
        orderBy: {
          id: 'desc'
        }
      });

      // Добавляем количество студентов, рейтинг и комментарии
      const coursesWithStats = await Promise.all(courses.map(async (course) => {
        // Get rating stats
        const ratingStats = await DbClient.courseRating.aggregate({
          where: { courseId: course.id },
          _avg: { rating: true },
          _count: { rating: true }
        });

        // Get comment count
        const commentCount = await DbClient.courseComment.count({
          where: { courseId: course.id }
        });

        // Создаем массив категорий как в getPublicCourses
        const categoriesArray = [];
        if (course.Category) {
          categoriesArray.push(course.Category);
        }
        if (course.courseCategories && Array.isArray(course.courseCategories)) {
          course.courseCategories.forEach(cc => {
            if (cc.category && !categoriesArray.find(c => c.id === cc.category.id)) {
              categoriesArray.push(cc.category);
            }
          });
        }
        course.categories = categoriesArray;
        
        console.log('Course categories debug:', {
          courseId: course.id,
          courseCategories: course.courseCategories,
          categories: course.categories
        });
        
        // Add rating stats to course
        course.averageRating = ratingStats._avg.rating || 0;
        course.totalRatings = ratingStats._count.rating || 0;
        course.commentCount = commentCount;

        return {
          ...course,
          enrollmentCount: course._count.enrollments,
          averageRating: ratingStats._avg.rating || 0,
          totalRatings: ratingStats._count.rating || 0,
          commentCount: commentCount,
          categories: categoriesArray
        };
      }));

      return res.json(coursesWithStats);
    } catch (e) {
      console.error('getPublicCourses error:', e);
      res.status(500).json({ message: "Error loading courses" });
    }
  }

  async getCourseById(req, res) {
    try {
      // Поддержка как query параметра, так и параметра в URL
      const id = Number(req.params.id || req.query.id);
      if (!id || isNaN(id)) return res.status(400).json({ message: 'Invalid id' });
      const course = await DbClient.course.findUnique({
        where: { id },
        include: {
          Category: {
            select: { id: true, name: true, nameEn: true, nameRu: true }
          },
          courseCategories: {
            include: { category: true }
          },
          lectures: {
            select: {
              id: true,
              name: true,
              videoLink: true,
              content: true
            },
            orderBy: {
              id: 'asc'
            }
          }
        }
      });
      if (!course) return res.status(404).json({ message: 'Not found' });
      
      // Get rating stats
      const ratingStats = await DbClient.courseRating.aggregate({
        where: { courseId: course.id },
        _avg: { rating: true },
        _count: { rating: true }
      });

      // Get comment count
      const commentCount = await DbClient.courseComment.count({
        where: { courseId: course.id }
      });

      // categories array for convenience
      const categories = (course.courseCategories || []).map(cc => cc.categoryId || (cc.category && cc.category.id)).filter(Boolean);
      course.categories = categories;
      
      // Add rating stats to course
      course.averageRating = ratingStats._avg.rating || 0;
      course.totalRatings = ratingStats._count.rating || 0;
      course.commentCount = commentCount;
      
      // attach syllabus meta if exists
      try {
        const metaPath = path.join(__dirname, '../../static/course-meta', `course-${id}-syllabus.json`);
        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          return res.json({ ...course, _meta: meta });
        }
      } catch (_) {}
      return res.json(course);
    } catch (e) {
      console.error('getCourseById error:', e);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  async deleteCourse(req, res) {
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
          const { id } = req.query;
          const course = await DbClient.course.delete({
            where: {
              id: Number(id),
            },
          });
          return res.json(course);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).json({ message: "Course deletion error" });
    }
  }

  async deleteCoursesByCategory(req, res) {
    try {
      const { id } = req.query;
      const courses = await DbClient.course.findMany({
        where: {
          category: Number(id),
        },
      });

      if (!courses || courses.length === 0) {
        return res.status(404).send("No courses found for this category.");
      }

      // Удаление всех найденных курсов
      await DbClient.course.deleteMany({
        where: {
          category: Number(id),
        },
      });
      return res.send({
        message: `Courses for category with id ${id} successfully deleted.`,
      });
    } catch (e) {
      console.log(e);
      res.status(400).send({ message: "Error deleting courses by category" });
    }
  }

  async updateCourse(req, res) {
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

          const { id } = req.query;
          const { name, description, category } = req.body;

          const existingCourse = await DbClient.course.findUnique({
            where: {
              name,
            },
          });

          if (existingCourse && existingCourse.id !== parseInt(id)) {
            // Return an error response if the course with the same name exists and has a different id
            return res
              .status(409)
              .send("Course with this name already exists.");
          }

          const course = await DbClient.course.update({
            where: {
              id: parseInt(id),
            },
            data: {
              name: name,
              description: description,
              Category: {
                connect: {
                  id: category,
                },
              },
            },
          });

          // Отправляем уведомления пользователям курса
          try {
            const adminUser = await DbClient.user.findUnique({ where: { id: decodedToken.id } });
            await NotificationService.notifyCourseContentUpdated(
              course.id, 
              course.name, 
              adminUser.username || 'Администратор'
            );
          } catch (notificationError) {
            console.error('Ошибка при отправке уведомления:', notificationError);
            // Не прерываем выполнение, если уведомление не отправилось
          }

          if (!course) {
            return res.status(404).send("Course with this id not found.");
          }

          return res.send(course);
        }
      }
    } catch (e) {
      console.log(e);
      res.status(400).send({ message: "Course updation error" });
    }
  }

  async renameCourse(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) return res.status(401).json('Unauthorized');
      const [_, token] = authorizationHeader.split(' ');
      const decoded = require('jsonwebtoken').verify(token, process.env.SECRET);
      if (!(decoded.roles||[]).includes('ADMIN')) return res.status(403).json('Forbidden');

      const id = Number(req.params.id);
      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json('Name required');
      await DbClient.course.update({ where:{ id }, data:{ name: name.trim() } });
      res.json({ id, name: name.trim() });
    } catch (e) { console.error(e); res.status(500).json(e);}  }

// ===== API: delete module from syllabus =====
async deleteCourseModule(req, res) {
  try {
    const courseId = Number(req.params.id);
    const moduleId = Number(req.params.moduleId);
    
    if (!courseId || isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    if (!moduleId || isNaN(moduleId)) {
      return res.status(400).json({ message: 'Invalid module ID' });
    }

    // Basic admin auth check
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      return res.status(401).json({ message: 'Auth header missing' });
    }
    
    const [_bearer, token] = authorizationHeader.split(' ');
    let decodedToken;
    try { 
      decodedToken = jwt.verify(token, process.env.SECRET); 
    } catch (_) { 
      return res.status(401).json({ message: 'Invalid token' }); 
    }
    
    if (!(decodedToken.roles || []).includes('ADMIN')) {
      return res.status(403).json({ message: "You don't have enough rights" });
    }

    // Read meta, find and remove module
    const meta = readSyllabusMeta(courseId);
    const modulesArr = Array.isArray(meta.syllabus) ? meta.syllabus : [];
    
    // Find module index
    const moduleIndex = modulesArr.findIndex(m => Number(m.id) === moduleId);
    if (moduleIndex === -1) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Get module info before deletion (for logging)
    const moduleToDelete = modulesArr[moduleIndex];
    console.log(`Deleting module: ${moduleToDelete.title || moduleToDelete.name} (ID: ${moduleId})`);
    
    // Remove module from array
    modulesArr.splice(moduleIndex, 1);
    meta.syllabus = modulesArr;
    
    // Save updated meta
    writeSyllabusMeta(courseId, meta);
    
    // Log success
    console.log(`Module ${moduleId} deleted successfully from course ${courseId}`);
    
    return res.status(200).json({ 
      message: 'Module deleted successfully',
      deletedModuleId: moduleId,
      remainingModules: modulesArr.length
    });
    
  } catch (e) {
    console.error('deleteCourseModule error:', e);
    return res.status(500).json({ message: 'Server error deleting module' });
  }
}

  async updateCourseFields(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json({ message: "Invalid authorization format" });
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const roles = decodedToken.roles;
      if (!roles || !roles.includes("ADMIN")) {
        return res.status(403).json({ message: "You don't have enough rights" });
      }

      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }

      // Проверяем существование курса
      const existingCourse = await DbClient.course.findUnique({
        where: { id }
      });
      
      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Подготавливаем данные для обновления
      const updateData = {};
      
      console.log('Received update data:', req.body);
      
      // Обрабатываем каждое поле
      if (req.body.shortDescription !== undefined) {
        updateData.shortDescription = req.body.shortDescription;
      }
      if (req.body.workload !== undefined) {
        updateData.workload = req.body.workload;
      }
      if (req.body.learningOutcomes !== undefined) {
        updateData.learningOutcomes = req.body.learningOutcomes;
      }
      if (req.body.description !== undefined) {
        updateData.description = req.body.description;
        console.log('Setting description (HTML):', req.body.description);
      }
      if (req.body.requirements !== undefined) {
        updateData.requirements = req.body.requirements;
        console.log('Setting requirements (HTML):', req.body.requirements);
      }
      if (req.body.learningFormat !== undefined) {
        updateData.learningFormat = req.body.learningFormat;
        console.log('Setting learningFormat (HTML):', req.body.learningFormat);
      }
      if (req.body.language !== undefined) {
        updateData.language = req.body.language;
      }
      if (req.body.level !== undefined) {
        updateData.level = req.body.level;
      }
      if (req.body.targeting !== undefined) {
        updateData.targeting = req.body.targeting;
        console.log('Setting targeting (HTML):', req.body.targeting);
      }
      if (req.body.status !== undefined) {
        updateData.status = req.body.status;
        console.log('Setting status:', req.body.status);
      }
      // Optional schedule fields (not in schema) — ignored by Prisma, saved to file fallback
      const schedulePayload = {
        startDate: req.body.startDate ?? null,
        softDeadline: req.body.softDeadline ?? null,
        hardDeadline: req.body.hardDeadline ?? null,
        endDate: req.body.endDate ?? null,
        gradingPolicy: req.body.gradingPolicy ?? 'none',
      };
      const syllabusPayload = req.body.syllabus ?? null;
      
      // Обрабатываем основную категорию (для обратной совместимости)
      if (req.body.category) {
        updateData.category = Number(req.body.category);
      } else {
        updateData.category = null;
      }
      // Поддержка множественных категорий через таблицу CourseCategory
      const categoriesArray = Array.isArray(req.body.categories) ? req.body.categories.map(Number).filter(Boolean) : null;

      if (req.body.logoUrl !== undefined) {
        updateData.logoUrl = req.body.logoUrl;
      }
      if (req.body.introUrl !== undefined) {
        updateData.introUrl = req.body.introUrl;
      }
      if (req.body.acquiredAssets !== undefined) {
        updateData.acquiredAssets = req.body.acquiredAssets;
      }

      console.log('Processed update data:', updateData);

      // Обновляем курс
      let updatedCourse;
      try {
        updatedCourse = await DbClient.course.update({
          where: { id },
          data: updateData
        });
      } catch (err) {
        // Если клиент Prisma устарел и не знает про поле targeting,
        // пробуем повторить без него, чтобы не ронять сохранение остальных полей
        const message = (err && (err.message || String(err))) || '';
        const lower = message.toLowerCase();
        const isUnknownTargetingArg = (
          lower.includes('unknown arg') ||
          lower.includes('unknown argument') ||
          lower.includes('unknown field')
        ) && lower.includes('targeting');
        if (isUnknownTargetingArg && Object.prototype.hasOwnProperty.call(updateData, 'targeting')) {
          console.warn('Prisma client may not recognize `targeting`. Retrying update without it. Original error:', message);
          const retryData = { ...updateData };
          delete retryData.targeting;
          updatedCourse = await DbClient.course.update({
            where: { id },
            data: retryData
          });
        } else {
          throw err;
        }
      }

      // Fallback store of schedule/syllabus JSON alongside course as a file
      try {
        const dataDir = path.join(__dirname, '../../static/course-meta');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        const metaPath = path.join(dataDir, `course-${updatedCourse.id}-syllabus.json`);
        const meta = { courseId: updatedCourse.id, schedule: schedulePayload, syllabus: syllabusPayload };
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
      } catch (fileErr) {
        console.warn('Failed to save syllabus file:', fileErr);
      }

      // Если передан массив категорий, синхронизируем связи в CourseCategory
      if (categoriesArray) {
        // Удаляем старые связи
        await DbClient.courseCategory.deleteMany({ where: { courseId: id } });
        // Создаем новые связи (уникальные id)
        const uniqueCategoryIds = Array.from(new Set(categoriesArray));
        if (uniqueCategoryIds.length > 0) {
          await DbClient.courseCategory.createMany({
            data: uniqueCategoryIds.map(categoryId => ({ courseId: id, categoryId }))
          });
        }
      }

      // Получаем обновленный курс
      const courseWithCategories = await DbClient.course.findUnique({
        where: { id },
        include: { courseCategories: { include: { category: true } } }
      });
      courseWithCategories.categories = (courseWithCategories.courseCategories || []).map(cc => cc.categoryId || (cc.category && cc.category.id)).filter(Boolean);

      // Создаем уведомление об обновлении
      try {
        const createdNotification = await DbClient.notification.create({
          data: {
            courseId: updatedCourse.id,
            title: "Курс обновлен",
            message: `Администратор обновил поля курса: ${updatedCourse.name}`,
            type: "info",
            read: false,
            createdAt: new Date(),
          },
        });
        if (createdNotification) {
          let IO = getWS();
          if (IO) {
            IO.emit("new-notification", { createdNotification });
          }
        }
      } catch (notificationError) {
        console.warn('Failed to create notification:', notificationError);
      }

      res.json(courseWithCategories);
    } catch (e) {
      console.error('Course fields update error:', e);
      res.status(500).json({ message: "Internal server error during course update" });
    }
  }

  /**
   * Update course status (publish/unpublish)
   * PATCH /course/:id/status
   */
  async updateCourseStatus(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json({ message: "Invalid authorization format" });
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const roles = decodedToken.roles;
      if (!roles || !roles.includes("ADMIN")) {
        return res.status(403).json({ message: "You don't have enough rights" });
      }

      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }

      const { status } = req.body;
      if (!status || !['draft', 'published', 'inactive'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be one of: draft, published, inactive" });
      }

      // Проверяем существование курса
      const existingCourse = await DbClient.course.findUnique({
        where: { id }
      });
      
      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Обновляем статус курса
      const updatedCourse = await DbClient.course.update({
        where: { id },
        data: { status }
      });

      // Создаем уведомление об изменении статуса
      try {
        const statusText = status === 'published' ? 'published' : 'unpublished';
        const createdNotification = await DbClient.notification.create({
          data: {
            courseId: updatedCourse.id,
            title: "Course status changed",
            message: `Course "${updatedCourse.name}" was ${statusText}.`,
            type: "info",
            read: false,
            createdAt: new Date(),
          },
        });
        if (createdNotification) {
          let IO = getWS();
          if (IO) {
            IO.emit("new-notification", { createdNotification });
          }
        }
      } catch (notificationError) {
        console.warn('Failed to create status change notification:', notificationError);
      }

      res.json({
        ...updatedCourse,
        message: `Course status updated to ${status}`
      });

    } catch (e) {
      console.error('Course status update error:', e);
      res.status(500).json({ message: "Internal server error during status update" });
    }
  }

  async uploadFile(req, res) {
    try {
      console.log('=== UPLOAD FILE START ===');
      console.log('Upload request received:', {
        courseId: req.params.id,
        type: req.query.type,
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          filename: req.file.filename
        } : null
      });
  
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json({ message: "Invalid authorization format" });
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const roles = decodedToken.roles;
      if (!roles || !roles.includes("ADMIN")) {
        return res.status(403).json({ message: "You don't have enough rights" });
      }
  
      const courseId = Number(req.params.id);
      if (!courseId || isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
  
      // Проверяем существование курса
      const existingCourse = await DbClient.course.findUnique({
        where: { id: courseId }
      });
      
      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
  
      const { type } = req.query;
      if (!type || !['logo', 'intro', 'image', 'video', 'file'].includes(type)) {
        return res.status(400).json({ message: "Invalid file type. Must be 'logo', 'intro', 'image', 'video', or 'file'" });
      }
  
      // Проверяем, что файл был загружен
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
  
      // Проверяем размер файла (максимум 15GB для больших видеофайлов)
      const maxSize = 15 * 1024 * 1024 * 1024; // 15GB
      if (req.file.size > maxSize) {
        return res.status(400).json({ message: "File size too large. Maximum size is 15GB" });
      }
  
      // Multer уже проверил тип файла, поэтому дополнительная проверка не нужна
      // Просто логируем информацию о файле для отладки
      console.log('File validation passed by multer:', {
        type,
        mimetype: req.file.mimetype,
        filename: req.file.filename,
        size: req.file.size
      });
  
      // Импортируем MinIO клиент
      const { uploadFile: uploadToMinio, BUCKETS } = require('../utils/minioClient');
      
      // Определяем бакет и имя файла для MinIO
      let bucketName = BUCKETS.COURSE_FILES;
      let objectName;
      
      if (type === 'logo') {
        objectName = `course-${courseId}-logo-${req.file.filename}`;
      } else if (type === 'intro') {
        objectName = `course-${courseId}-intro-${req.file.filename}`;
      } else if (type === 'image') {
        objectName = `course-${courseId}-image-${req.file.filename}`;
      } else if (type === 'video') {
        objectName = `course-${courseId}-video-${req.file.filename}`;
      } else if (type === 'file') {
        objectName = `course-${courseId}-file-${req.file.filename}`;
      } else {
        return res.status(400).json({ message: `Unsupported file type: ${type}` });
      }
      
      console.log('File will be stored as:', { bucketName, objectName });
      
      // Читаем файл из временного места
      const fileBuffer = fs.readFileSync(req.file.path);
      
      // Загружаем файл в MinIO
      console.log('📤 Uploading file to MinIO:', {
        bucketName,
        objectName,
        contentType: req.file.mimetype,
        size: fileBuffer.length
      });
      
      const minioPath = await uploadToMinio(bucketName, objectName, fileBuffer, req.file.mimetype);
      console.log('✅ File uploaded to MinIO:', minioPath);
      
      // Удаляем временный файл
      fs.unlinkSync(req.file.path);
      console.log('��️ Temporary file deleted:', req.file.path);
      
      // Создаем правильный URL для MinIO
      const fileUrl = `/api/minio/file/${bucketName}/${objectName}`;
      
      // Обновляем курс с новым URL только для logo и intro
      const updateData = {};
      if (type === 'logo') {
        updateData.logoUrl = fileUrl;
      } else if (type === 'intro') {
        updateData.introUrl = fileUrl;
      }
      // Для типов 'image', 'video' и 'file' не обновляем курс, так как это файлы для редактора
  
      let updatedCourse;
      if (type === 'logo' || type === 'intro') {
        updatedCourse = await DbClient.course.update({
          where: { id: courseId },
          data: updateData
        });
      }
  
      res.json({ 
        url: fileUrl, 
        filename: objectName,
        message: `${type === 'logo' ? 'Logo' : type === 'intro' ? 'Intro video' : type === 'video' ? 'Video' : type === 'file' ? 'File' : 'Image'} uploaded successfully` 
      });
      
      console.log('File uploaded successfully:', {
        courseId,
        type,
        fileUrl,
        filename: objectName,
        minioPath
      });
    } catch (e) {
      console.error('File upload error:', e);
      
      // Определяем тип ошибки и отправляем соответствующее сообщение
      let errorMessage = "Internal server error during file upload";
      let statusCode = 500;
      
      if (e.code === 'ENOENT') {
        errorMessage = "Upload directory not found";
        statusCode = 500;
      } else if (e.code === 'EACCES') {
        errorMessage = "Permission denied to upload directory";
        statusCode = 500;
      } else if (e.code === 'ENOSPC') {
        errorMessage = "No space left on device";
        statusCode = 500;
      }
      
      res.status(statusCode).json({ 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? e.message : undefined
      });
    }
  }

  // Получить модули курса
  async getCourseModules(req, res) {
    try {
      const courseId = Number(req.params.id);
      if (!courseId || isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }

      // Try to read from syllabus meta file first
      const meta = readSyllabusMeta(courseId);
      if (Array.isArray(meta.syllabus) && meta.syllabus.length > 0) {
        return res.json(meta.syllabus.sort((a,b) => (a.order||0)-(b.order||0)));
      }

      // If no custom syllabus yet, return an empty array instead of generating temporary data
      return res.json([]);

      // Fallback removed
    } catch (error) {
      console.error('Error getting course modules:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Получить syllabus курса
  async getCourseSyllabus(req, res) {
    try {
      const courseId = Number(req.params.id);
      
      if (!courseId || isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }

      // Read syllabus meta file
      const meta = readSyllabusMeta(courseId);
      return res.json(meta);
    } catch (error) {
      console.error('Error getting course syllabus:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Получить полный syllabus курса с модулями и уроками
  async getFullSyllabus(req, res) {
    try {
      const courseId = Number(req.params.id);
      
      if (!courseId || isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }

      // Проверяем, что курс существует
      const course = await DbClient.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Получаем все лекции курса
      const lectures = await DbClient.lecture.findMany({
        where: { course_id: courseId },
        include: {
          steps: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { id: 'asc' }
      });

      console.log(`=== FULL SYLLABUS ДЛЯ КУРСА ${courseId} ===`);
      console.log('Найдено лекций:', lectures.length);
      console.log('Лекции:', lectures.map(l => ({ id: l.id, name: l.name, stepsCount: l.steps?.length || 0 })));

      // Читаем существующие модули из meta файла
      const meta = readSyllabusMeta(courseId);
      const existingModules = Array.isArray(meta.syllabus) ? meta.syllabus : [];

      // Распределяем лекции по модулям
      const lessonsByModule = {};
      lectures.forEach((lecture, index) => {
        // Используем реальный moduleId из базы данных
        let moduleId;
        if (lecture.moduleId) {
          moduleId = Number(lecture.moduleId);
        } else {
          // Fallback: если moduleId нет, используем автоматическое распределение
          moduleId = Math.floor(index / 3) + 1;
        }

        if (!lessonsByModule[moduleId]) {
          lessonsByModule[moduleId] = [];
        }

        // Отладочная информация о лекции и её шагах
        console.log(`Лекция ${lecture.id} (${lecture.name}):`, {
          id: lecture.id,
          name: lecture.name,
          moduleId: lecture.moduleId,
          videoLink: lecture.videoLink,
          stepsCount: lecture.steps ? lecture.steps.length : 0,
          steps: lecture.steps ? lecture.steps.map(step => ({
            id: step.id,
            type: step.type,
            title: step.title,
            videoUrl: step.videoUrl,
            content: step.content
          })) : []
        });

        lessonsByModule[moduleId].push({
          id: lecture.id,
          name: lecture.name,
          title: lecture.name,
          type: 'video',
          content: lecture.content || '',
          videoUrl: lecture.videoLink || null,
          steps: lecture.steps ? lecture.steps.map(step => ({
            ...step,
            videoUrl: step.videoUrl || null,
            content: step.content || '',
            title: step.title || '',
            type: step.type || 'text'
          })) : []
        });
      });

      // Получаем уникальные moduleId из лекций
      const uniqueModuleIds = [...new Set(lectures
        .filter(lecture => lecture.moduleId)
        .map(lecture => Number(lecture.moduleId))
      )];

      console.log('Уникальные moduleId из лекций:', uniqueModuleIds);

      // Если есть реальные модули из meta файла, используем их
      let modules = existingModules;

      // Если модулей нет в meta, но есть лекции с moduleId, создаем модули на основе реальных moduleId
      if (existingModules.length === 0 && uniqueModuleIds.length > 0) {
        modules = uniqueModuleIds.map((moduleId, index) => ({
          id: moduleId,
          title: `Module ${index + 1}`,
          description: `Auto-generated module ${index + 1}`,
          order: index + 1,
          lessons: []
        }));
      } else if (existingModules.length === 0 && lectures.length > 0) {
        // Fallback: создаем временные модули (каждые 3 лекции = 1 модуль)
        const moduleCount = Math.ceil(lectures.length / 3);
        modules = Array.from({ length: moduleCount }, (_, index) => ({
          id: index + 1,
          title: `Module ${index + 1}`,
          description: `Auto-generated module ${index + 1}`,
          order: index + 1,
          lessons: []
        }));
      }

      // Объединяем модули с уроками
      const modulesWithLessons = modules.map(module => ({
        ...module,
        lessons: lessonsByModule[module.id] || []
      }));

      console.log('Модули с уроками:', modulesWithLessons.map(m => ({
        id: m.id,
        title: m.title,
        lessonsCount: m.lessons?.length || 0,
        lessons: m.lessons?.map(l => ({ id: l.id, name: l.name })) || []
      })));
      console.log(`=== КОНЕЦ FULL SYLLABUS ДЛЯ КУРСА ${courseId} ===`);

      res.json({
        courseId: courseId,
        modules: modulesWithLessons,
        totalModules: modulesWithLessons.length,
        totalLessons: lectures.length
      });
    } catch (error) {
      console.error('Error getting full syllabus:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Получить уроки курса
  async getCourseLessons(req, res) {
    try {
      const courseId = Number(req.params.id);
      if (!courseId || isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }

      // Проверяем, что курс существует
      const course = await DbClient.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Получаем все лекции курса
      const lectures = await DbClient.lecture.findMany({
        where: { course_id: courseId },
        include: {
          steps: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { id: 'asc' }
      });

      // Преобразуем лекции в уроки
      const lessons = lectures.map((lecture, index) => {
        // Определяем модуль на основе индекса (каждые 3 лекции = 1 модуль)
        const moduleId = Math.floor(index / 3) + 1;
        
        return {
          id: lecture.id,
          moduleId: moduleId,
          title: lecture.name,
          description: lecture.content ? lecture.content.substring(0, 100) + '...' : 'No description',
          duration: lecture.steps ? lecture.steps.length * 5 : 15, // Примерная длительность
          videoUrl: lecture.videoLink,
          content: lecture.content,
          steps: lecture.steps
        };
      });

      res.json(lessons);
    } catch (error) {
      console.error('Error getting course lessons:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Получить прогресс пользователя по курсу
  async getUserProgress(req, res) {
    try {
      const { id: courseId, userId } = req.params;
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ message: 'Token required' });
      }
      
      const decodedToken = jwt.verify(token, process.env.SECRET);
      const requestingUserId = decodedToken.id;
      
      // Проверяем, что пользователь запрашивает свой прогресс или это админ
      if (parseInt(userId) !== requestingUserId && decodedToken.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      console.log('=== ЗАГРУЗКА ПРОГРЕССА ПОЛЬЗОВАТЕЛЯ ===');
      console.log('Курс ID:', courseId, 'Пользователь ID:', userId);
      console.log('req.params:', req.params);
      
      // Проверяем, что пользователь записан на курс
      const enrollment = await DbClient.enrollment.findFirst({
        where: {
          user_id: parseInt(userId),
          course_id: parseInt(courseId)
        }
      });
      
      if (!enrollment) {
        return res.status(403).json({ message: 'User is not enrolled in this course' });
      }
      
      // Получаем попытки тестов пользователя
      const testAttempts = await DbClient.testAttempt.findMany({
        where: {
          user_id: parseInt(userId),
          course_id: parseInt(courseId)
        },
        select: { 
          lesson_id: true, 
          step_index: true, 
          attempts: true,
          lastScore: true,
          lastPassed: true,
          lastAnswers: true,
          updatedAt: true
        }
      });
      
      console.log('Test attempts found:', testAttempts.length);
      
      // Преобразуем данные в camelCase для frontend
      const formattedTestAttempts = testAttempts.map(attempt => ({
        lessonId: attempt.lesson_id,
        stepIndex: attempt.step_index,
        attempts: attempt.attempts,
        lastScore: attempt.lastScore,
        lastPassed: attempt.lastPassed,
        lastAnswers: attempt.lastAnswers,
        updatedAt: attempt.updatedAt
      }));
      
      // Получаем уроки курса
      const lessons = await DbClient.lecture.findMany({
        where: { course_id: parseInt(courseId) },
        include: { steps: true }
      });
      
      // Подсчитываем общий прогресс (только на основе завершенных тестов на 100%)
      let totalSteps = 0;
      let completedSteps = 0;
      
      lessons.forEach(lesson => {
        totalSteps += lesson.steps.length;
        lesson.steps.forEach((step, stepIndex) => {
          if (step.type === 'test' || step.type === 'quiz') {
            const testAttempt = testAttempts.find(ta => 
              ta.lesson_id === lesson.id && ta.step_index === stepIndex
            );
            if (testAttempt && testAttempt.lastScore >= 100) {
              completedSteps++;
            }
          }
        });
      });
      
      const totalProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
      
      console.log('Progress calculated:', { totalSteps, completedSteps, totalProgress });
      
      res.json({
        courseId: parseInt(courseId),
        userId: parseInt(userId),
        totalProgress,
        testAttempts: formattedTestAttempts, // Используем отформатированные данные
        message: 'Progress loaded successfully'
      });
      
    } catch (error) {
      console.error('Error in getUserProgress:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }

  // Завершить урок
  async completeLesson(req, res) {
    try {
      const courseId = Number(req.params.id);
      const lessonId = Number(req.params.lessonId);
      
      if (!courseId || isNaN(courseId) || !lessonId || isNaN(lessonId)) {
        return res.status(400).json({ message: 'Invalid course ID or lesson ID' });
      }

      // Проверяем авторизацию
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json({ message: "Invalid authorization format" });
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Проверяем, что курс существует
      const course = await DbClient.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Проверяем, что урок существует и принадлежит курсу
      const lesson = await DbClient.lecture.findFirst({
        where: {
          id: lessonId,
          course_id: courseId
        }
      });

      if (!lesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }

      // Проверяем, что пользователь записан на курс
      const enrollment = await DbClient.enrollment.findFirst({
        where: {
          course_id: courseId,
          user_id: decodedToken.id
          // Убираем проверку approved
        }
      });

      if (!enrollment) {
        return res.status(403).json({ message: 'User is not enrolled in this course' });
      }

      // Фиксируем завершение урока в БД (идемпотентно)
      await DbClient.lessonCompletion.upsert({
        where: {
          user_id_lecture_id: {
            user_id: decodedToken.id,
            lecture_id: lessonId,
          }
        },
        update: { completedAt: new Date() },
        create: {
          user_id: decodedToken.id,
          course_id: courseId,
          lecture_id: lessonId,
          completedAt: new Date(),
        }
      });

      // Опционально: обновляем прогресс модуля, если клиент прислал moduleKey и moduleProgress
      const { moduleKey, moduleProgress } = req.body || {};
      if (moduleKey && typeof moduleProgress === 'number') {
        await DbClient.moduleProgress.upsert({
          where: {
            user_id_course_id_module_key: {
              user_id: decodedToken.id,
              course_id: courseId,
              module_key: String(moduleKey),
            }
          },
          update: { progress: Math.max(0, Math.min(100, Math.round(moduleProgress))) },
          create: {
            user_id: decodedToken.id,
            course_id: courseId,
            module_key: String(moduleKey),
            progress: Math.max(0, Math.min(100, Math.round(moduleProgress)))
          }
        });
      }

      // ===== Пересчитываем прогресс курса и сохраняем в Enrollment =====
      // Читаем модули курса из JSON файла
      const meta = readSyllabusMeta(courseId);
      console.log(`Мета данные для курса ${courseId} (completeLesson):`, meta);
      const modules = Array.isArray(meta.syllabus) ? meta.syllabus : [];
      
      // Считаем общее количество уроков в модулях
      let totalLessons = 0;
      let lessonIds = [];
      
      for (const module of modules) {
        console.log(`Модуль ${module.id} (${module.title}) в completeLesson:`, module);
        if (Array.isArray(module.lessons)) {
          totalLessons += module.lessons.length;
          lessonIds.push(...module.lessons.map(lesson => lesson.id));
          console.log(`  Уроки в модуле (completeLesson):`, module.lessons);
        }
      }
      
      let updatedProgress = 0;
      
      // Если нет уроков в модулях, считаем прогресс 100%
      if (totalLessons === 0) {
        updatedProgress = 100;
        console.log(`Курс ${courseId} не имеет уроков в модулях, устанавливаем прогресс 100%`);
      } else {
        // Получаем завершенные уроки пользователя (только те, которые есть в модулях)
        const completions = await DbClient.lessonCompletion.findMany({
          where: {
            course_id: courseId,
            user_id: decodedToken.id,
          },
          select: { lecture_id: true }
        });
        
        // Фильтруем только те завершения, которые соответствуют урокам в модулях
        const completedLessonIds = completions
          .map(c => c.lecture_id)
          .filter(id => lessonIds.includes(id));
        
        const doneCount = completedLessonIds.length;
        updatedProgress = Math.round((doneCount / totalLessons) * 100);
        
        console.log(`Курс ${courseId}: завершено ${doneCount}/${totalLessons} уроков из модулей`);
      }
      
      // Если прогресс достиг 100%, автоматически одобряем запись
      const shouldAutoApprove = updatedProgress >= 100 && !enrollment.approved;
      
      await DbClient.enrollment.update({
        where: { id: enrollment.id },
        data: { 
          progress: updatedProgress,
          ...(shouldAutoApprove && { approved: true })
        }
      });
      
      console.log(`Обновлен прогресс enrollment ${enrollment.id} для курса ${courseId}, пользователя ${decodedToken.id}: ${updatedProgress}%`);
      
      if (shouldAutoApprove) {
        console.log(`Запись ${enrollment.id} автоматически одобрена (прогресс 100%)`);
      }

      res.json({ 
        message: 'Lesson completed successfully',
        lessonId: lessonId,
        totalProgress: updatedProgress
      });
    } catch (error) {
      console.error('Error completing lesson:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Завершить шаг урока
  async completeStep(req, res) {
    try {
      const { courseId, lessonId, stepIndex } = req.params;
      const decodedToken = jwt.verify(req.headers.authorization.replace('Bearer ', ''), process.env.SECRET);
      const userId = decodedToken.id;
  
      console.log('=== ЗАВЕРШЕНИЕ ШАГА ===');
      console.log('Данные:', { courseId, lessonId, stepIndex, userId });
  
      // Получаем урок
      const targetLesson = await DbClient.lecture.findUnique({
        where: { id: parseInt(lessonId) },
        include: { steps: true }
      });
  
      if (!targetLesson) {
        return res.status(404).json({ message: 'Lesson not found' });
      }
  
      // Если это тестовый шаг, фиксируем попытку
      try {
        const testResult = req.body && req.body.testResult;
        console.log('Processing test result:', { testResult, lessonId, stepIndex, userId });
        
        if (testResult && typeof testResult === 'object') {
          try {
            const prev = await DbClient.testAttempt.findUnique({
              where: {
                user_id_lesson_id_step_index: {
                  user_id: userId,
                  lesson_id: parseInt(lessonId),
                  step_index: parseInt(stepIndex)
                }
              }
            });
  
            console.log('Previous attempt found:', prev);
            const attempts = (prev?.attempts || 0) + 1;
            
            console.log('Saving test attempt:', {
              userId,
              lessonId: parseInt(lessonId),
              stepIndex: parseInt(stepIndex),
              attempts,
              lastScore: Math.max(0, Math.min(100, Number(testResult.score) || 0)),
              lastPassed: !!testResult.isPassed,
              lastAnswers: testResult.answers || {}
            });
            
            // Проверяем, есть ли уже попытка для этого шага
            const existingAttempt = await DbClient.testAttempt.findUnique({
              where: {
                user_id_lesson_id_step_index: {
                  user_id: userId,
                  lesson_id: parseInt(lessonId),
                  step_index: parseInt(stepIndex)
                }
              }
            });
  
            if (existingAttempt) {
              console.log(`Обновляем существующую попытку для шага ${stepIndex} урока ${lessonId}`);
              await DbClient.testAttempt.update({
                where: {
                  user_id_lesson_id_step_index: {
                    user_id: userId,
                    lesson_id: parseInt(lessonId),
                    step_index: parseInt(stepIndex)
                  }
                },
                data: {
                  attempts,
                  lastScore: Math.max(0, Math.min(100, Number(testResult.score) || 0)),
                  lastPassed: !!testResult.isPassed,
                  lastAnswers: testResult.answers || {}
                }
              });
            } else {
              console.log(`Создаем новую попытку для шага ${stepIndex} урока ${lessonId}`);
              await DbClient.testAttempt.create({
                data: {
                  user_id: userId,
                  course_id: parseInt(courseId),
                  lesson_id: parseInt(lessonId),
                  step_index: parseInt(stepIndex),
                  attempts,
                  lastScore: Math.max(0, Math.min(100, Number(testResult.score) || 0)),
                  lastPassed: !!testResult.isPassed,
                  lastAnswers: testResult.answers || {}
                }
              });
            }
  
            // Для тестов возвращаем результат без завершения шага
            console.log(`=== РЕЗУЛЬТАТ ТЕСТА СОХРАНЕН ===`);
            console.log(`Тест пройден на ${testResult.score}%`);
            
            return res.json({ 
              lessonId: parseInt(lessonId), 
              lessonProgress: 0, 
              totalProgress: 0, 
              testAttempt: { attempts },
              message: 'Test result saved successfully',
              testResult: testResult
            });
            
          } catch (innerError) {
            console.warn('Failed to save test attempt:', innerError?.message);
            return res.status(500).json({ message: 'Failed to save test result', error: innerError.message });
          }
        }
      } catch (e) {
        console.warn('Failed to record test attempt', e?.message);
        return res.status(500).json({ message: 'Failed to process test result', error: e.message });
      }
  
      // Если это не тест, возвращаем успех без сохранения прогресса
      res.json({ 
        lessonId: parseInt(lessonId), 
        lessonProgress: 0, 
        totalProgress: 0, 
        message: 'Step processed successfully'
      });
  
    } catch (error) {
      console.error('Ошибка в completeStep:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }

  // Обновить прогресс курсов без уроков
  async updateEmptyCoursesProgress(req, res) {
    try {
      // Проверяем авторизацию
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json({ message: "Invalid authorization format" });
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const roles = decodedToken.roles;
      if (!roles || !roles.includes("ADMIN")) {
        return res.status(403).json({ message: "You don't have enough rights" });
      }

      // Находим все курсы без уроков в модулях
      const allCourses = await DbClient.course.findMany({
        select: { id: true, name: true }
      });

      const coursesWithoutLessons = [];
      
      for (const course of allCourses) {
        const meta = readSyllabusMeta(course.id);
        const modules = Array.isArray(meta.syllabus) ? meta.syllabus : [];
        
        let totalLessons = 0;
        for (const module of modules) {
          if (Array.isArray(module.lessons)) {
            totalLessons += module.lessons.length;
          }
        }
        
        if (totalLessons === 0) {
          coursesWithoutLessons.push(course);
        }
      }

      console.log(`Найдено ${coursesWithoutLessons.length} курсов без уроков в модулях`);

      // Обновляем прогресс для всех записей на эти курсы
      let updatedCount = 0;
      for (const course of coursesWithoutLessons) {
        const updated = await DbClient.enrollment.updateMany({
          where: {
            course_id: course.id
          },
          data: {
            progress: 100
          }
        });
        updatedCount += updated.count;
        console.log(`Обновлен прогресс для курса ${course.id} (${course.name}): ${updated.count} записей`);
      }

      res.json({ 
        message: `Updated progress for ${updatedCount} enrollments in ${coursesWithoutLessons.length} courses without lessons in modules`,
        coursesUpdated: coursesWithoutLessons.length,
        enrollmentsUpdated: updatedCount
      });

    } catch (error) {
      console.error('Error updating empty courses progress:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // ===== API: create new module in syllabus =====
  async createCourseModule(req, res) {
    try {
      const courseId = Number(req.params.id);
      if (!courseId || isNaN(courseId)) return res.status(400).json({ message: 'Invalid course ID' });

      // Basic admin auth check (reuse logic from updateCourseFields)
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) return res.status(401).json({ message: 'Auth header missing' });
      const [_bearer, token] = authorizationHeader.split(' ');
      let decodedToken;
      try { decodedToken = jwt.verify(token, process.env.SECRET); } catch (_) { return res.status(401).json({ message: 'Invalid token' }); }
      if (!(decodedToken.roles || []).includes('ADMIN')) return res.status(403).json({ message: "You don't have enough rights" });

      const { title, name, description = '', order = 1 } = req.body || {};
      const moduleTitle = title || name;
      if (!moduleTitle || !moduleTitle.trim()) return res.status(400).json({ message: 'Module title required' });

      // Read meta, append module
      const meta = readSyllabusMeta(courseId);
      const modulesArr = Array.isArray(meta.syllabus) ? meta.syllabus : [];
      const newId = Date.now(); // simple unique id
      const newModule = { id: newId, title: moduleTitle.trim(), description, order, lessons: [] };
      modulesArr.push(newModule);
      meta.syllabus = modulesArr;
      writeSyllabusMeta(courseId, meta);

      return res.status(201).json({ id: newId, module: newModule });
    } catch (e) {
      console.error('createCourseModule error:', e);
      return res.status(500).json({ message: 'Server error creating module' });
    }
  }

  // ===== API: add lesson inside module =====
  async addLessonToModule(req, res) {
    try {
      const courseId = Number(req.params.id);
      const moduleId = Number(req.params.moduleId);
      if (!courseId || isNaN(courseId) || !moduleId || isNaN(moduleId)) {
        return res.status(400).json({ message: 'Invalid course ID or module ID' });
      }

      // Basic admin auth check
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) return res.status(401).json({ message: 'Auth header missing' });
      const [_bearer, token] = authorizationHeader.split(' ');
      let decodedToken;
      try { decodedToken = jwt.verify(token, process.env.SECRET); } catch (_) { return res.status(401).json({ message: 'Invalid token' }); }
      if (!(decodedToken.roles || []).includes('ADMIN')) return res.status(403).json({ message: "You don't have enough rights" });

      const { name, title, content = '', videoLink = null, order = 1 } = req.body || {};
      const lessonName = name || title;
      if (!lessonName || !lessonName.trim()) return res.status(400).json({ message: 'Lesson name required' });

      const meta = readSyllabusMeta(courseId);
      const modulesArr = Array.isArray(meta.syllabus) ? meta.syllabus : [];
      const modIdx = modulesArr.findIndex(m => Number(m.id) === moduleId);
      if (modIdx === -1) return res.status(404).json({ message: 'Module not found' });

      const newLessonId = Date.now();
      const newLesson = { id: newLessonId, name: lessonName.trim(), content, videoUrl: videoLink, order };
      modulesArr[modIdx].lessons = Array.isArray(modulesArr[modIdx].lessons) ? modulesArr[modIdx].lessons : [];
      modulesArr[modIdx].lessons.push(newLesson);
      meta.syllabus = modulesArr;
      writeSyllabusMeta(courseId, meta);

      return res.status(201).json({ id: newLessonId, lesson: newLesson });
    } catch (e) {
      console.error('addLessonToModule error:', e);
      return res.status(500).json({ message: 'Server error creating lesson' });
    }
  }

  /**
   * Очистить дублирующие записи в БД (для администраторов)
   * DELETE /course/:courseId/cleanup-duplicates
   */
  async cleanupDuplicates(req, res) {
    try {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json("You are not authorized");
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json("Invalid authorization format");
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      const roles = decodedToken.roles;
      if (!roles || !roles.includes("ADMIN")) {
        return res.status(403).json("You don't have enough rights");
      }

      const courseId = Number(req.params.courseId);
      
      // Очищаем дублирующие записи stepCompletion
      const stepCompletions = await DbClient.stepCompletion.findMany({
        where: { course_id: courseId }
      });
      
      const stepCompletionGroups = {};
      stepCompletions.forEach(sc => {
        const key = `${sc.user_id}-${sc.lesson_id}-${sc.step_index}`;
        if (!stepCompletionGroups[key]) {
          stepCompletionGroups[key] = [];
        }
        stepCompletionGroups[key].push(sc);
      });
      
      let deletedStepCompletions = 0;
      for (const [key, group] of Object.entries(stepCompletionGroups)) {
        if (group.length > 1) {
          // Оставляем самую раннюю запись, удаляем остальные
          group.sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
          const toDelete = group.slice(1);
          for (const record of toDelete) {
            await DbClient.stepCompletion.delete({
              where: { id: record.id }
            });
            deletedStepCompletions++;
          }
        }
      }
      
      // Очищаем дублирующие записи lessonCompletion
      const lessonCompletions = await DbClient.lessonCompletion.findMany({
        where: { course_id: courseId }
      });
      
      const lessonCompletionGroups = {};
      lessonCompletions.forEach(lc => {
        const key = `${lc.user_id}-${lc.lecture_id}`;
        if (!lessonCompletionGroups[key]) {
          lessonCompletionGroups[key] = [];
        }
        lessonCompletionGroups[key].push(lc);
      });
      
      let deletedLessonCompletions = 0;
      for (const [key, group] of Object.entries(lessonCompletionGroups)) {
        if (group.length > 1) {
          // Оставляем самую раннюю запись, удаляем остальные
          group.sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));
          const toDelete = group.slice(1);
          for (const record of toDelete) {
            await DbClient.lessonCompletion.delete({
              where: { id: record.id }
            });
            deletedLessonCompletions++;
          }
        }
      }
      
      res.json({
        message: 'Cleanup completed',
        deletedStepCompletions,
        deletedLessonCompletions,
        totalDeleted: deletedStepCompletions + deletedLessonCompletions
      });
      
    } catch (err) {
      console.error('Error during cleanup:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

// Новый метод только для сохранения результатов тестов
async saveTestResult(req, res) {
  try {
    const { courseId, lessonId, stepIndex } = req.params;
    const { testResult } = req.body;
    
    // Проверяем токен
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token required' });
    }
    
    const decodedToken = jwt.verify(token, process.env.SECRET);
    const userId = decodedToken.id;
    
    console.log('=== СОХРАНЕНИЕ РЕЗУЛЬТАТА ТЕСТА ===');
    console.log('Данные:', { courseId, lessonId, stepIndex, userId, testResult });
    
    if (!testResult || typeof testResult !== 'object') {
      return res.status(400).json({ message: 'Invalid test result data' });
    }
    
    // Проверяем существующую попытку
    console.log('Ищем существующую попытку...');
    const existingAttempt = await DbClient.testAttempt.findUnique({
      where: {
        user_id_lesson_id_step_index: {
          user_id: userId,
          lesson_id: parseInt(lessonId),
          step_index: parseInt(stepIndex)
        }
      }
    });
    
    console.log('Найдена существующая попытка:', existingAttempt);
    
    const attempts = (existingAttempt?.attempts || 0) + 1;
    const score = Math.max(0, Math.min(100, Number(testResult.score) || 0));
    const isPassed = !!testResult.isPassed;
    const answers = testResult.answers || {};
    
    console.log('Данные для сохранения:', {
      userId,
      courseId: parseInt(courseId),
      lessonId: parseInt(lessonId),
      stepIndex: parseInt(stepIndex),
      attempts,
      score,
      isPassed,
      answers
    });
    
    if (existingAttempt) {
      console.log('Обновляем существующую попытку...');
      // Обновляем существующую попытку
      const updatedAttempt = await DbClient.testAttempt.update({
        where: {
          user_id_lesson_id_step_index: {
            user_id: userId,
            lesson_id: parseInt(lessonId),
            step_index: parseInt(stepIndex)
          }
        },
        data: {
          attempts,
          lastScore: score,
          lastPassed: isPassed,
          lastAnswers: answers
        }
      });
      
      console.log('Попытка обновлена успешно:', updatedAttempt);
      res.json({ 
        message: 'Test result saved successfully',
        attempt: updatedAttempt
      });
    } else {
      console.log('Создаем новую попытку...');
      // Создаем новую попытку
      const newAttempt = await DbClient.testAttempt.create({
        data: {
          user_id: userId,
          course_id: parseInt(courseId),
          lesson_id: parseInt(lessonId),
          step_index: parseInt(stepIndex),
          attempts,
          lastScore: score,
          lastPassed: isPassed,
          lastAnswers: answers
        }
      });
      
      console.log('Новая попытка создана успешно:', newAttempt);
      res.json({ 
        message: 'Test result saved successfully',
        attempt: newAttempt
      });
    }
    
  } catch (error) {
    console.error('Ошибка при сохранении результата теста:', error);
    console.error('Детали ошибки:', error.message);
    console.error('Стек ошибки:', error.stack);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

  async saveLessonProgress(req, res) {
    try {
      const courseId = Number(req.params.id);
      const lessonId = Number(req.params.lessonId);
      const { progress } = req.body;

      if (!courseId || isNaN(courseId) || !lessonId || isNaN(lessonId) || typeof progress !== 'number') {
        return res.status(400).json({ message: 'Invalid course ID, lesson ID or progress' });
      }

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`Сохранение прогресса урока ${lessonId}: ${progress}%`);

      // Проверяем, что курс существует
      const course = await DbClient.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Проверяем, что пользователь записан на курс
      const enrollment = await DbClient.courseEnrollment.findFirst({
        where: {
          userId: decoded.id,
          courseId: courseId
        }
      });

      if (!enrollment) {
        return res.status(403).json({ message: 'User not enrolled in this course' });
      }

      try {
        const normalizedProgress = Math.max(0, Math.min(100, Math.round(progress)));
        const result = await DbClient.moduleProgress.upsert({
          where: {
            user_id_course_id_module_key: {
              user_id: decoded.id,
              course_id: courseId,
              module_key: `lesson:${lessonId}`,
            }
          },
          update: {
            progress: normalizedProgress,
            updatedAt: new Date()
          },
          create: {
            user_id: decoded.id,
            course_id: courseId,
            module_key: `lesson:${lessonId}`,
            progress: normalizedProgress,
          }
        });

        if (normalizedProgress >= 100) {
          await DbClient.lessonCompletion.upsert({
            where: {
              user_id_lecture_id: {
                user_id: decoded.id,
                lecture_id: lessonId,
              }
            },
            update: {
              completedAt: new Date()
            },
            create: {
              user_id: decoded.id,
              course_id: courseId,
              lecture_id: lessonId,
              completedAt: new Date()
            }
          });
        }

        res.json({
          success: true,
          lessonId,
          progress: normalizedProgress,
          message: 'Прогресс урока сохранен'
        });
      } catch (error) {
        console.error('Ошибка при сохранении прогресса урока:', error);
        res.status(500).json({ message: 'Failed to save lesson progress' });
      }
    } catch (error) {
      console.error('Ошибка в saveLessonProgress:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Сохранить общий прогресс курса
  async saveCourseProgress(req, res) {
    try {
      const courseId = Number(req.params.id);
      const { progress } = req.body;
      
      if (!courseId || isNaN(courseId) || typeof progress !== 'number') {
        return res.status(400).json({ message: 'Invalid course ID or progress' });
      }

      // Проверяем авторизацию
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json({ message: "Invalid authorization format" });
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Проверяем, что курс существует
      const course = await DbClient.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Проверяем, что пользователь записан на курс
      const enrollment = await DbClient.enrollment.findFirst({
        where: {
          course_id: courseId,
          user_id: decodedToken.id
        }
      });

      if (!enrollment) {
        return res.status(403).json({ message: 'User is not enrolled in this course' });
      }

      // Сохраняем общий прогресс курса в ModuleProgress с ключом course:<courseId>
      try {
        const normalizedProgress = Math.max(0, Math.min(100, Math.round(progress)));
        
        await DbClient.moduleProgress.upsert({
          where: {
            user_id_course_id_module_key: {
              user_id: decodedToken.id,
              course_id: courseId,
              module_key: `course:${courseId}`,
            }
          },
          update: { 
            progress: normalizedProgress,
            updatedAt: new Date()
          },
          create: {
            user_id: decodedToken.id,
            course_id: courseId,
            module_key: `course:${courseId}`,
            progress: normalizedProgress,
          }
        });

        console.log(`Сохранен общий прогресс курса ${courseId}: ${normalizedProgress}%`);

        res.json({ 
          success: true, 
          courseId, 
          progress: normalizedProgress,
          message: 'Общий прогресс курса сохранен'
        });

      } catch (error) {
        console.error('Error saving course progress:', error);
        res.status(500).json({ message: 'Failed to save course progress' });
      }

    } catch (error) {
      console.error('Error in saveCourseProgress:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Сбросить весь прогресс курса для пользователя
  async resetCourseProgress(req, res) {
    try {
      const courseId = Number(req.params.id);
      
      console.log(`=== СБРОС ПРОГРЕССА КУРСА ${courseId} ===`);
      
      if (!courseId || isNaN(courseId)) {
        console.log('Недопустимый ID курса:', courseId);
        return res.status(400).json({ message: 'Invalid course ID' });
      }

      // Проверяем авторизацию
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        console.log('Отсутствует заголовок авторизации');
        return res.status(401).json({ message: "Authorization header missing" });
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        console.log('Неверный формат авторизации');
        return res.status(401).json({ message: "Invalid authorization format" });
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
        console.log('Токен валиден, пользователь ID:', decodedToken.id);
      } catch (err) {
        console.log('Неверный токен:', err.message);
        return res.status(401).json({ message: "Invalid token" });
      }

      // Проверяем, что курс существует
      const course = await DbClient.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        console.log('Курс не найден:', courseId);
        return res.status(404).json({ message: 'Course not found' });
      }

      // Проверяем, что пользователь записан на курс
      const enrollment = await DbClient.enrollment.findFirst({
        where: {
          course_id: courseId,
          user_id: decodedToken.id
        }
      });

      if (!enrollment) {
        console.log('Пользователь не записан на курс:', { userId: decodedToken.id, courseId });
        return res.status(403).json({ message: 'User is not enrolled in this course' });
      }

      console.log('Начинаем сброс прогресса курса');

      // Удаляем все завершенные шаги для этого курса
      const deletedStepCompletions = await DbClient.stepCompletion.deleteMany({
        where: {
          course_id: courseId,
          user_id: decodedToken.id
        }
      });

      // Удаляем все попытки тестов для этого курса
      const deletedTestAttempts = await DbClient.testAttempt.deleteMany({
        where: {
          course_id: courseId,
          user_id: decodedToken.id
        }
      });

      // Удаляем все завершенные уроки для этого курса
      const deletedLessonCompletions = await DbClient.lessonCompletion.deleteMany({
        where: {
          course_id: courseId,
          user_id: decodedToken.id
        }
      });

      // Удаляем все записи прогресса модулей для этого курса
      const deletedModuleProgress = await DbClient.moduleProgress.deleteMany({
        where: {
          course_id: courseId,
          user_id: decodedToken.id
        }
      });

      // Сбрасываем прогресс в записи enrollment
      await DbClient.enrollment.update({
        where: {
          id: enrollment.id
        },
        data: {
          progress: 0
        }
      });

      console.log(`Сброс прогресса завершен:`);
      console.log(`- Удалено завершенных шагов: ${deletedStepCompletions.count}`);
      console.log(`- Удалено попыток тестов: ${deletedTestAttempts.count}`);
      console.log(`- Удалено завершенных уроков: ${deletedLessonCompletions.count}`);
      console.log(`- Удалено записей прогресса модулей: ${deletedModuleProgress.count}`);
      console.log(`- Сброшен прогресс enrollment: 0%`);

      res.json({
        success: true,
        message: 'Прогресс курса полностью сброшен',
        deleted: {
          stepCompletions: deletedStepCompletions.count,
          testAttempts: deletedTestAttempts.count,
          lessonCompletions: deletedLessonCompletions.count,
          moduleProgress: deletedModuleProgress.count
        }
      });

    } catch (error) {
      console.error('Ошибка при сбросе прогресса курса:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Принудительно очистить ВСЕ stepCompletion записи для курса
  async forceCleanAllStepCompletions(req, res) {
    try {
      const courseId = Number(req.params.id);
      
      if (!courseId || isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }

      // Проверяем авторизацию
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json({ message: "Invalid authorization format" });
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Проверяем, что курс существует
      const course = await DbClient.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      console.log(`=== ПРИНУДИТЕЛЬНАЯ ОЧИСТКА ВСЕХ STEP COMPLETION ===`);
      console.log(`Курс: ${courseId}, Пользователь: ${decodedToken.id}`);

      // Удаляем ВСЕ записи stepCompletion для этого курса и пользователя
      const deletedStepCompletions = await DbClient.stepCompletion.deleteMany({
        where: {
          course_id: courseId,
          user_id: decodedToken.id
        }
      });

      console.log(`Удалено записей stepCompletion: ${deletedStepCompletions.count}`);

      // Проверяем testAttempts (они должны остаться)
      const testAttempts = await DbClient.testAttempt.findMany({
        where: {
          course_id: courseId,
          user_id: decodedToken.id
        }
      });

      console.log(`Осталось testAttempts: ${testAttempts.length}`);

      res.json({
        success: true,
        message: 'ВСЕ записи stepCompletion принудительно удалены',
        deletedStepCompletions: deletedStepCompletions.count,
        remainingTestAttempts: testAttempts.length
      });

    } catch (error) {
      console.error('Ошибка при принудительной очистке:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Очистить тестовые записи stepCompletion для курса
  async cleanTestStepCompletions(req, res) {
    try {
      const courseId = Number(req.params.id);
      
      if (!courseId || isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }

      // Проверяем авторизацию
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).json({ message: "Authorization header missing" });
      }
      
      const tokenArray = authorizationHeader.split(" ");
      if (tokenArray.length !== 2) {
        return res.status(401).json({ message: "Invalid authorization format" });
      }
      
      const token = tokenArray[1];
      let decodedToken;
      try {
        decodedToken = jwt.verify(token, process.env.SECRET);
      } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
      }

      // Проверяем, что курс существует
      const course = await DbClient.course.findUnique({
        where: { id: courseId }
      });

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      // Читаем модули курса для определения тестовых шагов
      const meta = readSyllabusMeta(courseId);
      const modules = Array.isArray(meta.syllabus) ? meta.syllabus : [];
      
      // Собираем все тестовые шаги
      const testStepIndices = new Set();
      
      for (const module of modules) {
        if (Array.isArray(module.lessons)) {
          for (const lesson of module.lessons) {
            if (Array.isArray(lesson.steps)) {
              lesson.steps.forEach((step, index) => {
                if (step.type === 'test' || step.type === 'quiz') {
                  testStepIndices.add(`${lesson.id}:${index}`);
                }
              });
            }
          }
        }
      }

      console.log(`Найдено тестовых шагов: ${testStepIndices.size}`);
      console.log('Тестовые шаги:', Array.from(testStepIndices));

      // Удаляем stepCompletion записи для тестовых шагов
      let deletedCount = 0;
      
      for (const stepKey of testStepIndices) {
        const [lessonId, stepIndex] = stepKey.split(':').map(Number);
        
        const deleted = await DbClient.stepCompletion.deleteMany({
          where: {
            course_id: courseId,
            lesson_id: lessonId,
            step_index: stepIndex,
            user_id: decodedToken.id
          }
        });
        
        deletedCount += deleted.count;
        if (deleted.count > 0) {
          console.log(`Удалена запись stepCompletion для урока ${lessonId}, шаг ${stepIndex}`);
        }
      }

      console.log(`Всего удалено записей stepCompletion для тестовых шагов: ${deletedCount}`);

      res.json({
        success: true,
        message: 'Тестовые записи stepCompletion очищены',
        deletedCount,
        testStepsFound: testStepIndices.size
      });

    } catch (error) {
      console.error('Ошибка при очистке тестовых записей:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
  async saveTestResult(req, res) {
    try {
      const { courseId, lessonId, stepIndex } = req.params;
      const { testResult } = req.body;
      
      // Проверяем токен
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'Token required' });
      }
      
      const decodedToken = jwt.verify(token, process.env.SECRET);
      const userId = decodedToken.id;
      
      console.log('=== СОХРАНЕНИЕ РЕЗУЛЬТАТА ТЕСТА ===');
      console.log('Данные:', { courseId, lessonId, stepIndex, userId, testResult });
      
      if (!testResult || typeof testResult !== 'object') {
        return res.status(400).json({ message: 'Invalid test result data' });
      }
      
      // Проверяем существующую попытку
      const existingAttempt = await DbClient.testAttempt.findUnique({
        where: {
          user_id_lesson_id_step_index: {
            user_id: userId,
            lesson_id: parseInt(lessonId),
            step_index: parseInt(stepIndex)
          }
        }
      });
      
      const attempts = (existingAttempt?.attempts || 0) + 1;
      const score = Math.max(0, Math.min(100, Number(testResult.score) || 0));
      const isPassed = !!testResult.isPassed;
      const answers = testResult.answers || {};
      
      console.log('Сохранение попытки:', {
        userId,
        courseId: parseInt(courseId),
        lessonId: parseInt(lessonId),
        stepIndex: parseInt(stepIndex),
        attempts,
        score,
        isPassed,
        answers
      });
      
      if (existingAttempt) {
        // Обновляем существующую попытку
        const updatedAttempt = await DbClient.testAttempt.update({
          where: {
            user_id_lesson_id_step_index: {
              user_id: userId,
              lesson_id: parseInt(lessonId),
              step_index: parseInt(stepIndex)
            }
          },
          data: {
            attempts,
            lastScore: score,
            lastPassed: isPassed,
            lastAnswers: answers
          }
        });
        
        console.log('Попытка обновлена:', updatedAttempt);
        res.json({ 
          message: 'Test result saved successfully',
          attempt: updatedAttempt
        });
      } else {
        // Создаем новую попытку
        const newAttempt = await DbClient.testAttempt.create({
          data: {
            user_id: userId,
            course_id: parseInt(courseId),
            lesson_id: parseInt(lessonId),
            step_index: parseInt(stepIndex),
            attempts,
            lastScore: score,
            lastPassed: isPassed,
            lastAnswers: answers
          }
        });
        
        console.log('Новая попытка создана:', newAttempt);
        res.json({ 
          message: 'Test result saved successfully',
          attempt: newAttempt
        });
      }
      
    } catch (error) {
      console.error('Ошибка при сохранении результата теста:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  }
}

module.exports = new courseController();
