-- CreateTable
CREATE TABLE "Step" (
    "id" SERIAL NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "description" TEXT,
    "videoUrl" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
