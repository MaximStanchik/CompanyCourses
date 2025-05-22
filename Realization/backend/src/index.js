require("dotenv").config({ path: "D:/User/Documents/GitHub/CompanyCourses/Realization/backend/.env" });
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const { initWS } = require("./ws/websocket.js");

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

// Создаем CORS middleware для обработки с учетом учетных данных
const corsOptions = {
  origin: "https://localhost:3000",  // точный домен, с которого разрешены запросы
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,  // включаем поддержку cookies и авторизационных заголовков
};

// Применяем CORS middleware
app.use(cors(corsOptions));

// Использование других middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// Путь к директории со статическими файлами
const staticPath = path.resolve(__dirname, "../static"); // на уровень выше
console.log("Путь к static: " + staticPath);
app.use('/static', express.static(staticPath));

app.use("/static", express.static(staticPath, {
  setHeaders: (res, path) => {
    if (path.endsWith(".mp4")) {
      res.set("Content-Type", "video/mp4");
    }
  }
}));

const authRouter = require("./Routes/authRouter");
const categoryRouter = require("./Routes/categoryRouter");
const courseRouter = require("./Routes/courseRouter");
const lectureRouter = require("./Routes/lectureRouter");
const videoRouter = require("./Routes/videoRouter");
const enrollmentRouter = require("./Routes/enrollmentRouter");
const profileRouter = require("./Routes/profileRouter");
const notificationRouter = require("./Routes/notificationRouter");

app.use("/auth", authRouter);
app.use(categoryRouter);
app.use(courseRouter);
app.use(lectureRouter);
app.use(videoRouter);
app.use(enrollmentRouter);
app.use("/profile", profileRouter);
app.use(profileRouter);
app.use(notificationRouter);

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
