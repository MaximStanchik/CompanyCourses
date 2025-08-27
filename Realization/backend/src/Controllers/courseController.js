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

        // Создаем массив категорий как в enrollmentController
        const categories = [];
        if (course.Category) {
          categories.push(course.Category);
        }
        if (course.courseCategories && Array.isArray(course.courseCategories)) {
          course.courseCategories.forEach(cc => {
            if (cc.category && !categories.find(c => c.id === cc.category.id)) {
              categories.push(cc.category);
            }
          });
        }

        return {
          ...course,
          enrollmentCount: course._count.enrollments,
          averageRating: ratingStats._avg.rating || 0,
          totalRatings: ratingStats._count.rating || 0,
          commentCount: commentCount,
          categories: categories
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
      if (!type || !['logo', 'intro', 'image', 'video'].includes(type)) {
        return res.status(400).json({ message: "Invalid file type. Must be 'logo', 'intro', 'image', or 'video'" });
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

      // Создаем правильный URL для загруженного файла
      const baseUrl = `https://localhost:${process.env.PORT || 3001}`;
      const fileUrl = `${baseUrl}/static/uploads/${req.file.filename}`;
      
      // Проверяем что файл действительно был создан
      const filePath = path.join(__dirname, '../../static/uploads', req.file.filename);
      if (!fs.existsSync(filePath)) {
        throw new Error('File was not created on disk');
      }
      
      console.log('File created successfully at:', filePath);
      
      // Обновляем курс с новым URL только для logo и intro
      const updateData = {};
      if (type === 'logo') {
        updateData.logoUrl = fileUrl;
      } else if (type === 'intro') {
        updateData.introUrl = fileUrl;
      }
      // Для типа 'image' не обновляем курс, так как это изображения для редактора

      let updatedCourse;
      if (type === 'logo' || type === 'intro') {
        updatedCourse = await DbClient.course.update({
          where: { id: courseId },
          data: updateData
        });
      }

      res.json({ 
        url: fileUrl, 
        filename: req.file.filename,
        message: `${type === 'logo' ? 'Logo' : type === 'intro' ? 'Intro video' : type === 'video' ? 'Video' : 'Image'} uploaded successfully` 
      });
      
      console.log('File uploaded successfully:', {
        courseId,
        type,
        fileUrl,
        filename: req.file.filename
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

      // Если модулей нет, создаем временные модули на основе лекций
      let modules = existingModules;
      if (existingModules.length === 0 && lectures.length > 0) {
        // Создаем временные модули (каждые 3 лекции = 1 модуль)
        const moduleCount = Math.ceil(lectures.length / 3);
        modules = Array.from({ length: moduleCount }, (_, index) => ({
          id: index + 1,
          title: `Module ${index + 1}`,
          description: `Auto-generated module ${index + 1}`,
          order: index + 1,
          lessons: []
        }));
      }

      // Распределяем лекции по модулям
      const lessonsByModule = {};
      lectures.forEach((lecture, index) => {
        // Если есть существующие модули, используем их структуру
        let moduleId;
        if (existingModules.length > 0) {
          // Ищем модуль, который содержит эту лекцию
          const foundModule = existingModules.find(module => 
            module.lessons && module.lessons.some(lesson => lesson.id === lecture.id)
          );
          moduleId = foundModule ? foundModule.id : Math.floor(index / 3) + 1;
        } else {
          // Используем автоматическое распределение
          moduleId = Math.floor(index / 3) + 1;
        }

        if (!lessonsByModule[moduleId]) {
          lessonsByModule[moduleId] = [];
        }

        // Отладочная информация о лекции и её шагах
        console.log(`Лекция ${lecture.id} (${lecture.name}):`, {
          id: lecture.id,
          name: lecture.name,
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
      const courseId = Number(req.params.id); // Используем id вместо courseId
      const userId = Number(req.params.userId);
      
      console.log(`=== ЗАГРУЗКА ПРОГРЕССА ПОЛЬЗОВАТЕЛЯ ===`);
      console.log(`Курс ID: ${courseId}, Пользователь ID: ${userId}`);
      console.log(`req.params:`, req.params);

      if (!courseId || isNaN(courseId) || !userId || isNaN(userId)) {
        console.log('Недопустимые параметры:', { courseId, userId });
        return res.status(400).json({ message: 'Invalid course ID or user ID' });
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
          user_id: userId
        }
      });

      if (!enrollment) {
        return res.status(403).json({ message: 'User is not enrolled in this course' });
      }

      // Получаем завершенные шаги пользователя
      const stepCompletions = await DbClient.stepCompletion.findMany({
        where: {
          user_id: userId,
          course_id: courseId,
        },
        select: { lesson_id: true, step_index: true }
      });

      // Получаем попытки тестов
      const testAttempts = await DbClient.testAttempt.findMany({
        where: {
          user_id: userId,
          course_id: courseId
        },
        select: {
          lesson_id: true,
          step_index: true,
          attempts: true,
          lastScore: true,
          lastPassed: true,
          lastAnswers: true
        }
      });

      // Получаем завершенные уроки
      const lessonCompletions = await DbClient.lessonCompletion.findMany({
        where: {
          user_id: userId,
          course_id: courseId
        },
        select: {
          lecture_id: true,
          completedAt: true
        }
      });

      // Получаем прогресс уроков из ModuleProgress
      const lessonProgresses = await DbClient.moduleProgress.findMany({
        where: {
          user_id: userId,
          course_id: courseId,
          module_key: {
            startsWith: 'lesson:'
          }
        },
        select: {
          module_key: true,
          progress: true,
          updatedAt: true
        }
      });

      // Получаем общий прогресс курса
      const courseProgress = await DbClient.moduleProgress.findFirst({
        where: {
          user_id: userId,
          course_id: courseId,
          module_key: `course:${courseId}`
        },
        select: {
          progress: true,
          updatedAt: true
        }
      });

      console.log('Данные из БД:');
      console.log('- Step completions:', stepCompletions.length);
      console.log('- Test attempts:', testAttempts.length);
      console.log('- Lesson completions:', lessonCompletions.length);
      console.log('- Lesson progresses:', lessonProgresses.length);
      console.log('- Course progress:', courseProgress);

      const progress = {
        stepCompletions: stepCompletions.map(sc => ({
          lessonId: sc.lesson_id,
          stepIndex: sc.step_index
        })),
        testAttempts: testAttempts.map(a => ({
          lessonId: a.lesson_id,
          stepIndex: a.step_index,
          attempts: a.attempts,
          lastScore: a.lastScore,
          lastPassed: a.lastPassed,
          lastAnswers: a.lastAnswers
        })),
        completedLessonIds: lessonCompletions.map(lc => lc.lecture_id),
        lessonProgresses: lessonProgresses.map(lp => ({
          lessonId: Number(lp.module_key.replace('lesson:', '')),
          progress: lp.progress,
          updatedAt: lp.updatedAt
        })),
        courseProgress: courseProgress ? {
          progress: courseProgress.progress,
          updatedAt: courseProgress.updatedAt
        } : null,
        totalProgress: courseProgress ? courseProgress.progress : 0
      };

      console.log('Отправляем прогресс:', progress);
      console.log(`=== КОНЕЦ ЗАГРУЗКИ ПРОГРЕССА ===`);

      res.json(progress);

    } catch (error) {
      console.error('Error in getUserProgress:', error);
      res.status(500).json({ message: 'Internal server error' });
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
      const courseId = Number(req.params.id);
      const lessonId = Number(req.params.lessonId);
      const stepIndex = Number(req.params.stepIndex);
      
      console.log(`=== ЗАВЕРШЕНИЕ ШАГА В BACKEND ===`);
      console.log(`Курс ID: ${courseId}, Урок ID: ${lessonId}, Шаг: ${stepIndex}`);
      console.log(`Тело запроса:`, req.body);
      console.log(`testResult:`, req.body.testResult);
      console.log(`testResult.score:`, req.body.testResult?.score);
      
      if (!courseId || isNaN(courseId) || !lessonId || isNaN(lessonId) || isNaN(stepIndex) || stepIndex < 0) {
        console.log('Недопустимые параметры:', { courseId, lessonId, stepIndex });
        return res.status(400).json({ message: 'Invalid course ID, lesson ID, or step index' });
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

      console.log('Курс и запись пользователя найдены');

      // Читаем модули курса для получения информации о шагах
      const meta = readSyllabusMeta(courseId);
      const modules = Array.isArray(meta.syllabus) ? meta.syllabus : [];
      
      // Находим урок и его шаги
      let targetLesson = null;
      let lessonModule = null;
      
      for (const module of modules) {
        if (Array.isArray(module.lessons)) {
          const lesson = module.lessons.find(l => l.id === lessonId);
          if (lesson) {
            targetLesson = lesson;
            lessonModule = module;
            break;
          }
        }
      }

      if (!targetLesson) {
        // fallback: попробуем найти урок в базе напрямую и создать заглушку steps
        const lectureDb = await DbClient.lecture.findFirst({ where: { id: lessonId, course_id: courseId } });
        if (!lectureDb) {
          return res.status(404).json({ message: 'Lesson not found' });
        }
        targetLesson = { id: lectureDb.id, steps: Array(stepIndex + 1).fill({}) };
        lessonModule = { id: 'none', lessons: [targetLesson] };
      }

      if (!Array.isArray(targetLesson.steps) || stepIndex >= targetLesson.steps.length) {
        // расширяем steps если пришёл индекс больше текущего
        if (!Array.isArray(targetLesson.steps)) targetLesson.steps = [];
        while (targetLesson.steps.length <= stepIndex) {
          targetLesson.steps.push({});
        }
      }

      // Если это тестовый шаг, фиксируем попытку
      try {
        const testResult = req.body && req.body.testResult;
        console.log('Processing test result:', { testResult, lessonId, stepIndex, userId: decodedToken.id });
        if (testResult && typeof testResult === 'object') {
          try {
            const prev = await DbClient.testAttempt.findUnique({
              where: {
                user_id_lesson_id_step_index: {
                  user_id: decodedToken.id,
                  lesson_id: lessonId,
                  step_index: stepIndex
                }
              }
            });

                      console.log('Previous attempt found:', prev);
          const attempts = (prev?.attempts || 0) + 1;
          console.log('Saving test attempt:', {
              userId: decodedToken.id,
              lessonId,
              stepIndex,
              attempts,
              lastScore: Math.max(0, Math.min(100, Number(testResult.score) || 0)),
              lastPassed: !!testResult.isPassed,
              lastAnswers: testResult.answers || {}
            });
            
            // Проверяем, есть ли уже попытка для этого шага
            const existingAttempt = await DbClient.testAttempt.findUnique({
              where: {
                user_id_lesson_id_step_index: {
                  user_id: decodedToken.id,
                  lesson_id: lessonId,
                  step_index: stepIndex
                }
              }
            });

            if (existingAttempt) {
              console.log(`Обновляем существующую попытку для шага ${stepIndex} урока ${lessonId}`);
              await DbClient.testAttempt.update({
                where: {
                  user_id_lesson_id_step_index: {
                    user_id: decodedToken.id,
                    lesson_id: lessonId,
                    step_index: stepIndex
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
                  user_id: decodedToken.id,
                  course_id: courseId,
                  lesson_id: lessonId,
                  step_index: stepIndex,
                  attempts,
                  lastScore: Math.max(0, Math.min(100, Number(testResult.score) || 0)),
                  lastPassed: !!testResult.isPassed,
                  lastAnswers: testResult.answers || {}
                }
              });
            }
          } catch (innerError) {
            console.warn('Failed to upsert test attempt:', innerError?.message);
          }

          // Для тестов отмечаем шаг как завершенный только если результат 100%
          if (testResult.score >= 100) {
            console.log(`Тест пройден на 100%, отмечаем шаг как завершенный`);
          } else {
            console.log(`=== ТЕСТ НЕ ПРОЙДЕН НА 100% ===`);
            console.log(`Тест пройден на ${testResult.score}%, шаг НЕ завершен`);
            console.log(`Возвращаем ответ без завершения шага`);
            // Возвращаем ответ с информацией о попытке, но без завершения шага
            return res.json({ 
              lessonId, 
              lessonProgress: 0, 
              totalProgress: 0, 
              testAttempt: { attempts },
              message: 'Тест не пройден на 100%',
              testResult: testResult
            });
          }
        }
      } catch (e) {
        console.warn('Failed to record test attempt', e?.message);
      }

      // Проверяем тип шага
      const currentStep = targetLesson.steps[stepIndex];
      const stepType = currentStep?.type || 'text';
      console.log(`Тип шага ${stepIndex}: ${stepType}`);

      // Для тестовых шагов НЕ создаем stepCompletion записи
      if (stepType === 'test' || stepType === 'quiz') {
        console.log(`=== ТЕСТОВЫЙ ШАГ - НЕ СОЗДАЕМ STEP COMPLETION ===`);
        console.log(`Шаг ${stepIndex} является тестовым (${stepType}), пропускаем создание stepCompletion`);
      } else {
        // Проверяем, не был ли шаг уже завершен (только для нетекстовых шагов)
        const existingStepCompletion = await DbClient.stepCompletion.findUnique({
          where: {
            user_id_lesson_id_step_index: {
              user_id: decodedToken.id,
              lesson_id: lessonId,
              step_index: stepIndex,
            }
          }
        });

        if (existingStepCompletion) {
          console.log(`=== ШАГ УЖЕ ЗАВЕРШЕН ===`);
          console.log(`Шаг ${stepIndex} урока ${lessonId} уже был завершен в ${existingStepCompletion.completedAt}`);
          console.log(`Это может быть причиной неправильного прогресса!`);
          // Возвращаем существующий прогресс без создания новой записи
        } else {
          console.log(`=== СОЗДАЕМ НОВУЮ ЗАПИСЬ ===`);
          console.log(`Создаем новую запись о завершении шага ${stepIndex} урока ${lessonId}`);
          // Фиксируем завершение шага в БД (только для нетекстовых шагов)
          await DbClient.stepCompletion.create({
            data: {
              user_id: decodedToken.id,
              course_id: courseId,
              lesson_id: lessonId,
              step_index: stepIndex,
              completedAt: new Date(),
            }
          });
        }
      }

      // Подсчитываем прогресс урока
      const totalSteps = targetLesson.steps.length;
      const completedSteps = await DbClient.stepCompletion.count({
        where: {
          user_id: decodedToken.id,
          lesson_id: lessonId,
        }
      });

      const lessonProgress = Math.round((completedSteps / totalSteps) * 100);
      const lessonCompleted = lessonProgress >= 100;

      // Сохраняем прогресс урока как snapshot в ModuleProgress c ключом lesson:<lessonId>
      try {
        // Проверяем существующий прогресс модуля
        const existingModuleProgress = await DbClient.moduleProgress.findUnique({
          where: {
            user_id_course_id_module_key: {
              user_id: decodedToken.id,
              course_id: courseId,
              module_key: `lesson:${lessonId}`,
            }
          }
        });

        if (existingModuleProgress) {
          console.log(`Обновляем прогресс модуля lesson:${lessonId} с ${existingModuleProgress.progress}% до ${lessonProgress}%`);
          await DbClient.moduleProgress.update({
            where: {
              user_id_course_id_module_key: {
                user_id: decodedToken.id,
                course_id: courseId,
                module_key: `lesson:${lessonId}`,
              }
            },
            data: { progress: lessonProgress }
          });
        } else {
          console.log(`Создаем новый прогресс модуля lesson:${lessonId}: ${lessonProgress}%`);
          await DbClient.moduleProgress.create({
            data: {
              user_id: decodedToken.id,
              course_id: courseId,
              module_key: `lesson:${lessonId}`,
              progress: lessonProgress,
            }
          });
        }

        console.log(`Прогресс урока ${lessonId} сохранен: ${lessonProgress}%`);
      } catch (error) {
        console.error('Ошибка при сохранении прогресса модуля:', error);
      }

      // Если урок полностью завершен, отмечаем его как завершенный
      if (lessonCompleted) {
        console.log(`Урок ${lessonId} полностью завершен, отмечаем как завершенный`);
        try {
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
          console.log(`Урок ${lessonId} отмечен как завершенный`);
        } catch (error) {
          console.error('Ошибка при отметке урока как завершенного:', error);
        }
      }

      console.log(`=== КОНЕЦ ЗАВЕРШЕНИЯ ШАГА ===`);
      console.log(`Шаг ${stepIndex} урока ${lessonId} успешно завершен`);
      console.log(`Прогресс урока: ${lessonProgress}%`);
      console.log(`Урок завершен: ${lessonCompleted}`);

      res.json({ 
        lessonId, 
        lessonProgress, 
        totalProgress: 0, 
        message: 'Шаг успешно завершен',
        stepCompleted: true
      });

    } catch (error) {
      console.error('Ошибка в completeStep:', error);
      res.status(500).json({ message: 'Internal server error' });
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

  // Сохранить прогресс урока
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
}

module.exports = new courseController();
