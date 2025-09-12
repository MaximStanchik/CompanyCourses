const Minio = require('minio');

// MinIO конфигурация
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9075,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: 'Maxim',
  secretKey: '1337R1337R'
});

// Внешний адрес MinIO для генерации presigned URL
const EXTERNAL_MINIO_ENDPOINT = process.env.MINIO_EXTERNAL_ENDPOINT || 'localhost';
const EXTERNAL_MINIO_PORT = parseInt(process.env.MINIO_EXTERNAL_PORT) || 9075;

// Имена бакетов
const BUCKETS = {
  AVATARS: 'avatars',
  UPLOADS: 'uploads',
  COURSE_FILES: 'course-files',
  LESSON_FILES: 'lesson-files'
};

// Функция для инициализации бакетов
const initializeBuckets = async () => {
  try {
    for (const bucketName of Object.values(BUCKETS)) {
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName, 'us-east-1');
        console.log(`Bucket '${bucketName}' created successfully`);
      }
    }
    console.log('All MinIO buckets initialized');
  } catch (error) {
    console.error('Error initializing MinIO buckets:', error);
  }
};

// Функция для загрузки файла
const uploadFile = async (bucketName, objectName, fileBuffer, contentType = 'application/octet-stream') => {
  try {
    console.log(`📤 Uploading file to MinIO: ${bucketName}/${objectName}`);
    console.log(`📤 Content-Type: ${contentType}`);
    console.log(`📤 File size: ${fileBuffer.length} bytes`);
    
    await minioClient.putObject(bucketName, objectName, fileBuffer, {
      'Content-Type': contentType
    });
    
    console.log(`✅ File uploaded successfully: ${bucketName}/${objectName}`);
    return `${bucketName}/${objectName}`;
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    console.error(`Failed for: ${bucketName}/${objectName}`);
    throw error;
  }
};

// Функция для загрузки файла с прогрессом и возможностью отмены
const uploadFileWithProgress = async (bucketName, objectName, fileBuffer, contentType = 'application/octet-stream', onProgress = null, abortSignal = null) => {
  try {
    console.log(`📤 Uploading file to MinIO with progress: ${bucketName}/${objectName}`);
    console.log(`📤 Content-Type: ${contentType}`);
    console.log(`📤 File size: ${fileBuffer.length} bytes`);
    
    // Проверяем сигнал отмены
    if (abortSignal && abortSignal.aborted) {
      throw new Error('Upload cancelled');
    }
    
    // Показываем уведомление для больших файлов
    const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
    if (fileBuffer.length > 100 * 1024 * 1024) { // Больше 100MB
      console.log(`🚀 MinIO: Начинаем загрузку БОЛЬШОГО файла в ${bucketName}:`);
      console.log(`   📁 Имя: ${objectName}`);
      console.log(`   📊 Размер: ${fileSizeMB} MB`);
      console.log(`   🔗 Bucket: ${bucketName}`);
      console.log(`   ⏰ Время начала: ${new Date().toLocaleString()}`);
    }
    
    // Разбиваем файл на чанки для отслеживания прогресса
    const chunkSize = 1024 * 1024; // 1MB чанки
    const totalChunks = Math.ceil(fileBuffer.length / chunkSize);
    let uploadedChunks = 0;
    
    console.log(`📊 Разбиваем файл на ${totalChunks} чанков по ${chunkSize / (1024 * 1024)} MB`);
    
    // Создаем массив чанков для загрузки
    const chunks = [];
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fileBuffer.length);
      const chunk = fileBuffer.slice(start, end);
      chunks.push(chunk);
    }
    
    // Загружаем файл по частям
    for (let i = 0; i < chunks.length; i++) {
      // Проверяем сигнал отмены перед каждым чанком
      if (abortSignal && abortSignal.aborted) {
        throw new Error('Upload cancelled');
      }
      
      uploadedChunks++;
      
      // Вызываем callback прогресса
      if (onProgress) {
        const progress = uploadedChunks / totalChunks;
        onProgress(progress);
        
        // Логируем прогресс для больших файлов
        if (fileBuffer.length > 100 * 1024 * 1024 && i % 10 === 0) {
          console.log(`📈 MinIO прогресс: ${Math.round(progress * 100)}% (чанк ${uploadedChunks}/${totalChunks})`);
        }
      }
      
      // Небольшая задержка для имитации реальной загрузки
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    console.log(`📤 Отправляем файл в MinIO bucket: ${bucketName}`);
    
    // Загружаем в MinIO используя Buffer напрямую
    await minioClient.putObject(bucketName, objectName, fileBuffer, {
      'Content-Type': contentType
    });
    
    if (fileBuffer.length > 100 * 1024 * 1024) {
      console.log(`✅ MinIO: БОЛЬШОЙ файл ${objectName} успешно загружен в ${bucketName}!`);
      console.log(`   📊 Размер: ${fileSizeMB} MB`);
      console.log(`   🔗 Путь: ${bucketName}/${objectName}`);
    } else {
      console.log(`✅ File uploaded successfully with progress: ${bucketName}/${objectName}`);
    }
    
    return `${bucketName}/${objectName}`;
  } catch (error) {
    console.error('Error uploading file to MinIO with progress:', error);
    console.error(`Failed for: ${bucketName}/${objectName}`);
    throw error;
  }
};

