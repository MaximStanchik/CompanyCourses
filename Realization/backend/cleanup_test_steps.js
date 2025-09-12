const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const DbClient = new PrismaClient();

// Helper functions for syllabus meta (copied from courseController)
const getSyllabusMetaPath = (courseId) => {
  const dataDir = path.join(__dirname, 'static/course-meta');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, `course-${courseId}-syllabus.json`);
};

const readSyllabusMeta = (courseId) => {
  try {
    const metaPath = getSyllabusMetaPath(courseId);
    if (fs.existsSync(metaPath)) {
      return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }
  } catch (e) { console.warn('Failed to read syllabus meta:', e); }
  return { courseId, schedule: null, syllabus: null };
};

async function cleanupTestSteps() {
  try {
    console.log('=== ОЧИСТКА ТЕСТОВЫХ ШАГОВ ===');
    
    // Получаем все завершенные шаги
    const allStepCompletions = await DbClient.stepCompletion.findMany({
      include: {
        Course: true,
        User: true
      }
    });
    
    console.log(`Найдено ${allStepCompletions.length} завершенных шагов`);
    
    let deletedCount = 0;
    
    for (const completion of allStepCompletions) {
      const courseId = completion.course_id;
      const lessonId = completion.lesson_id;
      const stepIndex = completion.step_index;
      
      // Читаем метаданные курса
      const meta = readSyllabusMeta(courseId);
      const modules = Array.isArray(meta.syllabus) ? meta.syllabus : [];
      
      // Находим урок и шаг
      let targetLesson = null;
      for (const module of modules) {
        if (Array.isArray(module.lessons)) {
          const lesson = module.lessons.find(l => l.id === lessonId);
          if (lesson) {
            targetLesson = lesson;
            break;
          }
        }
      }
      
      if (targetLesson && Array.isArray(targetLesson.steps)) {
        const step = targetLesson.steps[stepIndex];
        if (step && (step.type === 'test' || step.type === 'quiz')) {
          console.log(`Удаляем тестовый шаг: курс ${courseId}, урок ${lessonId}, шаг ${stepIndex} (тип: ${step.type})`);
          
          await DbClient.stepCompletion.delete({
            where: {
              id: completion.id
            }
          });
          
          deletedCount++;
        }
      }
    }
    
    console.log(`Удалено ${deletedCount} тестовых шагов`);
    console.log('=== КОНЕЦ ОЧИСТКИ ===');
    
  } catch (error) {
    console.error('Ошибка при очистке тестовых шагов:', error);
  } finally {
    await DbClient.$disconnect();
  }
}

cleanupTestSteps(); 