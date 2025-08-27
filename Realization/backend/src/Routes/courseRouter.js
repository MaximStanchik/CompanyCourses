const Router = require("express");
const router = new Router();
const courseController = require("../Controllers/courseController");
const { check } = require("express-validator");
const roleMiddleware = require("../Middleware/roleMiddleware");
const multer = require("multer");
const path = require("path");

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../static/uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, base + '-' + unique + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Проверяем тип файла
  const allowedTypes = {
    logo: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    intro: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/quicktime'],
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/ogg', 'video/quicktime']
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
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 * 1024 // 15GB для больших видеофайлов
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

module.exports = router;
