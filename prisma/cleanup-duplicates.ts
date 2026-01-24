import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function cleanup() {
  console.log('🧹 Cleaning up duplicate tests...\n');

  const tests = await prisma.test.findMany({
    include: {
      _count: { select: { questions: true } }
    }
  });

  // Группируем по названию
  const testsByTitle = new Map<string, any[]>();
  tests.forEach(test => {
    if (!testsByTitle.has(test.title)) {
      testsByTitle.set(test.title, []);
    }
    testsByTitle.get(test.title)!.push(test);
  });

  // Находим дубликаты
  let deletedCount = 0;
  for (const [title, duplicates] of testsByTitle) {
    if (duplicates.length > 1) {
      console.log(`📋 Found ${duplicates.length} copies of "${title}":`);
      duplicates.forEach(t => {
        console.log(`   - ID: ${t.id}, Questions: ${t._count.questions}`);
      });

      // Сортируем по количеству вопросов (по убыванию)
      duplicates.sort((a, b) => b._count.questions - a._count.questions);

      // Оставляем первый (с максимальным количеством вопросов), удаляем остальные
      const toKeep = duplicates[0];
      const toDelete = duplicates.slice(1);

      console.log(`   ✅ Keeping: ${toKeep.id} (${toKeep._count.questions} questions)`);

      for (const test of toDelete) {
        console.log(`   ❌ Deleting: ${test.id} (${test._count.questions} questions)`);
        await prisma.test.delete({ where: { id: test.id } });
        deletedCount++;
      }
      console.log();
    }
  }

  console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} duplicate tests.`);
}

cleanup()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
