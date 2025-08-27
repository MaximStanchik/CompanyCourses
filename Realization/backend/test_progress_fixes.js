// Скрипт для тестирования исправлений прогресса и попыток тестов

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProgressFixes() {
  try {
    console.log('=== ТЕСТИРОВАНИЕ ИСПРАВЛЕНИЙ ПРОГРЕССА И ПОПЫТОК ===');
    
    // Тестируем курс 25
    const courseId = 25;
    const userId = 1; // Замените на реальный ID пользователя
    
    console.log(`\n1. Проверяем попытки тестов для курса ${courseId}:`);
    const testAttempts = await prisma.testAttempt.findMany({
      where: { 
        user_id: userId,
        course_id: courseId 
      },
      select: { 
        lesson_id: true, 
        step_index: true, 
        attempts: true, 
        lastScore: true,
        lastPassed: true
      }
    });
    console.log('Попытки тестов:', testAttempts);
    
    console.log(`\n2. Проверяем завершенные шаги для курса ${courseId}:`);
    const stepCompletions = await prisma.stepCompletion.findMany({
      where: { 
        user_id: userId,
        course_id: courseId 
      },
      select: { 
        lesson_id: true, 
        step_index: true 
      }
    });
    console.log('Завершенные шаги:', stepCompletions);
    
    console.log(`\n3. Проверяем прогресс модулей для курса ${courseId}:`);
    const moduleProgresses = await prisma.moduleProgress.findMany({
      where: { 
        user_id: userId,
        course_id: courseId 
      },
      select: { 
        module_key: true, 
        progress: true 
      }
    });
    console.log('Прогресс модулей:', moduleProgresses);
    
    console.log(`\n4. Проверяем завершенные уроки для курса ${courseId}:`);
    const lessonCompletions = await prisma.lessonCompletion.findMany({
      where: { 
        user_id: userId,
        course_id: courseId 
      },
      select: { 
        lecture_id: true, 
        completedAt: true 
      }
    });
    console.log('Завершенные уроки:', lessonCompletions);
    
    console.log('\n=== КОНЕЦ ТЕСТИРОВАНИЯ ===');
    
  } catch (error) {
    console.error('Ошибка при тестировании:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProgressFixes(); 