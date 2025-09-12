const Router = require("express");
const router = new Router();
const courseController = require("../Controllers/courseController");
const { check } = require("express-validator");
const roleMiddleware = require("../Middleware/roleMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require('fs');

// Настройка multer для временного хранения файлов в памяти
const fileFilter = (req, file, cb) => {
  // Проверяем тип файла
  const allowedTypes = {
    logo: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    intro: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/quicktime'],
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/ogg', 'video/quicktime'],
    file: [] // Пустой массив для типа 'file' - разрешаем все файлы
  };
  
  const fileType = req.query.type;
  
  // Логируем информацию о файле для отладки
  console.log('File upload attempt:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    requestedType: fileType
  });
  
  // Если тип файла не указан, разрешаем все файлы
  if (!fileType) {
    console.log('No file type specified, allowing all files');
    return cb(null, true);
  }
  
  // Если тип файла не поддерживается, возвращаем ошибку
  if (!allowedTypes[fileType]) {
    console.log(`Unsupported file type requested: ${fileType}`);
    return cb(new Error(`Unsupported file type: ${fileType}`), false);
  }
  
  // Для типа 'file' разрешаем все файлы
  if (fileType === 'file') {
    console.log(`File type 'file' allows all files. Accepting: ${file.originalname}`);
    return cb(null, true);
  }
  
  // Проверяем MIME-тип
  if (allowedTypes[fileType].includes(file.mimetype)) {
    console.log(`File type validation passed by MIME type for ${fileType}: ${file.mimetype}`);
    return cb(null, true);
  }
  
  // Если MIME-тип не совпадает, проверяем расширение файла как fallback
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = {
    logo: ['.jpg', '.jpeg', '.png', '.gif'],
    intro: ['.mp4', '.avi', '.mov', '.wmv'],
    image: ['.jpg', '.jpeg', '.png', '.gif'],
    video: ['.mp4', '.avi', '.mov', '.wmv', '.webm', '.ogg']
  };
  
  if (allowedExtensions[fileType] && allowedExtensions[fileType].includes(fileExtension)) {
    console.log(`File type validation passed by extension for ${fileType}: ${fileExtension}`);
    return cb(null, true);
  }
  
  // Если ни MIME-тип, ни расширение не подходят, возвращаем ошибку
  const allowedTypesList = allowedTypes[fileType].join(', ');
  const allowedExtensionsList = allowedExtensions[fileType].join(', ');
  console.log(`File type validation failed for ${fileType}. MIME: ${file.mimetype}, Extension: ${fileExtension}`);
  cb(new Error(`Invalid file type. Allowed MIME types for ${fileType}: ${allowedTypesList}. Allowed extensions: ${allowedExtensionsList}`), false);
};

const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadsDir = path.join(__dirname, '../../static/uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 * 1024 // 50GB для больших видеофайлов
  }
});

router.post("/course/add", courseController.addCourse);
router.get("/courses", courseController.getAllCourses);
router.get("/courses/public", courseController.getPublicCourses);
router.get("/course/", courseController.getCourseById);
router.get("/course/:id", courseController.getCourseById); // Новый роут для получения курса по ID в URL
router.delete("/course/", courseController.deleteCourse);
router.delete("/course/deleteByCategory/:id", courseController.deleteCoursesByCategory);
router.put("/course/", courseController.updateCourse);
router.patch("/courses/:id", courseController.renameCourse.bind(courseController));
router.patch("/course/update/:id", courseController.updateCourseFields.bind(courseController));
router.patch("/course/:id/status", courseController.updateCourseStatus.bind(courseController));
router.post("/courses/:id/upload", upload.single('file'), courseController.uploadFile.bind(courseController));

// Новые роуты для модулей и уроков
router.get("/course/:id/modules", courseController.getCourseModules.bind(courseController));
router.get("/course/:id/syllabus", courseController.getCourseSyllabus.bind(courseController));
router.get("/course/:id/full-syllabus", courseController.getFullSyllabus.bind(courseController));
router.get("/course/:id/lessons", courseController.getCourseLessons);
router.get("/course/:id/progress/:userId", courseController.getUserProgress);
router.post("/course/:id/lesson/:lessonId/complete", courseController.completeLesson);
router.post("/course/:id/lesson/:lessonId/step/:stepIndex/complete", courseController.completeStep);
router.post("/course/:id/lesson/:lessonId/progress", courseController.saveLessonProgress);
router.post("/course/:id/progress", courseController.saveCourseProgress);
router.post("/course/:id/modules", courseController.createCourseModule.bind(courseController));
router.delete("/course/:id/modules/:moduleId", courseController.deleteCourseModule.bind(courseController));
router.delete("/modules/:moduleId", courseController.deleteCourseModule.bind(courseController));
//router.put("/course/:id/modules/:moduleId", courseController.updateCourseModule.bind(courseController));
router.post("/course/:id/modules/:moduleId/lessons", courseController.addLessonToModule.bind(courseController));

// Админский маршрут для обновления прогресса курсов без уроков
router.post("/courses/update-empty-progress", courseController.updateEmptyCoursesProgress);

// Админский маршрут для очистки дублирующих записей
router.delete("/course/:courseId/cleanup-duplicates", courseController.cleanupDuplicates);

// Маршрут для сброса прогресса курса
router.delete("/course/:id/reset-progress", courseController.resetCourseProgress);

// Маршрут для очистки тестовых записей stepCompletion
router.delete("/course/:id/clean-test-completions", courseController.cleanTestStepCompletions);

// Маршрут для принудительной очистки ВСЕХ stepCompletion записей
router.delete("/course/:id/force-clean-all", courseController.forceCleanAllStepCompletions);

router.post("/course/:courseId/lesson/:lessonId/step/:stepIndex/test-result", courseController.saveTestResult);

module.exports = router;
