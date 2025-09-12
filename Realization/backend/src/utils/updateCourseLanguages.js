const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateCourseLanguages() {
  try {
    console.log('🚀 Начинаем обновление языков курсов...');
    
    // Получаем все курсы без языка
    const coursesWithoutLanguage = await prisma.course.findMany({
      where: {
        OR: [
          { language: null },
          { language: '' }
        ]
      }
    });
    
    console.log(`📄 Найдено курсов без языка: ${coursesWithoutLanguage.length}`);
    
    if (coursesWithoutLanguage.length === 0) {
      console.log('✅ Все курсы уже имеют установленный язык');
      return;
    }
    
    // Обновляем курсы, устанавливая русский язык по умолчанию
    const updateResult = await prisma.course.updateMany({
      where: {
        OR: [
          { language: null },
          { language: '' }
        ]
      },
      data: {
        language: 'ru' // Устанавливаем русский язык по умолчанию
      }
    });
    
    console.log(`✅ Обновлено курсов: ${updateResult.count}`);
    
    // Проверяем результат
    const updatedCourses = await prisma.course.findMany({
      where: {
        language: 'ru'
      }
    });
    
    console.log(`📄 Курсов с русским языком: ${updatedCourses.length}`);
    
    // Выводим список обновленных курсов
    updatedCourses.forEach(course => {
      console.log(`- "${course.name}" (ID: ${course.id})`);
    });
    
    console.log('✅ Обновление языков курсов завершено успешно');
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении языков курсов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
updateCourseLanguages(); 