const multer = require("multer");
const path = require("path");
const { uploadFile, BUCKETS } = require('../utils/minioClient');

// Настройка multer для временного хранения файлов в памяти
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 50 * 1024 * 1024 * 1024 // 50GB для больших видеофайлов
  },
}).single("video");

// Функция, возвращающая относительный путь
const uploadVideo = async (req) => {
  return new Promise((resolve, reject) => {
    upload(req, null, async (err) => {
      if (err) {
        console.error("Multer error:", err);
        return reject(err);
      }

      if (!req.file) {
        return resolve(null);
      }

      try {
        // Загружаем видео в MinIO
        const fileName = `video-${Date.now()}${path.extname(req.file.originalname)}`;
        
        console.log('📤 Uploading video to MinIO:', {
          bucket: BUCKETS.UPLOADS,
          fileName,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });
        
        const videoPath = await uploadFile(BUCKETS.UPLOADS, fileName, req.file.buffer, req.file.mimetype);
        console.log("✅ File uploaded successfully to MinIO:", videoPath);
        resolve(videoPath);
      } catch (uploadError) {
        console.error("❌ MinIO upload error:", uploadError);
        reject(uploadError);
      }
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
