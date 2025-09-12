const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileController = require('../Controllers/fileController');
const { getFileUrl, BUCKETS } = require('../utils/minioClient');

// Настройка multer для временного хранения файлов в памяти
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 * 1024 } // 50GB для больших файлов
});

// Хранилище для отслеживания загрузок
const uploads = new Map();

// Middleware для отслеживания прогресса загрузки
const uploadWithProgress = (req, res, next) => {
  const uploadId = Date.now().toString();
  req.uploadId = uploadId;
  
  // Создаем объект для отслеживания загрузки
  uploads.set(uploadId, {
    status: 'uploading',
    progress: 0,
    fileName: '',
    fileSize: 0,
    startTime: Date.now(),
    abortController: null
  });
  
  // Очищаем старые записи (старше 1 часа)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, upload] of uploads.entries()) {
    if (upload.startTime < oneHourAgo) {
      uploads.delete(id);
    }
  }
  
  next();
};

router.post('/upload', uploadWithProgress, upload.single('file'), fileController.uploadFile);

// Новый endpoint для загрузки с прогрессом
router.post('/upload-with-progress', uploadWithProgress, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const uploadId = req.uploadId;
    const uploadInfo = uploads.get(uploadId);
    
    if (!uploadInfo) {
      return res.status(400).json({ error: 'Upload session not found' });
    }
    
    const file = req.file;
    const fileName = `upload-${Date.now()}-${file.originalname}`;
    
    // Показываем уведомление для больших файлов
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    if (file.size > 100 * 1024 * 1024) { // Больше 100MB
      console.log(`🚀 Начинаем загрузку БОЛЬШОГО файла:`);
      console.log(`   📁 Имя: ${file.originalname}`);
      console.log(`   📊 Размер: ${fileSizeMB} MB`);
      console.log(`   🔗 Upload ID: ${uploadId}`);
      console.log(`   ⏰ Время начала: ${new Date().toLocaleString()}`);
    } else {
      console.log(`📤 Начинаем загрузку файла: ${file.originalname} (${fileSizeMB} MB)`);
    }
    
    // Обновляем информацию о файле
    uploadInfo.fileName = fileName;
    uploadInfo.fileSize = file.size;
    uploadInfo.progress = 10; // Начало загрузки в MinIO
    
    // Создаем AbortController для возможности отмены
    const abortController = new AbortController();
    uploadInfo.abortController = abortController;
    
    try {
      // Загружаем файл в MinIO
      const { uploadFileWithProgress } = require('../utils/minioClient');
      const fileUrl = await uploadFileWithProgress(
        BUCKETS.UPLOADS, 
        fileName, 
        file.buffer, 
        file.mimetype,
        (progress) => {
          // Обновляем прогресс (от 10% до 90%)
          uploadInfo.progress = 10 + Math.floor(progress * 0.8);
          
          // Логируем прогресс для больших файлов
          if (file.size > 100 * 1024 * 1024 && progress % 0.1 < 0.01) {
            console.log(`📈 Прогресс загрузки ${file.originalname}: ${Math.round(progress * 100)}%`);
          }
        },
        abortController.signal
      );
      
      // Загрузка завершена
      uploadInfo.status = 'completed';
      uploadInfo.progress = 100;
      
      if (file.size > 100 * 1024 * 1024) {
        console.log(`✅ БОЛЬШОЙ файл ${file.originalname} успешно загружен!`);
        console.log(`   🔗 URL: ${fileUrl}`);
        console.log(`   ⏱️  Время загрузки: ${((Date.now() - uploadInfo.startTime) / 1000).toFixed(2)}с`);
      }
      
      res.json({
        uploadId,
        url: fileUrl,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        status: 'completed'
      });
      
    } catch (error) {
      if (error.name === 'AbortError') {
        uploadInfo.status = 'cancelled';
        console.log(`❌ Загрузка файла ${file.originalname} отменена пользователем`);
        res.status(499).json({ error: 'Upload cancelled', uploadId });
      } else {
        uploadInfo.status = 'error';
        uploadInfo.error = error.message;
        console.error(`❌ Ошибка загрузки файла ${file.originalname}:`, error.message);
        res.status(500).json({ error: 'Failed to upload file', uploadId });
      }
    }
    
  } catch (error) {
    console.error('Error in upload-with-progress:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Endpoint для получения статуса загрузки
router.get('/upload-status/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const uploadInfo = uploads.get(uploadId);
  
  if (!uploadInfo) {
    return res.status(404).json({ error: 'Upload not found' });
  }
  
  res.json({
    uploadId,
    status: uploadInfo.status,
    progress: uploadInfo.progress,
    fileName: uploadInfo.fileName,
    fileSize: uploadInfo.fileSize,
    startTime: uploadInfo.startTime,
    error: uploadInfo.error
  });
});

// Endpoint для отмены загрузки
router.delete('/upload/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const uploadInfo = uploads.get(uploadId);
  
  if (!uploadInfo) {
    return res.status(404).json({ error: 'Upload not found' });
  }
  
  if (uploadInfo.abortController) {
    uploadInfo.abortController.abort();
  }
  
  uploadInfo.status = 'cancelled';
  res.json({ message: 'Upload cancelled', uploadId });
});

