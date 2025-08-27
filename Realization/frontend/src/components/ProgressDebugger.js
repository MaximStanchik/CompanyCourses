import React, { useState, useEffect } from 'react';
import useTheme from '../hooks/useTheme';

const ProgressDebugger = ({ courseId, userProgress, modules, getLessonsForModule, getLessonProgress, getModuleProgressPercent }) => {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  const calculateProgress = () => {
    console.log('=== ProgressDebugger: РАСЧЕТ ПРОГРЕССА ===');
    console.log('modules:', modules);
    console.log('userProgress:', userProgress);
    
    if (!Array.isArray(modules) || modules.length === 0) return { overall: 100, details: [], moduleCount: 0 };
    
    let totalModuleProgress = 0;
    let moduleCount = 0;
    const details = [];
    
    // Используем ту же логику, что и в Course.js - считаем по модулям
    for (const module of modules) {
      const moduleProgress = getModuleProgressPercent ? getModuleProgressPercent(module.id) : 0;
      totalModuleProgress += moduleProgress;
      moduleCount++;
      
      console.log(`Модуль ${module.id} (${module.title}): ${moduleProgress}%`);
      
      // Добавляем детали по урокам для отладки
      const moduleLessons = getLessonsForModule ? getLessonsForModule(module.id) : (module.lessons || []);
      for (const lesson of moduleLessons) {
        const lessonProgress = getLessonProgress ? getLessonProgress(lesson.id) : 0;
        console.log(`  Урок ${lesson.id} (${lesson.title}): ${lessonProgress}%`);
        details.push({
          module: module.title,
          lesson: lesson.title,
          progress: lessonProgress,
          steps: lesson.steps?.length || 0,
          completedSteps: 'N/A'
        });
      }
    }
    
    const overallProgress = moduleCount > 0 ? Math.round(totalModuleProgress / moduleCount) : 0;
    
    console.log(`Общий прогресс: ${overallProgress}% (${totalModuleProgress}/${moduleCount})`);
    console.log('=== КОНЕЦ РАСЧЕТА ПРОГРЕССА ===');
    
    return { overall: overallProgress, details, moduleCount };
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
            {modules.map((module, index) => (
              <div key={index} style={{ 
                margin: '2px 0', 
                padding: '3px', 
                background: theme === 'dark' ? '#404040' : '#f8f9fa',
                borderRadius: '3px',
                fontSize: '11px'
              }}>
                {module.title}: {getModuleProgressPercent ? getModuleProgressPercent(module.id) : 0}%
              </div>
            ))}
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