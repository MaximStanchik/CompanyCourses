-- Создание базы данных ItCourses
CREATE DATABASE "ItCourses";

-- Подключение к базе данных ItCourses
\c "ItCourses";

-- Создание enum для ролей
CREATE TYPE "Roles" AS ENUM ('ADMIN', 'USER');

-- Создание таблицы Category
CREATE TABLE "Category" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT UNIQUE NOT NULL,
    "nameEn" TEXT,
    "nameRu" TEXT,
    "nameZh" TEXT,
    "nameDe" TEXT,
    "nameEs" TEXT,
    "namePt" TEXT,
    "nameUk" TEXT,
    "nameBe" TEXT,
    "parentId" INTEGER,
    FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE CASCADE
);

-- Создание таблицы User
CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "username" TEXT UNIQUE NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Roles" NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT UNIQUE,
    "emailVerificationExpires" TIMESTAMP(3),
    "googleId" TEXT UNIQUE,
    "facebookId" TEXT UNIQUE,
    "yandexId" TEXT UNIQUE,
    "dribbbleId" TEXT UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatar" TEXT,
    "lastDevice" TEXT,
    "lastOS" TEXT,
    "lastIP" TEXT,
    "lastCountry" TEXT,
    "lastBrowser" TEXT,
    "lastActivityTime" TIMESTAMP(3)
);

-- Создание таблицы Course
CREATE TABLE "Course" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "targeting" TEXT,
    "shortDescription" TEXT,
    "workload" TEXT,
    "learningOutcomes" TEXT,
    "requirements" TEXT,
    "learningFormat" TEXT,
    "language" TEXT,
    "level" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "category" INTEGER,
    "logoUrl" TEXT,
    "introUrl" TEXT,
    "acquiredAssets" TEXT,
    FOREIGN KEY ("category") REFERENCES "Category"("id") ON DELETE CASCADE
);

-- Создание таблицы CourseCategory (many-to-many)
CREATE TABLE "CourseCategory" (
    "id" SERIAL PRIMARY KEY,
    "courseId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE,
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE,
    UNIQUE("courseId", "categoryId")
);

-- Создание таблицы Profile
CREATE TABLE "Profile" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER UNIQUE NOT NULL,
    "bio" TEXT,
    "githubusername" TEXT,
    "city" TEXT,
    "country" TEXT,
    "position" TEXT,
    "company" TEXT,
    "status" TEXT,
    "skills" TEXT[],
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT,
    "surname" TEXT,
    "additionalName" TEXT,
    "jobTitle" TEXT,
    "goal" TEXT,
    "aboutMe" TEXT,
    "avatar" TEXT,
    "language" TEXT,
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

-- Создание таблицы Enrollment
CREATE TABLE "Enrollment" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER,
    "course_id" INTEGER,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE
);

-- Создание таблицы FavoriteCourse
CREATE TABLE "FavoriteCourse" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE,
    UNIQUE("user_id", "course_id")
);

-- Создание таблицы Lecture
CREATE TABLE "Lecture" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "videoLink" TEXT,
    "content" TEXT,
    "course_id" INTEGER,
    FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE
);

-- Создание таблицы Step
CREATE TABLE "Step" (
    "id" SERIAL PRIMARY KEY,
    "lesson_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "description" TEXT,
    "videoUrl" TEXT,
    "order" INTEGER NOT NULL,
    FOREIGN KEY ("lesson_id") REFERENCES "Lecture"("id") ON DELETE CASCADE
);

-- Создание таблицы LessonCompletion
CREATE TABLE "LessonCompletion" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "lecture_id" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE,
    FOREIGN KEY ("lecture_id") REFERENCES "Lecture"("id") ON DELETE CASCADE,
    UNIQUE("user_id", "lecture_id")
);

-- Создание таблицы StepCompletion
CREATE TABLE "StepCompletion" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "step_index" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE,
    UNIQUE("user_id", "lesson_id", "step_index")
);

-- Создание таблицы ModuleProgress
CREATE TABLE "ModuleProgress" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "module_key" TEXT NOT NULL,
    "progress" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE,
    UNIQUE("user_id", "course_id", "module_key")
);

-- Создание таблицы Notification
CREATE TABLE "Notification" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER,
    "courseId" INTEGER,
    "title" TEXT NOT NULL DEFAULT 'Уведомление',
    "message" TEXT NOT NULL DEFAULT 'Новое уведомление',
    "type" TEXT NOT NULL DEFAULT 'info',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE
);

-- Создание таблицы SupportMessage
CREATE TABLE "SupportMessage" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

-- Создание таблицы Chat
CREATE TABLE "Chat" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы Message
CREATE TABLE "Message" (
    "id" SERIAL PRIMARY KEY,
    "chatId" TEXT NOT NULL,
    "userId" INTEGER,
    "text" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileType" TEXT,
    "preview" TEXT,
    "caption" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Создание таблицы Reaction
CREATE TABLE "Reaction" (
    "id" SERIAL PRIMARY KEY,
    "messageId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    UNIQUE("messageId", "userId", "emoji")
);

-- Создание таблицы CourseRating
CREATE TABLE "CourseRating" (
    "id" SERIAL PRIMARY KEY,
    "courseId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    UNIQUE("courseId", "userId")
);

-- Создание таблицы CourseComment
CREATE TABLE "CourseComment" (
    "id" SERIAL PRIMARY KEY,
    "courseId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Создание таблицы CommentReaction
CREATE TABLE "CommentReaction" (
    "id" SERIAL PRIMARY KEY,
    "commentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("commentId") REFERENCES "CourseComment"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    UNIQUE("commentId", "userId")
);

-- Создание таблицы TestAttempt
CREATE TABLE "TestAttempt" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "step_index" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "lastScore" INTEGER NOT NULL,
    "lastPassed" BOOLEAN NOT NULL,
    "lastAnswers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE,
    FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE CASCADE,
    UNIQUE("user_id", "lesson_id", "step_index")
);

-- Создание индексов для оптимизации
CREATE INDEX "idx_user_email" ON "User"("email");
CREATE INDEX "idx_user_username" ON "User"("username");
CREATE INDEX "idx_course_name" ON "Course"("name");
CREATE INDEX "idx_course_status" ON "Course"("status");
CREATE INDEX "idx_enrollment_user_course" ON "Enrollment"("user_id", "course_id");
CREATE INDEX "idx_lecture_course" ON "Lecture"("course_id");
CREATE INDEX "idx_step_lesson" ON "Step"("lesson_id");

-- Вставка тестовых данных
INSERT INTO "User" (username, email, password, role, isVerified) 
VALUES ('admin12345', 'admin@example.com', '$2a$05$7Cqu098ySvvJUrOViilV5OCSi6pdddznShJ/LpUBRYyo2n6IjA4YS', 'ADMIN', true);

-- Вставка категорий
INSERT INTO "Category" (name, nameEn, nameRu) VALUES 
('Programming', 'Programming', 'Программирование'),
('Web Development', 'Web Development', 'Веб-разработка'),
('Mobile Development', 'Mobile Development', 'Мобильная разработка'),
('Data Science', 'Data Science', 'Наука о данных'),
('DevOps', 'DevOps', 'DevOps');

-- Вставка курсов
INSERT INTO "Course" (name, description, status, category) VALUES 
('JavaScript Basics', 'Основы JavaScript для начинающих', 'published', 1),
('React Development', 'Разработка на React', 'published', 2),
('Python for Data Science', 'Python для науки о данных', 'published', 4); 