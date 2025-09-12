// Утилиты для работы с MinIO URL

// Функция для получения URL аватара
export const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  
  let fileName = avatarPath;
  if (avatarPath.includes('/')) {
    fileName = avatarPath.split('/').pop();
  }
  
  // Декодируем имя файла если оно закодировано
  try {
    fileName = decodeURIComponent(fileName);
    console.log('🔤 Decoded filename in getAvatarUrl:', fileName);
  } catch (error) {
    console.warn('Failed to decode filename in getAvatarUrl:', error);
  }
  
  return `https://localhost:9000/api/minio/avatar/${encodeURIComponent(fileName)}`;
};

export const getCourseFileUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) {
    // Если это полный URL с static/uploads, извлекаем имя файла
    if (filePath.includes('static/uploads/')) {
      const fileName = filePath.split('static/uploads/').pop();
      return `https://localhost:3000/api/minio/file/course-files/${fileName}`;
    }
    return filePath;
  }
  
  let fileName = filePath;
  if (filePath.includes('/')) {
    fileName = filePath.split('/').pop();
  }
  
  // Декодируем имя файла если оно закодировано
  try {
    fileName = decodeURIComponent(fileName);
    console.log('�� Decoded filename in getCourseFileUrl:', fileName);
  } catch (error) {
    console.warn('Failed to decode filename in getCourseFileUrl:', error);
  }
  
  // Всегда используем localhost:3000 для консистентности
  return `https://localhost:3000/api/minio/file/course-files/${encodeURIComponent(fileName)}`;
};

// Функция для получения URL загруженного файла
export const getUploadFileUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  
  let fileName = filePath;
  if (filePath.includes('/')) {
    fileName = filePath.split('/').pop();
  }
  
  // Декодируем имя файла если оно закодировано
  try {
    fileName = decodeURIComponent(fileName);
    console.log('🔤 Decoded filename in getUploadFileUrl:', fileName);
  } catch (error) {
    console.warn('Failed to decode filename in getUploadFileUrl:', error);
  }
  
  return `https://localhost:3000/api/minio/file/uploads/${encodeURIComponent(fileName)}`;
};

// Функция для получения прямого URL для скачивания файлов из MinIO
export const getMinioDownloadUrl = (filePath) => {
  if (!filePath) return null;
  
  // Если это полный URL, возвращаем как есть
  if (filePath.startsWith('http')) return filePath;
  
  // Определяем бакет и имя файла
  let bucket = 'uploads';
  let fileName = filePath;
  
  if (filePath.includes('/')) {
    const parts = filePath.split('/');
    bucket = parts[0];
    fileName = parts.slice(1).join('/');
  }
  
  // Проверяем, что бакет валидный
  const validBuckets = ['uploads', 'course-files', 'avatars', 'lesson-files'];
  if (!validBuckets.includes(bucket)) {
    console.warn('Invalid bucket:', bucket, 'using uploads as default');
    bucket = 'uploads';
  }
  
  // Декодируем имя файла если оно закодировано
  try {
    fileName = decodeURIComponent(fileName);
    console.log('🔤 Decoded filename in getMinioDownloadUrl:', fileName);
  } catch (error) {
    console.warn('Failed to decode filename in getMinioDownloadUrl:', error);
  }
  
  // Возвращаем прямой URL для скачивания через frontend прокси
  const result = `https://localhost:3000/api/minio/file/${bucket}/${encodeURIComponent(fileName)}`;
  console.log('📥 Generated MinIO download URL:', result);
  return result;
};

export const getVideoUrl = (videoPath) => {
  console.log('🎬 getVideoUrl called with:', videoPath);
  
  if (!videoPath) {
    console.log('❌ No video path provided');
    return null;
  }
  
  // Исправляем кодировку кириллических символов
  let decodedPath = videoPath;
  try {
    if (videoPath.includes('%')) {
      decodedPath = decodeURIComponent(videoPath);
      console.log('🔤 Decoded path:', decodedPath);
    }
  } catch (error) {
    console.warn('Failed to decode path:', error);
    decodedPath = videoPath;
  }
  
  if (decodedPath.startsWith('http')) {
    // Если это полный URL с static/uploads, извлекаем имя файла
    if (decodedPath.includes('static/uploads/')) {
      const fileName = decodedPath.split('static/uploads/').pop();
      const result = `https://localhost:3000/api/minio/file/uploads/${fileName}`;
      console.log('🔄 Converted static/uploads URL to:', result);
      return result;
    }
    console.log('🌐 Returning external URL:', decodedPath);
    return decodedPath;
  }
  
  // Если это MinIO URL (начинается с /api/minio/file/), возвращаем как есть
  if (decodedPath.startsWith('/api/minio/file/')) {
    const result = `https://localhost:3000${decodedPath}`;
    console.log('🔗 MinIO URL detected, returning:', result);
    return result;
  }
  
  // Определяем бакет на основе имени файла
  let bucket = 'uploads';
  let fileName = decodedPath;
  
  if (decodedPath.includes('/')) {
    fileName = decodedPath.split('/').pop();
  }
  
  // Проверяем паттерны для course-files
  if (fileName.match(/^course-\d+-(intro|logo|image|video)-/) || 
      fileName.match(/^(intro|logo|image|video)-/)) {
    bucket = 'course-files';
    console.log('📁 Detected course file, using course-files bucket');
  } else {
    console.log(' Detected upload file, using uploads bucket');
  }
  
  const result = `https://localhost:3000/api/minio/file/${bucket}/${encodeURIComponent(fileName)}`;
  console.log(' Using filename:', fileName);
  console.log('🔗 Generated MinIO URL:', result);
  return result;
};