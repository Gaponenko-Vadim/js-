-- Add skipTasksWarning to User
ALTER TABLE "User" ADD COLUMN "skipTasksWarning" BOOLEAN NOT NULL DEFAULT false;
