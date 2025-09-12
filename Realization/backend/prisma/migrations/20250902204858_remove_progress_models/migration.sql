/*
  Warnings:

  - You are about to drop the column `progress` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the `LessonCompletion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModuleProgress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StepCompletion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LessonCompletion" DROP CONSTRAINT "LessonCompletion_course_id_fkey";

-- DropForeignKey
ALTER TABLE "LessonCompletion" DROP CONSTRAINT "LessonCompletion_lecture_id_fkey";

-- DropForeignKey
ALTER TABLE "LessonCompletion" DROP CONSTRAINT "LessonCompletion_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ModuleProgress" DROP CONSTRAINT "ModuleProgress_course_id_fkey";

-- DropForeignKey
ALTER TABLE "ModuleProgress" DROP CONSTRAINT "ModuleProgress_user_id_fkey";

-- DropForeignKey
ALTER TABLE "StepCompletion" DROP CONSTRAINT "StepCompletion_course_id_fkey";

-- DropForeignKey
ALTER TABLE "StepCompletion" DROP CONSTRAINT "StepCompletion_user_id_fkey";

-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "progress";

-- DropTable
DROP TABLE "LessonCompletion";

-- DropTable
DROP TABLE "ModuleProgress";

-- DropTable
DROP TABLE "StepCompletion";
