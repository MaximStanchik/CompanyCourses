/*
  Warnings:

  - You are about to drop the column `handle` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `nickname` on the `Profile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Profile_nickname_key";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "handle",
DROP COLUMN "nickname",
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");
