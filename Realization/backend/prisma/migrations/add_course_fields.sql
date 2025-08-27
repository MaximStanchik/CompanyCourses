-- Добавление новых полей в таблицу Course
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "shortDescription" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "workload" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "learningOutcomes" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "requirements" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "learningFormat" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "language" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "level" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "introUrl" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "acquiredAssets" TEXT;

-- Добавление комментариев к полям
COMMENT ON COLUMN "Course"."shortDescription" IS 'Краткое описание курса';
COMMENT ON COLUMN "Course"."workload" IS 'Нагрузка курса';
COMMENT ON COLUMN "Course"."learningOutcomes" IS 'Что вы научитесь';
COMMENT ON COLUMN "Course"."requirements" IS 'Требования к курсу';
COMMENT ON COLUMN "Course"."learningFormat" IS 'Формат обучения';
COMMENT ON COLUMN "Course"."language" IS 'Язык курса';
COMMENT ON COLUMN "Course"."level" IS 'Уровень сложности';
COMMENT ON COLUMN "Course"."logoUrl" IS 'URL логотипа курса';
COMMENT ON COLUMN "Course"."introUrl" IS 'URL вступительного видео';
COMMENT ON COLUMN "Course"."acquiredAssets" IS 'Что Вы получаете'; 