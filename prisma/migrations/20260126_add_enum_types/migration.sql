-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE "TestMode" AS ENUM ('learning', 'exam');
CREATE TYPE "PomodoroType" AS ENUM ('work', 'short_break', 'long_break');
CREATE TYPE "CollectionType" AS ENUM ('profession', 'learning_path', 'custom');

-- AlterTable: Test.difficulty
-- Шаг 1: Добавить временную колонку с ENUM типом
ALTER TABLE "Test" ADD COLUMN "difficulty_new" "Difficulty";

-- Шаг 2: Копировать данные с нормализацией (lowercase)
UPDATE "Test" SET "difficulty_new" =
  CASE LOWER("difficulty")
    WHEN 'beginner' THEN 'beginner'::"Difficulty"
    WHEN 'intermediate' THEN 'intermediate'::"Difficulty"
    WHEN 'advanced' THEN 'advanced'::"Difficulty"
    ELSE 'beginner'::"Difficulty" -- fallback на beginner
  END;

-- Шаг 3: Удалить старую колонку
ALTER TABLE "Test" DROP COLUMN "difficulty";

-- Шаг 4: Переименовать новую колонку
ALTER TABLE "Test" RENAME COLUMN "difficulty_new" TO "difficulty";

-- Шаг 5: Установить NOT NULL
ALTER TABLE "Test" ALTER COLUMN "difficulty" SET NOT NULL;

-- AlterTable: TestResult.mode
-- Шаг 1: Добавить временную колонку
ALTER TABLE "TestResult" ADD COLUMN "mode_new" "TestMode";

-- Шаг 2: Копировать данные
UPDATE "TestResult" SET "mode_new" =
  CASE LOWER("mode")
    WHEN 'learning' THEN 'learning'::"TestMode"
    WHEN 'exam' THEN 'exam'::"TestMode"
    ELSE 'exam'::"TestMode" -- fallback на exam
  END;

-- Шаг 3: Удалить старую колонку
ALTER TABLE "TestResult" DROP COLUMN "mode";

-- Шаг 4: Переименовать новую колонку
ALTER TABLE "TestResult" RENAME COLUMN "mode_new" TO "mode";

-- Шаг 5: Установить NOT NULL и DEFAULT
ALTER TABLE "TestResult" ALTER COLUMN "mode" SET NOT NULL;
ALTER TABLE "TestResult" ALTER COLUMN "mode" SET DEFAULT 'exam'::"TestMode";

-- AlterTable: PomodoroSession.type (таблица пустая, можно безопасно изменить)
ALTER TABLE "PomodoroSession" DROP COLUMN "type";
ALTER TABLE "PomodoroSession" ADD COLUMN "type" "PomodoroType" NOT NULL;

-- AlterTable: Collection.type
ALTER TABLE "Collection" ADD COLUMN "type_new" "CollectionType";

UPDATE "Collection" SET "type_new" =
  CASE LOWER("type")
    WHEN 'profession' THEN 'profession'::"CollectionType"
    WHEN 'learning_path' THEN 'learning_path'::"CollectionType"
    WHEN 'custom' THEN 'custom'::"CollectionType"
    ELSE 'custom'::"CollectionType"
  END;

ALTER TABLE "Collection" DROP COLUMN "type";
ALTER TABLE "Collection" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "Collection" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "Collection" ALTER COLUMN "type" SET DEFAULT 'custom'::"CollectionType";

-- AlterTable: Collection.level (может быть NULL)
ALTER TABLE "Collection" ADD COLUMN "level_new" "Difficulty";

UPDATE "Collection" SET "level_new" =
  CASE
    WHEN "level" IS NULL THEN NULL
    ELSE
      CASE LOWER("level")
        WHEN 'beginner' THEN 'beginner'::"Difficulty"
        WHEN 'intermediate' THEN 'intermediate'::"Difficulty"
        WHEN 'advanced' THEN 'advanced'::"Difficulty"
        ELSE NULL
      END
  END;

ALTER TABLE "Collection" DROP COLUMN "level";
ALTER TABLE "Collection" RENAME COLUMN "level_new" TO "level";
