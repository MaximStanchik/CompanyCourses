const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCourseLanguages() {
  try {
    console.log('🔍 Проверяем языки курсов в базе данных...');
    
    // Получаем все курсы
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        language: true
      }
    });
    
    console.log(`📄 Всего курсов: ${courses.length}`);
    
    // Группируем по языкам
    const languageStats = {};
    const coursesWithoutLanguage = [];
    
    courses.forEach(course => {
      if (course.language) {
        languageStats[course.language] = (languageStats[course.language] || 0) + 1;
      } else {
        coursesWithoutLanguage.push(course);
      }
    });
    
    console.log('\n📊 Статистика по языкам:');
    Object.entries(languageStats).forEach(([lang, count]) => {
      console.log(`- ${lang}: ${count} курсов`);
    });
    
    if (coursesWithoutLanguage.length > 0) {
      console.log(`\n⚠️ Курсы без языка (${coursesWithoutLanguage.length}):`);
      coursesWithoutLanguage.forEach(course => {
        console.log(`- "${course.name}" (ID: ${course.id})`);
      });
    } else {
      console.log('\n✅ Все курсы имеют установленный язык');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке языков курсов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
checkCourseLanguages(); 