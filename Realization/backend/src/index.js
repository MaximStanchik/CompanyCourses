require("dotenv").config({ path: "D:/User/Documents/GitHub/CompanyCourses/Realization/backend/.env" });
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const { initWS } = require("./ws/websocket.js");
const { passport } = require('./config/passport');
const multer = require('multer');

console.log("Private Key Path:", process.env.PRIVATE_KEY_PATH);
console.log("Primary Cert Path:", process.env.PRIMARY_CERT_PATH);

var key = fs.readFileSync(process.env.PRIVATE_KEY_PATH, "utf8");
var cert = fs.readFileSync(process.env.PRIMARY_CERT_PATH, "utf8");

var options = {
  key: key,
  cert: cert,
};

var https = require("https");

// Создание приложения express
const app = express();
app.set('trust proxy', true);

// Создаем CORS middleware для обработки с учетом учетных данных
const corsOptions = {
  origin: "https://localhost:3000",  // точный домен, с которого разрешены запросы
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,  // включаем поддержку cookies и авторизационных заголовков
};

// Применяем CORS middleware
app.use(cors(corsOptions));

// Использование других middleware
app.use(bodyParser.urlencoded({ extended: false, limit: '5mb' }));
app.use(express.json({ limit: '5mb' }));
app.use(passport.initialize());

// Путь к директории со статическими файлами
const staticPath = path.resolve(__dirname, "../static"); // на уровень выше
console.log("Путь к static: " + staticPath);

// Проверяем и создаем папку uploads если она не существует
const uploadsPath = path.join(staticPath, "uploads");
if (!fs.existsSync(uploadsPath)) {
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log("Создана папка uploads:", uploadsPath);
  } catch (err) {
    console.error("Ошибка при создании папки uploads:", err);
  }
} else {
  console.log("Папка uploads уже существует:", uploadsPath);
}

// Проверяем права на запись в папку uploads
try {
  fs.accessSync(uploadsPath, fs.constants.W_OK);
  console.log("Права на запись в папку uploads подтверждены");
} catch (err) {
  console.error("Нет прав на запись в папку uploads:", err);
}

// Настройка статики для всех файлов
app.use('/static', express.static(staticPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.set('Content-Type', 'video/mp4');
    } else if (filePath.endsWith('.webm')) {
      res.set('Content-Type', 'video/webm');
    } else if (filePath.endsWith('.ogg') || filePath.endsWith('.ogv')) {
      res.set('Content-Type', 'video/ogg');
    } else if (filePath.endsWith('.mov') || filePath.endsWith('.qt')) {
      // QuickTime MOV
      res.set('Content-Type', 'video/quicktime');
    } else if (filePath.endsWith('.mkv')) {
      // MKV может не поддерживаться нативно, но зададим общий тип
      res.set('Content-Type', 'video/x-matroska');
    }
    // Включаем поддержу диапазонных запросов для потокового воспроизведения
    res.set('Accept-Ranges', 'bytes');
  }
}));

// Фоллбек: обслуживаем прямые запросы к изображениям без префикса /static
app.get(/^\/[^\/]+\.(png|jpg|jpeg|gif|webp|svg)$/i, (req, res, next) => {
  const requested = req.path.replace(/^\//, '');
  const candidate = path.join(staticPath, requested);
  fs.access(candidate, fs.constants.R_OK, (err) => {
    if (err) return next();
    res.sendFile(candidate);
  });
});

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

// Настройка сервера для обслуживания статических файлов из папки public
app.use('/assets', express.static(path.join(__dirname, '..', 'frontend', 'public', 'assets')));

// Создание и запуск HTTPS сервера
const httpsServer = https
  .createServer(options, app)
  .listen(process.env.PORT, () => {
    console.log(`Server started on port: ${process.env.PORT}`);
  });

app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});
  
// Инициализация WebSocket сервера
const wsServer = initWS(httpsServer);

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