// Функция для получения URL файла
const getFileUrl = async (bucketName, objectName, expirySeconds = 604800) => {
  try {
    console.log(`🔗 Generating MinIO URL for: ${bucketName}/${objectName}`);
    
    // Генерируем presigned URL с внутренним адресом
    const internalUrl = await minioClient.presignedGetObject(bucketName, objectName, expirySeconds);
    
    // Заменяем внутренний адрес на внешний
    const externalUrl = internalUrl.replace(
      new RegExp(`http://${process.env.MINIO_ENDPOINT || 'minio'}:${process.env.MINIO_PORT || 9000}`),
      `http://${EXTERNAL_MINIO_ENDPOINT}:${EXTERNAL_MINIO_PORT}`
    );
    
    console.log(`✅ MinIO URL generated: ${externalUrl}`);
    return externalUrl;
  } catch (error) {
    console.error('Error generating file URL:', error);
    console.error(`Failed for: ${bucketName}/${objectName}`);
    throw error;
  }
};

// Функция для удаления файла
const deleteFile = async (bucketName, objectName) => {
  try {
    await minioClient.removeObject(bucketName, objectName);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
    throw error;
  }
};

// Функция для проверки существования файла
const fileExists = async (bucketName, objectName) => {
  try {
    await minioClient.statObject(bucketName, objectName);
    return true;
  } catch (error) {
    return false;
  }
};

// Функция для скачивания файла
const downloadFile = async (bucketName, objectName) => {
  try {
    console.log(`📥 Downloading file from MinIO: ${bucketName}/${objectName}`);
    
    // Получаем объект как stream
    const dataStream = await minioClient.getObject(bucketName, objectName);
    
    // Конвертируем stream в Buffer
    return new Promise((resolve, reject) => {
      const chunks = [];
      dataStream.on('data', (chunk) => chunks.push(chunk));
      dataStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`✅ File downloaded successfully, size: ${buffer.length} bytes`);
        resolve(buffer);
      });
      dataStream.on('error', (error) => {
        console.error(`❌ Error downloading file: ${error.message}`);
        reject(error);
      });
    });
  } catch (error) {
    console.error(`❌ Error downloading file from MinIO: ${error.message}`);
    throw error;
  }
};

module.exports = {
  minioClient,
  BUCKETS,
  initializeBuckets,
  uploadFile,
  uploadFileWithProgress,
  getFileUrl,
  deleteFile,
  fileExists,
  downloadFile
}; 