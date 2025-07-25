SELECT * FROM information_schema.tables WHERE table_name = 'User';

select * from User;
SELECT * FROM information_schema.tables;

SELECT * FROM "User";
SELECT * FROM "Profile";

INSERT INTO "User" (name, email, password, role)
VALUES ('admin12345', 'admin@example.com', '$2a$05$7Cqu098ySvvJUrOViilV5OCSi6pdddznShJ/LpUBRYyo2n6IjA4YS', 'ADMIN');

ALTER TABLE "Lecture" ALTER COLUMN "videoLink" SET DATA TYPE VARCHAR(400);
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_category_fkey";

-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "category" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_category_fkey" FOREIGN KEY ("category") REFERENCES "Category"("name") ON DELETE CASCADE ON UPDATE CASCADE;






/*
  Warnings:

  - The `category` column on the `Course` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Statistic` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_category_fkey";

-- DropForeignKey
ALTER TABLE "Statistic" DROP CONSTRAINT "Statistic_lecture_id_fkey";

-- DropForeignKey
ALTER TABLE "Statistic" DROP CONSTRAINT "Statistic_user_id_fkey";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "category",
ADD COLUMN     "category" INTEGER;

-- DropTable
DROP TABLE "Statistic";

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "handle" TEXT NOT NULL,
    "skills" TEXT[],
    "bio" TEXT,
    "githubusername" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "school" TEXT NOT NULL,
    "fieldofstudy" TEXT NOT NULL,
    "from" TIMESTAMP(3) NOT NULL,
    "to" TIMESTAMP(3),

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_category_fkey" FOREIGN KEY ("category") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;




/*
  Warnings:

  - You are about to drop the column `photo` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Education` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Education" DROP CONSTRAINT "Education_profileId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "photo";

-- DropTable
DROP TABLE "Education";

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_courseId_key" ON "Notification"("courseId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;





-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "theory" TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "description" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "checked";

-- AlterTable
ALTER TABLE "Lecture" ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "content" SET DATA TYPE TEXT,
ALTER COLUMN "videoLink" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "password" SET DATA TYPE TEXT;

-- DropIndex
DROP INDEX "Notification_courseId_key";

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "courseId" DROP NOT NULL;


ALTER TABLE "Course" DROP COLUMN "theory";
