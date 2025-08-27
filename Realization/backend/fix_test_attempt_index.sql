-- Исправление уникального индекса для TestAttempt
-- Удаляем старый индекс
DROP INDEX IF EXISTS "TestAttempt_user_id_lesson_id_step_index_key";
 
-- Создаем новый индекс с правильным именем
CREATE UNIQUE INDEX "TestAttempt_user_id_lesson_id_step_index_key" ON "TestAttempt"("user_id", "lesson_id", "step_index"); 