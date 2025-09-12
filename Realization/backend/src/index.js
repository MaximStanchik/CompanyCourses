require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const { initWS } = require("./ws/websocket.js");
const { passport } = require('./config/passport');
const multer = require('multer');
const { initializeBuckets } = require('./utils/minioClient');

console.log("Private Key Path:", process.env.PRIVATE_KEY_PATH);
console.log("Primary Cert Path:", process.env.PRIMARY_CERT_PATH);

// Проверяем, есть ли SSL сертификаты
let useHttps = false;
let httpsOptions = {};

if (process.env.PRIVATE_KEY_PATH && process.env.PRIMARY_CERT_PATH) {
  try {
    var key = fs.readFileSync(process.env.PRIVATE_KEY_PATH, "utf8");
    var cert = fs.readFileSync(process.env.PRIMARY_CERT_PATH, "utf8");
    httpsOptions = {
      key: key,
      cert: cert,
    };
    useHttps = true;
    console.log("SSL certificates loaded successfully");
  } catch (error) {
    console.log("SSL certificates not found, using HTTP");
  }
} else {
  console.log("SSL certificates not configured, using HTTP");
}

// Создание приложения express
const app = express();
app.set('trust proxy', true);

// Создаем CORS middleware для обработки с учетом учетных данных
const corsOptions = {
  origin: process.env.NODE_ENV === 'development' 
    ? ["http://localhost:3000", "https://localhost:3000"]  // разрешаем и HTTP и HTTPS в dev
    : "https://localhost:3000",  // только HTTPS в prod
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,  // включаем поддержку cookies и авторизационных заголовков
};

// Применяем CORS middleware
app.use(cors(corsOptions));

// Использование других middleware
app.use(bodyParser.urlencoded({ extended: false, limit: '100mb' }));
app.use(express.json({ limit: '100mb' }));
app.use(passport.initialize());

// Настройка сервера для обслуживания статических файлов из папки public
app.use('/assets', express.static(path.join(__dirname, '..', 'frontend', 'public', 'assets')));

// Подключение роутеров
const authRouter = require("./Routes/authRouter");
const categoryRouter = require("./Routes/categoryRouter");
const courseRouter = require("./Routes/courseRouter");
const lectureRouter = require("./Routes/lectureRouter");
const videoRouter = require("./Routes/videoRouter");
const enrollmentRouter = require("./Routes/enrollmentRouter");
const profileRouter = require("./Routes/profileRouter");
const notificationRouter = require("./Routes/notificationRouter");
const supportRouter = require('./Routes/supportRouter');
const emailRouter = require('./Routes/email');
const chatRouter = require('./Routes/chatRouter');
const reactionRouter = require('./Routes/reactionRouter');
const fileRouter = require('./Routes/fileRouter');
const favoriteRouter = require("./Routes/favoriteRouter");
const lessonRouter = require("./Routes/lessonRouter");
const studentsRouter = require("./Routes/studentsRouter");
const courseRatingRouter = require("./Routes/courseRatingRouter");
const courseCommentRouter = require("./Routes/courseCommentRouter");
const minioRouter = require("./Routes/minioRouter");

app.use("/auth", authRouter);
app.use(categoryRouter);
app.use(courseRouter);
app.use(lectureRouter);
app.use(videoRouter);
app.use(enrollmentRouter);
app.use(studentsRouter);
app.use("/profile", profileRouter);
app.use(notificationRouter);
app.use('/api/support', supportRouter);
app.use('/api', emailRouter);
app.use('/api/chats', chatRouter);
app.use('/api/reactions', reactionRouter);
app.use('/api/files', fileRouter);
app.use(favoriteRouter);
app.use(lessonRouter);
app.use(courseRatingRouter);
app.use(courseCommentRouter);
app.use('/api/minio', minioRouter);

// Middleware для обработки ошибок multer
app.use((error, req, res, next) => {
  console.error('Error middleware caught:', error);
  
  if (error instanceof multer.MulterError) {
    let message = 'Upload error occurred';
    let statusCode = 400;
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum size is 15GB';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in multipart form';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields in form';
        break;
      default:
        message = `Upload error: ${error.message}`;
    }
    
    return res.status(statusCode).json({ 
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({ 
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
  
  next(error);
});

// Создание и запуск сервера (HTTPS или HTTP)
let server;

if (useHttps) {
  const https = require("https");
  server = https.createServer(httpsOptions, app);
  console.log("Starting HTTPS server...");
} else {
  const http = require("http");
  server = http.createServer(app);
  console.log("Starting HTTP server...");
}

server.listen(process.env.PORT, async () => {
  console.log(`Server started on port: ${process.env.PORT}`);
  
  // Инициализируем MinIO бакеты
  try {
    await initializeBuckets();
    console.log('MinIO buckets initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MinIO buckets:', error);
  }
  
  // Запускаем миграцию видео URL (только один раз при запуске)
  try {
    const { migrateVideoUrls } = require('./utils/migrateVideoUrls');
    await migrateVideoUrls();
  } catch (error) {
    console.error('Failed to migrate video URLs:', error);
  }
});

app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});
  
// Инициализация WebSocket сервера
const wsServer = initWS(server);

// Общий обработчик ошибок
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  // Определяем тип ошибки и отправляем соответствующее сообщение
  let message = 'Internal server error';
  let statusCode = 500;
  
  if (error.code === 'ENOENT') {
    message = 'File or directory not found';
    statusCode = 404;
  } else if (error.code === 'EACCES') {
    message = 'Permission denied';
    statusCode = 403;
  } else if (error.code === 'ENOSPC') {
    message = 'No space left on device';
    statusCode = 507;
  } else if (error.name === 'ValidationError') {
    message = 'Validation error';
    statusCode = 400;
  } else if (error.name === 'CastError') {
    message = 'Invalid data format';
    statusCode = 400;
  }
  
  res.status(statusCode).json({ 
    message,
    error: process.env.NODE_ENV === 'development' ? {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    } : undefined
  });
});