router.get('/download/:filename', async (req, res) => {
  try {
    let filename = req.params.filename;
    const originalName = req.query.name ? decodeURIComponent(req.query.name) : filename;
    
    console.log('=== File Download Request ===');
    console.log('Filename:', filename);
    console.log('Original name:', originalName);
    
    // Декодируем имя файла если оно закодировано
    try {
      filename = decodeURIComponent(filename);
      console.log('🔤 Decoded filename:', filename);
    } catch (error) {
      console.warn('Failed to decode filename:', error);
    }
    
    // Вместо перенаправления на MinIO, скачиваем файл через наш backend
    const { fileExists, downloadFile } = require('../utils/minioClient');
    const exists = await fileExists(BUCKETS.UPLOADS, filename);
    
    if (!exists) {
      console.error('❌ File not found in MinIO:', filename);
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Скачиваем файл из MinIO
    const fileBuffer = await downloadFile(BUCKETS.UPLOADS, filename);
    console.log('✅ File downloaded from MinIO, size:', fileBuffer.length);
    
    // Определяем Content-Type на основе расширения файла
    let contentType = 'application/octet-stream';
    if (filename.endsWith('.mp4')) contentType = 'video/mp4';
    else if (filename.endsWith('.webm')) contentType = 'video/webm';
    else if (filename.endsWith('.avi')) contentType = 'video/avi';
    else if (filename.endsWith('.mov')) contentType = 'video/quicktime';
    else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (filename.endsWith('.png')) contentType = 'image/png';
    else if (filename.endsWith('.gif')) contentType = 'image/gif';
    else if (filename.endsWith('.webp')) contentType = 'image/webp';
    else if (filename.endsWith('.svg')) contentType = 'image/svg+xml';
    else if (filename.endsWith('.pdf')) contentType = 'application/pdf';
    else if (filename.endsWith('.doc')) contentType = 'application/msword';
    else if (filename.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (filename.endsWith('.xls')) contentType = 'application/vnd.ms-excel';
    else if (filename.endsWith('.xlsx')) contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (filename.endsWith('.ppt')) contentType = 'application/vnd.ms-powerpoint';
    else if (filename.endsWith('.pptx')) contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    else if (filename.endsWith('.zip')) contentType = 'application/zip';
    else if (filename.endsWith('.rar')) contentType = 'application/x-rar-compressed';
    else if (filename.endsWith('.7z')) contentType = 'application/x-7z-compressed';
    else if (filename.endsWith('.txt')) contentType = 'text/plain';
    else if (filename.endsWith('.rtf')) contentType = 'application/rtf';
    
    // Устанавливаем правильные заголовки для скачивания
    const encodedFilename = encodeURIComponent(originalName);
    const safeFilename = originalName.replace(/[^\x00-\x7F]/g, ''); // Убираем не-ASCII символы
    
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
      'Content-Length': fileBuffer.length,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
    
    console.log('📋 Sending file directly instead of redirecting to MinIO');
    console.log('📋 Content-Type:', contentType);
    console.log('📋 File size:', fileBuffer.length);
    
    // Отправляем файл напрямую
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Error downloading file from MinIO:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Новый endpoint для прямого скачивания файлов
router.get('/download-direct/:filename', async (req, res) => {
  try {
    let filename = req.params.filename;
    const downloadName = req.query.downloadName ? decodeURIComponent(req.query.downloadName) : filename;
    
    console.log('📥 Direct download request for file:', filename, 'Download name:', downloadName);
    
    // Декодируем имя файла если оно закодировано
    try {
      filename = decodeURIComponent(filename);
      console.log('🔤 Decoded filename:', filename);
    } catch (error) {
      console.warn('Failed to decode filename:', error);
    }
    
    // Проверяем существование файла
    const { fileExists, downloadFile } = require('../utils/minioClient');
    const exists = await fileExists(BUCKETS.UPLOADS, filename);
    console.log('📥 File exists in MinIO:', exists);
    
    if (!exists) {
      console.error('❌ File not found in MinIO:', filename);
      return res.status(404).json({ error: 'File not found in MinIO' });
    }
    
    // Скачиваем файл из MinIO
    const fileBuffer = await downloadFile(BUCKETS.UPLOADS, filename);
    console.log('✅ File downloaded from MinIO, size:', fileBuffer.length);
    
    // Определяем Content-Type на основе расширения файла
    let contentType = 'application/octet-stream';
    if (filename.endsWith('.mp4')) contentType = 'video/mp4';
    else if (filename.endsWith('.webm')) contentType = 'video/webm';
    else if (filename.endsWith('.avi')) contentType = 'video/avi';
    else if (filename.endsWith('.mov')) contentType = 'video/quicktime';
    else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (filename.endsWith('.png')) contentType = 'image/png';
    else if (filename.endsWith('.gif')) contentType = 'image/gif';
    else if (filename.endsWith('.webp')) contentType = 'image/webp';
    else if (filename.endsWith('.svg')) contentType = 'image/svg+xml';
    else if (filename.endsWith('.pdf')) contentType = 'application/pdf';
    else if (filename.endsWith('.doc')) contentType = 'application/msword';
    else if (filename.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (filename.endsWith('.xls')) contentType = 'application/vnd.ms-excel';
    else if (filename.endsWith('.xlsx')) contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (filename.endsWith('.ppt')) contentType = 'application/vnd.ms-powerpoint';
    else if (filename.endsWith('.pptx')) contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    else if (filename.endsWith('.zip')) contentType = 'application/zip';
    else if (filename.endsWith('.rar')) contentType = 'application/x-rar-compressed';
    else if (filename.endsWith('.7z')) contentType = 'application/x-7z-compressed';
    else if (filename.endsWith('.txt')) contentType = 'text/plain';
    else if (filename.endsWith('.rtf')) contentType = 'application/rtf';
    
    console.log('🔍 Filename extension:', filename.split('.').pop());
    console.log('🔍 Determined Content-Type:', contentType);
    
    // Устанавливаем правильные заголовки для скачивания
    // Кодируем имя файла для безопасного использования в заголовках
    const encodedFilename = encodeURIComponent(downloadName);
    const safeFilename = downloadName.replace(/[^\x00-\x7F]/g, ''); // Убираем не-ASCII символы
    
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
      'Content-Length': fileBuffer.length,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
    
    console.log('📋 Response headers set:', {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
      'Content-Length': fileBuffer.length
    });
    
    // Отправляем файл
    res.send(fileBuffer);
    console.log('✅ File sent successfully with Content-Type:', contentType);
    
  } catch (error) {
    console.error('❌ Error downloading file from MinIO:', error);
    console.error('📥 Failed filename:', req.params.filename);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

module.exports = router; 