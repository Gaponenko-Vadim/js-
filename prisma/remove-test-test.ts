import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function removeTestTest() {
  const testTest = await prisma.test.findFirst({
    where: { title: 'Тестовый тест' }
  });

  if (testTest) {
    await prisma.test.delete({ where: { id: testTest.id } });
    console.log('✅ Removed "Тестовый тест"');
  } else {
    console.log('ℹ️  "Тестовый тест" not found');
  }
}

removeTestTest()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
