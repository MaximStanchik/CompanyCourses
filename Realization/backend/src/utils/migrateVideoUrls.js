const { PrismaClient } = require('@prisma/client');
const DbClient = new PrismaClient();

// Функция для преобразования старого URL в новый MinIO URL
const convertToMinioUrl = (oldUrl) => {
  if (!oldUrl) return null;
  
  // Если это уже MinIO URL, возвращаем как есть
  if (oldUrl.includes('/minio/')) {
    return oldUrl;
  }
  
  // Если URL начинается с имени бакета без префикса
  if (oldUrl.startsWith('course-files/')) {
    const fileName = oldUrl.replace('course-files/', '');
    return `/minio/file/course-files/${fileName}`;
  }
  
  if (oldUrl.startsWith('uploads/')) {
    const fileName = oldUrl.replace('uploads/', '');
    return `/minio/file/uploads/${fileName}`;
  }
  
  if (oldUrl.startsWith('avatars/')) {
    const fileName = oldUrl.replace('avatars/', '');
    return `/minio/avatar/${fileName}`;
  }
  
  // Если это старый URL с static/uploads, извлекаем имя файла
  if (oldUrl.includes('static/uploads/')) {
    const fileName = oldUrl.split('static/uploads/').pop();
    return `/minio/file/uploads/${fileName}`;
  }
  
  // Если это полный URL с localhost:9000, извлекаем имя файла
  if (oldUrl.includes('localhost:9000/static/uploads/')) {
    const fileName = oldUrl.split('static/uploads/').pop();
    return `/minio/file/uploads/${fileName}`;
  }
  
  // Если это просто имя файла, добавляем префикс
  if (oldUrl.includes('.mp4') || oldUrl.includes('.webm') || oldUrl.includes('.avi')) {
    return `/minio/file/uploads/${oldUrl}`;
  }
  
  return oldUrl;
};

// Функция для миграции URL в таблице lectures
const migrateLessonUrls = async () => {
  try {
    console.log('🔄 Начинаем миграцию URL в таблице lectures...');
    
    const lectures = await DbClient.lecture.findMany({
      where: {
        OR: [
          { videoLink: { contains: 'static/uploads' } },
          { videoLink: { contains: 'localhost:9000' } },
          { videoLink: { startsWith: 'course-files/' } },
          { videoLink: { startsWith: 'uploads/' } },
          { videoLink: { startsWith: 'avatars/' } }
        ]
      }
    });
    
    console.log(`📄 Найдено лекций для миграции: ${lectures.length}`);
    
    for (const lecture of lectures) {
      const oldVideoUrl = lecture.videoLink;
      const newVideoUrl = convertToMinioUrl(oldVideoUrl);
      
      if (newVideoUrl && newVideoUrl !== oldVideoUrl) {
        console.log(`🔄 Мигрируем лекцию ${lecture.id}:`);
        console.log(`   Старый URL: ${oldVideoUrl}`);
        console.log(`   Новый URL: ${newVideoUrl}`);
        
        await DbClient.lecture.update({
          where: { id: lecture.id },
          data: {
            videoLink: newVideoUrl
          }
        });
        
        console.log(`✅ Лекция ${lecture.id} обновлена`);
      }
    }
    
    console.log('✅ Миграция лекций завершена');
  } catch (error) {
    console.error('❌ Ошибка при миграции лекций:', error);
  }
};

// Функция для миграции URL в таблице courses
const migrateCourseUrls = async () => {
  try {
    console.log('🔄 Начинаем миграцию URL в таблице courses...');
    
    const courses = await DbClient.course.findMany({
      where: {
        OR: [
          { introUrl: { contains: 'static/uploads' } },
          { introUrl: { contains: 'localhost:9000' } },
          { introUrl: { startsWith: 'course-files/' } },
          { introUrl: { startsWith: 'uploads/' } },
          { introUrl: { startsWith: 'avatars/' } },
          { logoUrl: { contains: 'static/uploads' } },
          { logoUrl: { contains: 'localhost:9000' } },
          { logoUrl: { startsWith: 'course-files/' } },
          { logoUrl: { startsWith: 'uploads/' } },
          { logoUrl: { startsWith: 'avatars/' } }
        ]
      }
    });
    
    console.log(`📄 Найдено курсов для миграции: ${courses.length}`);
    
    for (const course of courses) {
      const oldIntroUrl = course.introUrl;
      const oldLogoUrl = course.logoUrl;
      const newIntroUrl = convertToMinioUrl(oldIntroUrl);
      const newLogoUrl = convertToMinioUrl(oldLogoUrl);
      
      const updateData = {};
      
      if (newIntroUrl && newIntroUrl !== oldIntroUrl) {
        updateData.introUrl = newIntroUrl;
        console.log(`🔄 Курс ${course.id} - intro URL:`);
        console.log(`   Старый: ${oldIntroUrl}`);
        console.log(`   Новый: ${newIntroUrl}`);
      }
      
      if (newLogoUrl && newLogoUrl !== oldLogoUrl) {
        updateData.logoUrl = newLogoUrl;
        console.log(`🔄 Курс ${course.id} - logo URL:`);
        console.log(`   Старый: ${oldLogoUrl}`);
        console.log(`   Новый: ${newLogoUrl}`);
      }
      
      if (Object.keys(updateData).length > 0) {
        await DbClient.course.update({
          where: { id: course.id },
          data: updateData
        });
        
        console.log(`✅ Курс ${course.id} обновлен`);
      }
    }
    
    console.log('✅ Миграция курсов завершена');
  } catch (error) {
    console.error('❌ Ошибка при миграции курсов:', error);
  }
};

// Основная функция миграции
const migrateVideoUrls = async () => {
  try {
    console.log('🚀 Начинаем миграцию видео URL...');
    
    await migrateLessonUrls();
    await migrateCourseUrls();
    
    console.log('✅ Миграция завершена успешно');
  } catch (error) {
    console.error('💥 Критическая ошибка при миграции:', error);
  } finally {
    await DbClient.$disconnect();
  }
};

// Экспортируем функцию для использования в других модулях
module.exports = { migrateVideoUrls };

// Если файл запущен напрямую, выполняем миграцию
if (require.main === module) {
  migrateVideoUrls();
} 