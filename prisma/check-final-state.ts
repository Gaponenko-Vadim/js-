import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const tests = await prisma.test.findMany({
    include: {
      questions: {
        include: {
          question: true
        }
      }
    },
    orderBy: { difficulty: 'asc' }
  }) as any;

  console.log('\n📊 ФИНАЛЬНОЕ СОСТОЯНИЕ ТЕСТОВ:\n');

  const byDifficulty: { [key: string]: any[] } = {
    beginner: [],
    intermediate: [],
    advanced: []
  };

  tests.forEach(t => {
    const diff = t.difficulty.toLowerCase();
    if (byDifficulty[diff]) {
      byDifficulty[diff].push(t);
    }
  });

  (['beginner', 'intermediate', 'advanced'] as const).forEach(level => {
    const levelName = level.toUpperCase();
    console.log(`\n${levelName}:`);
    byDifficulty[level].forEach(t => {
      console.log(`  ✅ ${t.title}: ${t.questions.length} вопросов`);
    });
  });

  console.log('\n📈 СТАТИСТИКА:');
  let totalTests = 0;
  let totalQuestions = 0;

  Object.keys(byDifficulty).forEach(level => {
    const levelTests = byDifficulty[level];
    const levelQuestions = levelTests.reduce((sum, t) => sum + t.questions.length, 0);
    totalTests += levelTests.length;
    totalQuestions += levelQuestions;
    console.log(`  ${level.toUpperCase()}: ${levelTests.length} тестов, ${levelQuestions} вопросов`);
  });

  console.log(`\n  ВСЕГО: ${totalTests} тестов, ${totalQuestions} вопросов`);
}

check()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
