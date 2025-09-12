const express = require('express');
const router = express.Router();
const { getFileUrl, BUCKETS } = require('../utils/minioClient');

// Middleware для логирования всех запросов к MinIO роутеру
router.use((req, res, next) => {
  console.log('🔍 MinIO Router - Incoming request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    params: req.params,
    query: req.query,
    headers: req.headers
  });
  next();
});

// Тестовый endpoint для проверки прокси
router.get('/test', (req, res) => {
  console.log('✅ Test endpoint hit!');
  res.json({ 
    message: 'MinIO router is working!',
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      headers: req.headers
    }
  });
});

// Роут для получения файлов из MinIO
router.get('/file/:bucket/:filename', async (req, res) => {
  try {
    let { bucket, filename } = req.params;
    
    // Проверяем, что бакет разрешен
    const allowedBuckets = Object.values(BUCKETS);
    if (!allowedBuckets.includes(bucket)) {
      return res.status(403).json({ error: 'Access denied to this bucket' });
    }
    
    // Декодируем имя файла если оно закодировано
    try {
      filename = decodeURIComponent(filename);
      console.log('🔤 Decoded filename:', filename);
    } catch (error) {
      console.warn('Failed to decode filename:', error);
    }
    
    // Проверяем существование файла
    const { fileExists, downloadFile } = require('../utils/minioClient');
    const exists = await fileExists(bucket, filename);
    
    if (!exists) {
      console.error('❌ File not found in MinIO:', filename);
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Скачиваем файл из MinIO
    const fileBuffer = await downloadFile(bucket, filename);
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
    else if (filename.endsWith('.pdf')) contentType = 'application/pdf';
    else if (filename.endsWith('.doc') || filename.endsWith('.docx')) contentType = 'application/msword';
    else if (filename.endsWith('.xls') || filename.endsWith('.xlsx')) contentType = 'application/vnd.ms-excel';
    else if (filename.endsWith('.ppt') || filename.endsWith('.pptx')) contentType = 'application/vnd.ms-powerpoint';
    else if (filename.endsWith('.zip') || filename.endsWith('.rar')) contentType = 'application/zip';
    else if (filename.endsWith('.txt')) contentType = 'text/plain';
    
         // Устанавливаем правильные заголовки
     res.set({
       'Content-Type': contentType,
       'Content-Length': fileBuffer.length,
       'Accept-Ranges': 'bytes',
       'Cache-Control': 'public, max-age=3600'
     });
     
     // Для изображений убираем Content-Disposition, чтобы они открывались в браузере
     if (contentType.startsWith('image/')) {
       console.log('🖼️ Image file detected, will open in browser');
     } else {
       // Для остальных файлов добавляем заголовок скачивания
       res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
     }
    
    // Для изображений убираем Content-Disposition, чтобы они открывались в браузере
    if (contentType.startsWith('image/')) {
      console.log('🖼️ Image file detected, will open in browser');
    } else {
      // Для остальных файлов добавляем заголовок скачивания
      res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    }
    
    console.log('📋 Sending file directly instead of redirecting to MinIO');
    console.log('📋 Content-Type:', contentType);
    console.log('📋 File size:', fileBuffer.length);
    
    // Отправляем файл напрямую вместо перенаправления
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Error getting file from MinIO:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// Роут для получения загруженных файлов (uploads)
router.get('/file/uploads/:filename', async (req, res) => {
  try {
    let { filename } = req.params;
    console.log('📹 MinIO request for upload file:', filename);
    console.log('📹 Request headers:', req.headers);
    console.log('📹 Bucket:', BUCKETS.UPLOADS);
    
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
    console.log('📹 File exists in MinIO:', exists);
    
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
    
    console.log('📹 Content-Type determined:', contentType);
    
    // Добавляем заголовки для правильного воспроизведения
    res.set({
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600'
    });
    
    console.log('📹 Sending file directly instead of redirecting to MinIO');
    console.log('📹 Content-Type:', contentType);
    console.log('📹 File size:', fileBuffer.length);
    
    // Отправляем файл напрямую вместо перенаправления
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('❌ Error getting uploaded file from MinIO:', error);
    console.error('📹 Failed filename:', req.params.filename);
    console.error('📹 Error details:', error.message);
    res.status(500).json({ error: 'Failed to get uploaded file' });
  }
});

// Роут для получения файлов курсов (course-files)
router.get('/file/course-files/:filename', async (req, res) => {
  try {
    let { filename } = req.params;
    console.log('📹 MinIO request for course file:', filename);
    console.log('📹 Request headers:', req.headers);
    
    // Декодируем имя файла если оно закодировано
    try {
      filename = decodeURIComponent(filename);
      console.log('🔤 Decoded filename:', filename);
    } catch (error) {
      console.warn('Failed to decode filename:', error);
    }
    
    // Проверяем существование файла
    const { fileExists } = require('../utils/minioClient');
    const exists = await fileExists(BUCKETS.COURSE_FILES, filename);
    console.log('📹 File exists in MinIO:', exists);
    
    if (!exists) {
      console.error('❌ File not found in MinIO:', filename);
      return res.status(404).json({ error: 'File not found in MinIO' });
    }
    
    const fileUrl = await getFileUrl(BUCKETS.COURSE_FILES, filename, 3600);
    console.log('✅ MinIO URL generated:', fileUrl);
    
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
    
    // Добавляем заголовки для правильного воспроизведения
    res.set({
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600'
    });
    
    res.redirect(fileUrl);
  } catch (error) {
    console.error('❌ Error getting course file from MinIO:', error);
    console.error('📹 Failed filename:', req.params.filename);
    res.status(404).json({ error: 'Course file not found' });
  }
});

// Роут для скачивания файлов курсов (course-files)
router.get('/download/course-files/:filename', async (req, res) => {
  try {
    let { filename } = req.params;
    const downloadName = req.query.downloadName ? decodeURIComponent(req.query.downloadName) : filename;
    console.log('📥 Download request for course file:', filename, 'Download name:', downloadName);
    console.log('📥 Request details:', {
      method: req.method,
      url: req.url,
      path: req.path,
      params: req.params,
      query: req.query,
      headers: req.headers
    });
    
    // Декодируем имя файла если оно закодировано
    try {
      filename = decodeURIComponent(filename);
      console.log('🔤 Decoded filename:', filename);
    } catch (error) {
      console.warn('Failed to decode filename:', error);
    }
    
    // Проверяем существование файла
    const { fileExists, downloadFile } = require('../utils/minioClient');
    const exists = await fileExists(BUCKETS.COURSE_FILES, filename);
    console.log('📥 File exists in MinIO:', exists);
    
    if (!exists) {
      console.error('❌ File not found in MinIO:', filename);
      return res.status(404).json({ error: 'File not found in MinIO' });
    }
    
    // Скачиваем файл из MinIO
    const fileBuffer = await downloadFile(BUCKETS.COURSE_FILES, filename);
    console.log('✅ File downloaded from MinIO, size:', fileBuffer.length);
    console.log('📊 File buffer type:', typeof fileBuffer);
    console.log('📊 File buffer is Buffer:', Buffer.isBuffer(fileBuffer));
    console.log('📊 File buffer length:', fileBuffer.length);
    
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
      'Content-Length': fileBuffer.length,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
    
    // Для изображений убираем Content-Disposition, чтобы они открывались в браузере
    if (contentType.startsWith('image/')) {
      console.log('🖼️ Course image file detected, will open in browser');
    } else {
      // Для остальных файлов добавляем заголовок скачивания
      res.set('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`);
    }
    
    console.log('📋 Response headers set:', {
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length
    });
    
    // Отправляем файл
    res.send(fileBuffer);
    console.log('✅ File sent successfully with Content-Type:', contentType);
    
  } catch (error) {
    console.error('❌ Error downloading course file from MinIO:', error);
    console.error('📥 Failed filename:', req.params.filename);
    res.status(500).json({ error: 'Failed to download course file' });
  }
});

// Роут для получения аватаров
router.get('/avatar/:filename', async (req, res) => {
  try {
    let { filename } = req.params;
    
    // Декодируем имя файла если оно закодировано
    try {
      filename = decodeURIComponent(filename);
      console.log('🔤 Decoded avatar filename:', filename);
    } catch (error) {
      console.warn('Failed to decode avatar filename:', error);
    }
    
    // Загружаем файл напрямую из MinIO
    const { downloadFile } = require('../utils/minioClient');
    const fileBuffer = await downloadFile(BUCKETS.AVATARS, filename);
    
    // Определяем Content-Type на основе расширения файла
    const ext = filename.split('.').pop().toLowerCase();
    let contentType = 'image/jpeg'; // по умолчанию
    
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'gif') contentType = 'image/gif';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'svg') contentType = 'image/svg+xml';
    
    // Устанавливаем заголовки
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=3600'); // кэшируем на 1 час
    
    // Отправляем файл
    res.send(fileBuffer);
    console.log(`✅ Avatar sent successfully: ${filename}, Content-Type: ${contentType}, Size: ${fileBuffer.length} bytes`);
    
  } catch (error) {
    console.error('Error getting avatar from MinIO:', error);
    res.status(404).json({ error: 'Avatar not found' });
  }
});

// Роут для получения файлов курсов
router.get('/course/:filename', async (req, res) => {
  try {
    let { filename } = req.params;
    
    // Декодируем имя файла если оно закодировано
    try {
      filename = decodeURIComponent(filename);
      console.log('🔤 Decoded course filename:', filename);
    } catch (error) {
      console.warn('Failed to decode course filename:', error);
    }
    
    const fileUrl = await getFileUrl(BUCKETS.COURSE_FILES, filename, 3600);
    res.redirect(fileUrl);
  } catch (error) {
    console.error('Error getting course file from MinIO:', error);
    res.status(404).json({ error: 'Course file not found' });
  }
});

// Роут для проверки существования файла в разных бакетах
router.get('/check-file/:filename', async (req, res) => {
  try {
    let { filename } = req.params;
    console.log('🔍 Проверяем существование файла:', filename);
    
    // Декодируем имя файла если оно закодировано
    try {
      filename = decodeURIComponent(filename);
      console.log('🔤 Decoded filename for check:', filename);
    } catch (error) {
      console.warn('Failed to decode filename for check:', error);
    }
    
    const { fileExists } = require('../utils/minioClient');
    
    // Проверяем в бакете uploads
    const existsInUploads = await fileExists(BUCKETS.UPLOADS, filename);
    console.log('📁 Файл в uploads:', existsInUploads);
    
    // Проверяем в бакете course-files
    const existsInCourseFiles = await fileExists(BUCKETS.COURSE_FILES, filename);
    console.log('📁 Файл в course-files:', existsInCourseFiles);
    
    res.json({
      filename,
      existsInUploads,
      existsInCourseFiles,
      suggestedBucket: existsInUploads ? 'uploads' : existsInCourseFiles ? 'course-files' : 'not-found'
    });
  } catch (error) {
    console.error('❌ Ошибка при проверке файла:', error);
    res.status(500).json({ error: 'Failed to check file' });
  }
});

module.exports = router; 