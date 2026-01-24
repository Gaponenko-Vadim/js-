import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrateQuestions() {
  console.log('🔄 Starting questions migration...');

  try {
    // 1. Получаем все тесты со старой структурой
    const tests = await prisma.$queryRaw<any[]>`
      SELECT id, title, questions FROM "Test"
    `;

    console.log(`📊 Found ${tests.length} tests to migrate`);

    // 2. Создаем новую таблицу Question
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Question" (
        id TEXT PRIMARY KEY,
        "testId" TEXT NOT NULL,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        "correctAnswer" INTEGER NOT NULL,
        explanation TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Question_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"(id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Question_testId_order_idx" ON "Question"("testId", "order")
    `;

    console.log('✅ Question table created');

    // 3. Мигрируем вопросы для каждого теста
    for (const test of tests) {
      const questions = test.questions as any[];
      console.log(`  Migrating ${questions.length} questions for test: ${test.title}`);

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionId = `q_${test.id}_${i}`;

        await prisma.$executeRaw`
          INSERT INTO "Question" (id, "testId", question, options, "correctAnswer", explanation, "order")
          VALUES (
            ${questionId},
            ${test.id},
            ${q.question},
            ${JSON.stringify(q.options)}::jsonb,
            ${q.correctAnswer},
            ${q.explanation || ''},
            ${i}
          )
          ON CONFLICT (id) DO NOTHING
        `;
      }

      console.log(`  ✅ Migrated ${questions.length} questions`);
    }

    // 4. Удаляем колонку questions из Test
    await prisma.$executeRaw`
      ALTER TABLE "Test" DROP COLUMN IF EXISTS questions
    `;

    console.log('✅ Dropped questions column from Test table');
    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateQuestions()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
