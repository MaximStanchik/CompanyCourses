import React, { useState, useEffect } from 'react';
import useTheme from '../hooks/useTheme';

const ProgressDebugger = ({ courseId, userProgress, modules, getLessonsForModule, getLessonProgress, getModuleProgressPercent }) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  const calculateProgress = () => {
    console.log('=== ProgressDebugger: РАСЧЕТ ПРОГРЕССА ===');
    console.log('modules:', modules);
    console.log('userProgress:', userProgress);
    console.log('getModuleProgressPercent доступна:', !!getModuleProgressPercent);
    console.log('getLessonProgress доступна:', !!getLessonProgress);
    
    // Если нет модулей, возвращаем 0% (нечего проходить)
    if (!Array.isArray(modules) || modules.length === 0) {
      console.log('Нет модулей, возвращаем 0% (нечего проходить)');
      return { overall: 0, details: [], moduleCount: 0 };
    }

    console.log(`Всего модулей: ${modules.length}`);
    console.log('userProgress:', userProgress);
    
    // Проверяем, есть ли модули с уроками
    let modulesWithLessons = 0;
    let totalModuleProgress = 0;
    const details = [];
    
    for (const module of modules) {
      console.log(`\n=== ОБРАБОТКА МОДУЛЯ ${module.id} (${module.title}) ===`);
      
      // Получаем уроки для модуля
      let moduleLessons = [];
      if (getLessonsForModule) {
        moduleLessons = getLessonsForModule(module.id);
        console.log(`getLessonsForModule вернул ${moduleLessons.length} уроков`);
      } else if (module.lessons) {
        moduleLessons = module.lessons;
        console.log(`Используем module.lessons: ${moduleLessons.length} уроков`);
      } else {
        console.log(`⚠️ Модуль ${module.id} не имеет уроков`);
        continue;
      }
      
      if (moduleLessons.length === 0) {
        console.log(`⚠️ Модуль ${module.id} (${module.title}): НЕТ УРОКОВ - пропускаем`);
        continue;
      }
      
      if (moduleLessons.length > 0) {
        // Проверяем, есть ли у модуля уроки с шагами
        const hasSteps = moduleLessons.some(lesson => (lesson.steps && lesson.steps.length > 0));
        
        if (!hasSteps) {
          console.log(`⚠️ Модуль ${module.id} (${module.title}): НЕТ УРОКОВ С ШАГАМИ - пропускаем в расчете`);
          continue;
        }
        
        // Рассчитываем прогресс модуля по всем урокам (уроки без шагов дают 0% прогресс)
        let moduleProgress = 0;
        if (getModuleProgressPercent) {
          // Используем функцию getModuleProgressPercent для правильного расчета
          moduleProgress = getModuleProgressPercent(module.id);
          console.log(`Модуль ${module.id} (${module.title}): прогресс из getModuleProgressPercent = ${moduleProgress}%`);
        } else if (moduleLessons.length > 0) {
          // Fallback: рассчитываем прогресс модуля по всем урокам
          let totalLessonProgress = 0;
          let lessonsWithSteps = 0;
          for (const lesson of moduleLessons) {
            const lessonSteps = lesson.steps || [];
            if (lessonSteps.length > 0) {
              // Урок с шагами - используем getLessonProgress
              const lessonProgress = getLessonProgress ? getLessonProgress(lesson.id) : 0;
              totalLessonProgress += lessonProgress;
              lessonsWithSteps++;
              console.log(`  ✅ Урок ${lesson.id} (${lesson.title}): ${lessonProgress}% (${lessonSteps.length} шагов)`);
            } else {
              // Урок без шагов - 0% прогресс (нечего проходить)
              totalLessonProgress += 0;
              console.log(`  ❌ Урок ${lesson.id} (${lesson.title}): 0% (нет шагов - нечего проходить)`);
            }
          }
          
          // Рассчитываем средний прогресс модуля только по урокам с шагами
          if (lessonsWithSteps > 0) {
            moduleProgress = Math.round(totalLessonProgress / lessonsWithSteps);
            console.log(`Модуль ${module.id} (${module.title}): средний прогресс ${moduleProgress}% (${totalLessonProgress}/${lessonsWithSteps} уроков с шагами)`);
          } else {
            moduleProgress = 0;
            console.log(`Модуль ${module.id} (${module.title}): 0% (нет уроков с шагами)`);
          }
        } else {
          // Модуль без уроков - 0% прогресс (нечего проходить)
          moduleProgress = 0;
          console.log(`Модуль ${module.id} (${module.title}): 0% (нет уроков - нечего проходить)`);
        }
        
        // Ограничиваем прогресс модуля максимум 100% и добавляем в общий расчет
        const normalizedModuleProgress = Math.min(100, Math.max(0, moduleProgress));
        totalModuleProgress += normalizedModuleProgress;
        modulesWithLessons++;
        
        console.log(`Модуль ${module.id}: итоговый прогресс ${normalizedModuleProgress}% (добавляем к totalModuleProgress: ${totalModuleProgress})`);
        console.log(`Модулей с уроками: ${modulesWithLessons}`);
        
        // Добавляем информацию о каждом уроке в детали
        moduleLessons.forEach(lesson => {
          const lessonSteps = lesson.steps || [];
          if (lessonSteps.length > 0) {
            // Урок с шагами
            const lessonProgress = getLessonProgress ? getLessonProgress(lesson.id) : 0;
            details.push({
              module: module.title,
              lesson: lesson.title,
              progress: lessonProgress,
              steps: lessonSteps.length,
              completedSteps: 'N/A'
            });
          } else {
            // Урок без шагов
            details.push({
              module: module.title,
              lesson: lesson.title,
              progress: 0,
              steps: 0,
              completedSteps: '0',
              note: 'НЕТ ШАГОВ - 0% (нечего проходить)'
            });
          }
        });
      }
    }
    
    console.log(`\n=== ИТОГОВЫЙ РАСЧЕТ ===`);
    console.log(`Всего модулей: ${modules.length}`);
    console.log(`Модулей с уроками: ${modulesWithLessons}`);
    console.log(`Сумма прогресса модулей: ${totalModuleProgress}`);
    
    const overallProgress = modulesWithLessons > 0 ? Math.round((totalModuleProgress / modulesWithLessons) * 1000) / 10 : 0;
    
    // Ограничиваем общий прогресс курса максимум 100%
    const normalizedOverallProgress = Math.min(100, Math.max(0, overallProgress));
    
    console.log(`Общий прогресс: ${overallProgress}% (${totalModuleProgress}/${modulesWithLessons} модулей) -> нормализовано: ${normalizedOverallProgress}%`);
    console.log(`Всего модулей: ${modules.length}, модулей с уроками: ${modulesWithLessons}`);
    console.log(`ФОРМУЛА: ${totalModuleProgress} / ${modulesWithLessons} = ${overallProgress}%`);
    
    // Показываем, какие модули участвовали в расчете
    if (modulesWithLessons > 0) {
      console.log(`✅ Модули, участвующие в расчете общего прогресса:`);
      modules.forEach(module => {
        const moduleLessons = getLessonsForModule ? getLessonsForModule(module.id) : (module.lessons || []);
        const hasSteps = moduleLessons.some(lesson => (lesson.steps && lesson.steps.length > 0));
        if (hasSteps) {
          console.log(`  ✅ Модуль "${module.title}" - участвует в расчете`);
        } else {
          console.log(`  ❌ Модуль "${module.title}" - НЕ участвует в расчете (нет шагов)`);
        }
      });
    }
    
    // Проверяем, есть ли уроки, которые не привязаны к модулям
    if (getLessonsForModule) {
      let totalLessons = 0;
      let orphanedLessons = 0;
      let lessonsWithSteps = 0;
      let lessonsWithoutSteps = 0;
      
      modules.forEach(module => {
        const moduleLessons = getLessonsForModule(module.id);
        totalLessons += moduleLessons.length;
        if (moduleLessons.length === 0) {
          orphanedLessons++;
        } else {
          moduleLessons.forEach(lesson => {
            const stepCount = lesson.steps ? lesson.steps.length : 0;
            if (stepCount === 0) {
              lessonsWithoutSteps++;
            } else {
              lessonsWithSteps++;
            }
          });
        }
      });
      
      console.log(`Всего уроков в модулях: ${totalLessons}`);
      console.log(`Уроков с шагами: ${lessonsWithSteps}`);
      console.log(`Уроков без шагов: ${lessonsWithoutSteps}`);
      console.log(`Модулей без уроков: ${orphanedLessons}`);
      
      // Показываем детали по каждому модулю
      modules.forEach(module => {
        const moduleLessons = getLessonsForModule(module.id);
        console.log(`Модуль "${module.title}" (ID: ${module.id}): ${moduleLessons.length} уроков`);
        if (moduleLessons.length === 0) {
          console.log(`  ⚠️ Модуль "${module.title}" не имеет уроков!`);
        } else {
          moduleLessons.forEach(lesson => {
            const stepCount = lesson.steps ? lesson.steps.length : 0;
            if (stepCount === 0) {
              console.log(`    ⚠️ Урок "${lesson.title}" (ID: ${lesson.id}): НЕТ ШАГОВ`);
            } else {
              console.log(`    ✅ Урок "${lesson.title}" (ID: ${lesson.id}): ${stepCount} шагов`);
            }
          });
        }
      });
    }
    
    console.log('=== КОНЕЦ РАСЧЕТА ПРОГРЕССА ===');
    
    return { overall: normalizedOverallProgress, details, moduleCount: modulesWithLessons };
  };

  const { overall, details, moduleCount } = calculateProgress();

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 9999,
          padding: '10px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Debug Progress ({overall}%)
      </button>
      
      {isVisible && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: '20px',
          zIndex: 9998,
          width: '400px',
          maxHeight: '80vh',
          overflow: 'auto',
          background: theme === 'dark' ? '#2d2d2d' : '#ffffff',
          border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
          borderRadius: '8px',
          padding: '15px',
          fontSize: '12px',
          color: theme === 'dark' ? '#ffffff' : '#333333'
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Progress Debugger</h4>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>Overall Progress: {overall}%</strong>
            <div style={{ fontSize: '11px', color: '#666' }}>
              Calculated from {moduleCount} modules
            </div>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>Raw Data:</strong>
            <div>Step Completions: {userProgress.stepCompletions?.length || 0}</div>
            <div>Test Attempts: {userProgress.testAttempts?.length || 0}</div>
            <div>Unique Steps Completed: {new Set(userProgress.stepCompletions?.map(sc => `${sc.lessonId}-${sc.stepIndex}`) || []).size}</div>
            <div>Unique Test Attempts: {new Set(userProgress.testAttempts?.map(ta => `${ta.lessonId}-${ta.stepIndex}`) || []).size}</div>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>Module Progress:</strong>
            {modules.map((module, index) => {
              const moduleLessons = getLessonsForModule ? getLessonsForModule(module.id) : (module.lessons || []);
              let moduleProgress = 0;
              
              if (moduleLessons.length > 0) {
                let moduleTotalSteps = 0;
                let moduleCompletedSteps = 0;
                
                for (const lesson of moduleLessons) {
                  const lessonSteps = lesson.steps || [];
                  moduleTotalSteps += lessonSteps.length;
                  
                  const lessonProgress = getLessonProgress ? getLessonProgress(lesson.id) : 0;
                  const normalizedLessonProgress = Math.min(100, Math.max(0, lessonProgress));
                  const lessonCompletedSteps = (normalizedLessonProgress / 100) * lessonSteps.length;
                  moduleCompletedSteps += lessonCompletedSteps;
                }
                
                moduleProgress = moduleTotalSteps > 0 ? Math.round((moduleCompletedSteps / moduleTotalSteps) * 1000) / 10 : 0;
                moduleProgress = Math.min(100, Math.max(0, moduleProgress));
              }
              
              return (
                <div key={index} style={{ 
                  margin: '2px 0', 
                  padding: '3px', 
                  background: theme === 'dark' ? '#404040' : '#f8f9fa',
                  borderRadius: '3px',
                  fontSize: '11px'
                }}>
                  {module.title}: {moduleProgress}%
                </div>
              );
            })}
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <strong>Details:</strong>
            {details.map((detail, index) => (
              <div key={index} style={{ 
                margin: '5px 0', 
                padding: '5px', 
                background: theme === 'dark' ? '#404040' : '#f8f9fa',
                borderRadius: '4px',
                fontSize: '11px'
              }}>
                <div>{detail.module} → {detail.lesson}</div>
                <div>Progress: {detail.progress}% ({detail.steps} steps total)</div>
                {detail.note && (
                  <div style={{ color: '#ff6b6b', fontSize: '10px', fontWeight: 'bold' }}>
                    ⚠️ {detail.note}
                  </div>
                )}
                <div style={{ color: '#666', fontSize: '10px' }}>
                  Lesson {index + 1} of {details.length}
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => setIsVisible(false)}
            style={{
              padding: '5px 10px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

export default ProgressDebugger; 