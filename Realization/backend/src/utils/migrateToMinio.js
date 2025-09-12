const fs = require('fs');
const path = require('path');
const { uploadFile, BUCKETS, initializeBuckets } = require('./minioClient');

// Функция для рекурсивного обхода папки
const walkDir = (dir) => {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
};

// Функция для определения бакета по пути файла
const getBucketForFile = (filePath) => {
  const relativePath = path.relative(path.join(__dirname, '../../static'), filePath);
  
  if (relativePath.startsWith('avatar')) {
    return BUCKETS.AVATARS;
  } else if (relativePath.startsWith('uploads')) {
    return BUCKETS.UPLOADS;
  } else if (relativePath.startsWith('course-meta')) {
    return BUCKETS.COURSE_FILES;
  } else {
    // Для остальных файлов используем uploads
    return BUCKETS.UPLOADS;
  }
};

// Функция для получения имени файла в MinIO
const getMinioFileName = (filePath) => {
  const relativePath = path.relative(path.join(__dirname, '../../static'), filePath);
  return relativePath.replace(/\\/g, '/'); // Заменяем обратные слеши на прямые
};

// Основная функция миграции
const migrateToMinio = async () => {
  try {
    console.log('🚀 Начинаем миграцию файлов в MinIO...');
    
    // Инициализируем бакеты
    await initializeBuckets();
    console.log('✅ Бакеты MinIO инициализированы');
    
    const staticPath = path.join(__dirname, '../../static');
    
    // Проверяем существование папки static
    if (!fs.existsSync(staticPath)) {
      console.log('❌ Папка static не найдена');
      return;
    }
    
    console.log(`📁 Найдена папка static: ${staticPath}`);
    
    // Получаем все файлы из папки static
    const files = walkDir(staticPath);
    console.log(`📄 Найдено файлов для миграции: ${files.length}`);
    
    if (files.length === 0) {
      console.log('✅ Папка static пуста, миграция не требуется');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // Мигрируем каждый файл
    for (const filePath of files) {
      try {
        const fileName = path.basename(filePath);
        const bucket = getBucketForFile(filePath);
        const minioFileName = getMinioFileName(filePath);
        
        console.log(`📤 Мигрируем: ${fileName} -> ${bucket}/${minioFileName}`);
        
        // Читаем файл
        const fileBuffer = fs.readFileSync(filePath);
        
        // Определяем MIME-тип
        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'application/octet-stream';
        
        if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
        else if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.mp4') mimeType = 'video/mp4';
        else if (ext === '.webm') mimeType = 'video/webm';
        else if (ext === '.avi') mimeType = 'video/avi';
        else if (ext === '.mov') mimeType = 'video/quicktime';
        else if (ext === '.pdf') mimeType = 'application/pdf';
        else if (ext === '.json') mimeType = 'application/json';
        else if (ext === '.txt') mimeType = 'text/plain';
        
        // Загружаем в MinIO
        await uploadFile(bucket, minioFileName, fileBuffer, mimeType);
        
        successCount++;
        console.log(`✅ Успешно: ${fileName}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Ошибка при миграции ${path.basename(filePath)}:`, error.message);
      }
    }
    
    console.log('\n📊 Результаты миграции:');
    console.log(`✅ Успешно мигрировано: ${successCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Миграция завершена успешно!');
      console.log('💡 Теперь можно удалить папку static');
    }
    
  } catch (error) {
    console.error('💥 Критическая ошибка при миграции:', error);
  }
};

// Экспортируем функцию для использования в других модулях
module.exports = { migrateToMinio };

// Если скрипт запущен напрямую
if (require.main === module) {
  migrateToMinio();
} 