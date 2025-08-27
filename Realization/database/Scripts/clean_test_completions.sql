-- Очистка тестовых записей stepCompletion для курса 25
-- Удаляем записи stepCompletion для шага 1 (тест) урока 12

DELETE FROM "StepCompletion" 
WHERE "course_id" = 25 
  AND "lesson_id" = 12 
  AND "step_index" = 1 
  AND "user_id" = 1;

-- Проверяем результат
SELECT 
  sc."id",
  sc."user_id",
  sc."course_id", 
  sc."lesson_id",
  sc."step_index",
  sc."completedAt"
FROM "StepCompletion" sc
WHERE sc."course_id" = 25 
  AND sc."user_id" = 1
ORDER BY sc."lesson_id", sc."step_index";

-- Проверяем testAttempts
SELECT 
  ta."id",
  ta."user_id",
  ta."course_id",
  ta."lesson_id", 
  ta."step_index",
  ta."attempts",
  ta."lastScore",
  ta."lastPassed"
FROM "TestAttempt" ta
WHERE ta."course_id" = 25 
  AND ta."user_id" = 1
ORDER BY ta."lesson_id", ta."step_index"; 