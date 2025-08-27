-- ПРИНУДИТЕЛЬНАЯ ОЧИСТКА ТЕСТОВЫХ ЗАПИСЕЙ STEP COMPLETION
-- Удаляем ВСЕ записи stepCompletion для курса 25, пользователя 1

-- Сначала посмотрим что есть
SELECT 
  'BEFORE CLEANUP' as status,
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

-- Удаляем ВСЕ записи stepCompletion для курса 25
DELETE FROM "StepCompletion" 
WHERE "course_id" = 25 
  AND "user_id" = 1;

-- Проверяем что удалилось
SELECT 
  'AFTER CLEANUP' as status,
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

-- Проверяем testAttempts (они должны остаться)
SELECT 
  'TEST ATTEMPTS' as status,
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