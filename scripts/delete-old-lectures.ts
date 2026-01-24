import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function deleteOldLectures() {
  console.log('🗑️  Удаление старых лекций...\n');

  try {
    // Найти лекции по топикам
    const lectures = await prisma.lecture.findMany({
      where: {
        OR: [
          { title: { contains: 'User Stories' } },
          { title: { contains: 'Use Cases' } }
        ]
      }
    });

    console.log(`Найдено лекций для удаления: ${lectures.length}\n`);

    for (const lecture of lectures) {
      console.log(`Удаляю: ${lecture.title}`);

      // Сначала отвязываем вопросы
      await prisma.question.updateMany({
        where: { lectureId: lecture.id },
        data: { lectureId: null }
      });

      // Затем удаляем лекцию
      await prisma.lecture.delete({
        where: { id: lecture.id }
      });

      console.log(`  ✅ Удалено`);
    }

    console.log('\n✅ Все старые лекции удалены!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteOldLectures();
