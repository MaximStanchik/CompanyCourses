const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Убедимся, что папка static существует
const videoStoragePath = path.join(__dirname, "../../static");
if (!fs.existsSync(videoStoragePath)) {
  fs.mkdirSync(videoStoragePath, { recursive: true });
}

// Настройка multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, videoStoragePath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 100 }, // 100MB
}).single("video");

// Функция, возвращающая относительный путь
const uploadVideo = (req) => {
  return new Promise((resolve, reject) => {
    upload(req, null, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return reject(err);
      }

      if (!req.file) {
        return reject(new Error("No file uploaded"));
      }

      const relativePath = `/static/${req.file.filename}`;
      console.log("File uploaded successfully:", relativePath);
      resolve(relativePath);
    });
  });
};

// Обработчик маршрута
const uploadVideoHandler = async (req, res) => {
  try {
    const videoLink = await uploadVideo(req);
    res.status(201).json({ videoLink });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};

// 👇 ОБЯЗАТЕЛЬНО экспортируй оба
module.exports = {
  uploadVideo,
  uploadVideoHandler,
};
