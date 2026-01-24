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

async function checkRequirementsTests() {
  try {
    console.log('🔍 Проверка тестов по теме "Требования к ПО"...\n');

    // Найти все тесты, которые содержат слово "требования" в названии
    const tests = await prisma.test.findMany({
      where: {
        OR: [
          { title: { contains: 'требования', mode: 'insensitive' } },
          { title: { contains: 'Требования', mode: 'insensitive' } },
          { title: { contains: 'Requirements', mode: 'insensitive' } }
        ]
      },
      include: {
        questions: {
          include: {
            question: {
              select: {
                id: true,
                lectureId: true
              }
            }
          }
        }
      },
      orderBy: { title: 'asc' }
    });

    console.log(`Найдено ${tests.length} тестов по теме "Требования"\n`);
    console.log('=' .repeat(80));

    for (const test of tests) {
      const questionsWithLectures = test.questions.filter(q => q.question.lectureId !== null).length;
      const totalQuestions = test.questions.length;
      const hasLecture = questionsWithLectures > 0;

      const status = hasLecture ? '✅' : '❌';

      console.log(`\n${status} ${test.title}`);
      console.log(`   Вопросов: ${totalQuestions}`);
      console.log(`   С лекциями: ${questionsWithLectures}`);

      if (!hasLecture) {
        console.log(`   ⚠️  ЛЕКЦИЯ ОТСУТСТВУЕТ!`);
      }
    }

    console.log('\n' + '='.repeat(80));

    const testsWithoutLectures = tests.filter(test =>
      test.questions.every(q => q.question.lectureId === null)
    );

    console.log(`\n📊 Статистика:`);
    console.log(`   Всего тестов: ${tests.length}`);
    console.log(`   С лекциями: ${tests.length - testsWithoutLectures.length}`);
    console.log(`   Без лекций: ${testsWithoutLectures.length}`);

    if (testsWithoutLectures.length > 0) {
      console.log(`\n🚨 Тесты БЕЗ лекций:`);
      testsWithoutLectures.forEach(test => {
        console.log(`   - ${test.title} (${test.questions.length} вопросов)`);
      });
    } else {
      console.log(`\n🎉 Все тесты по теме "Требования к ПО" имеют лекции!`);
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkRequirementsTests();
