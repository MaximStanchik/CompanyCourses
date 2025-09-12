const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Маппинг полных названий языков на коды
const languageMapping = {
  'Русский': 'ru',
  'English': 'en',
  'Deutsch': 'de',
  'español': 'es',
  'Português': 'pt',
  'беларуская': 'be',
  'Українська': 'uk',
  '简体中文': 'zh',
  'français': 'fr',
  'italiano': 'it',
  '日本語': 'ja',
  '한국어': 'ko',
  'العربيّة': 'ar',
  'हिन्दी': 'hi',
  'Português do Brasil': 'pt-BR',
  'español de Argentina': 'es-AR',
  'español de Colombia': 'es-CO',
  'español de Mexico': 'es-MX',
  'español de Nicaragua': 'es-NI',
  'español de Venezuela': 'es-VE',
  'Australian English': 'en-AU',
  'British English': 'en-GB'
};

async function fixCourseLanguages() {
  try {
    console.log('🚀 Начинаем исправление языков курсов...');
    
    // Получаем все курсы
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        language: true
      }
    });
    
    console.log(`📄 Всего курсов: ${courses.length}`);
    
    let updatedCount = 0;
    
    for (const course of courses) {
      if (course.language && languageMapping[course.language]) {
        const newLanguageCode = languageMapping[course.language];
        
        console.log(`🔄 Обновляем курс "${course.name}": "${course.language}" -> "${newLanguageCode}"`);
        
        await prisma.course.update({
          where: { id: course.id },
          data: { language: newLanguageCode }
        });
        
        updatedCount++;
      } else if (course.language && !languageMapping[course.language]) {
        console.log(`⚠️ Неизвестный язык для курса "${course.name}": "${course.language}"`);
      } else if (!course.language) {
        console.log(`⚠️ Курс "${course.name}" не имеет языка, устанавливаем "ru" по умолчанию`);
        
        await prisma.course.update({
          where: { id: course.id },
          data: { language: 'ru' }
        });
        
        updatedCount++;
      }
    }
    
    console.log(`✅ Обновлено курсов: ${updatedCount}`);
    
    // Проверяем результат
    const updatedCourses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
        language: true
      }
    });
    
    console.log('\n📊 Результат после обновления:');
    updatedCourses.forEach(course => {
      console.log(`- "${course.name}": язык = "${course.language}"`);
    });
    
    console.log('✅ Исправление языков курсов завершено успешно');
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении языков курсов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем скрипт
fixCourseLanguages(); 