const { PrismaClient } = require("@prisma/client");
const DbClient = new PrismaClient();
const { uploadVideo } = require("./videoController.js");
const jwt = require("jsonwebtoken");
const NotificationService = require('../utils/notificationService');

class lectureController {
  async addLecture(req, res) {
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
      if (!roles.includes("ADMIN")) {
        return res.status(403).json("You don't have enough rights");
      }

      // ⬇️ Пытаемся загрузить видео (необязательно)
      let videoLink = null;
      try {
        videoLink = await uploadVideo(req);
      } catch (e) {
        if (e && e.message === 'No file uploaded') {
          videoLink = null; // Видео не загружено — продолжаем без него
        } else {
          throw e;
        }
      }

      const course = await DbClient.course.findFirst({
        where: { name: req.body.course },
      });

      if (!course) {
        return res.status(400).json("This course doesn't exist");
      }

      const existingLecture = await DbClient.lecture.findFirst({
        where: {
          name: req.body.name,
          course_id: course.id,
        },
      });

      if (existingLecture) {
        return res
          .status(409)
          .json("Lecture with this name already exists in this course");
      }

      const upload = await DbClient.lecture.create({
        data: {
          name: req.body.name,
          content: req.body.content,
          videoLink, // ✅ сохраняем относительный путь или null
          Course: {
            connect: {
              id: course.id,
            },
          },
        },
      });

      // Отправляем уведомления пользователям курса
      try {
        const adminUser = await DbClient.user.findUnique({ where: { id: decodedToken.id } });
        await NotificationService.notifyCourseLessonAdded(
          course.id, 
          req.body.name, 
          adminUser.username || 'Администратор'
        );
      } catch (notificationError) {
        console.error('Ошибка при отправке уведомления:', notificationError);
        // Не прерываем выполнение, если уведомление не отправилось
      }

      res.status(201).json({ upload });
    } catch (error) {
      console.error(error);
      res.status(500).json("Server error");
    }
  }

  async getAllLectures(req, res) {
    try {
      const courseId = req.query.id;
      
      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }
      
      if (isNaN(Number(courseId))) {
        return res.status(400).json({ message: "Invalid course ID format" });
      }
      
      console.log(`Attempting to fetch lectures for course ID: ${courseId}`);
      
      let lectures;
      try {
        lectures = await DbClient.lecture.findMany({
          where: { course_id: Number(courseId) },
          include: {
            Course: {
              select: {
                description: true,
              },
            },
          },
        });
      } catch (dbError) {
        console.error('Database error in getAllLectures:', dbError);
        return res.status(500).json({ 
          message: "Database connection error", 
          error: process.env.NODE_ENV === 'development' ? dbError.message : 'Database error'
        });
      }

      // Проверяем, что lectures является массивом
      if (!Array.isArray(lectures)) {
        console.error('Database returned non-array for lectures:', typeof lectures, lectures);
        return res.status(500).json({ message: "Database returned invalid data format" });
      }

      console.log(`Found ${lectures.length} lectures for course ${courseId}`);
      
      if (lectures.length === 0) {
        console.log('No lectures found for this course');
        return res.json([]);
      }
      
      // Логируем структуру первой лекции для отладки
      if (lectures.length > 0) {
        console.log('Sample lecture structure:', JSON.stringify(lectures[0], null, 2));
      }
      
      // ✅ Преобразуем путь к видео в формат, подходящий для фронта
      const lecturesWithPublicVideoLink = lectures.map((lecture) => {
        try {
          // Проверяем, что лекция существует и имеет необходимые поля
          if (!lecture || typeof lecture !== 'object') {
            console.warn('Invalid lecture object:', lecture);
            return null;
          }
          
          if (!lecture.id || !lecture.name) {
            console.warn(`Lecture ${lecture.id} is missing required fields:`, lecture);
            return null;
          }
          
          console.log(`Processing lecture ${lecture.id}: videoLink =`, lecture.videoLink);
          
          let processedVideoLink = null;
          if (lecture.videoLink && typeof lecture.videoLink === 'string') {
            // Возвращаем только имя файла
            processedVideoLink = lecture.videoLink.split('/').pop();
          }
          
          return {
            id: lecture.id,
            name: lecture.name,
            content: lecture.content || '',
            course_id: lecture.course_id,
            videoLink: processedVideoLink,
            Course: lecture.Course || null
          };
        } catch (error) {
          console.error(`Error processing lecture ${lecture?.id || 'unknown'}:`, error);
          // Возвращаем null для некорректных лекций
          return null;
        }
      }).filter(lecture => lecture !== null); // Убираем null значения
      
      console.log(`Successfully processed ${lecturesWithPublicVideoLink.length} lectures`);
      
      res.json(lecturesWithPublicVideoLink);
    } 
    catch (err) {
      console.error('Error in getAllLectures:', err);
      res.status(500).json({ 
        message: "Internal server error", 
        error: process.env.NODE_ENV === 'development' ? err.message : 'Unknown error'
      });
    }
  }
}

module.exports = new lectureController();
