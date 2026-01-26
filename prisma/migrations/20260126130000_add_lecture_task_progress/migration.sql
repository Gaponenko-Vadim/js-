-- Add LectureTaskProgress table
CREATE TABLE "LectureTaskProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lectureId" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LectureTaskProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LectureTaskProgress_userId_lectureId_taskId_key"
  ON "LectureTaskProgress" ("userId", "lectureId", "taskId");

CREATE INDEX "LectureTaskProgress_userId_idx"
  ON "LectureTaskProgress" ("userId");

CREATE INDEX "LectureTaskProgress_lectureId_idx"
  ON "LectureTaskProgress" ("lectureId");

ALTER TABLE "LectureTaskProgress"
  ADD CONSTRAINT "LectureTaskProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LectureTaskProgress"
  ADD CONSTRAINT "LectureTaskProgress_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
