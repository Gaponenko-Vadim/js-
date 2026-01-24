import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Создание теста "Марафон по теме REST API"...\n');

  // Получаем все тесты с их вопросами
  const allTests = await prisma.test.findMany({
    include: {
      questions: {
        include: {
          question: true,
        },
        orderBy: {
          order: 'asc',
        }
      }
    },
    orderBy: {
      createdAt: 'asc',
    }
  });

  // Собираем все уникальные вопросы
  const allQuestions = new Set<string>();
  const questionsList: any[] = [];

  allTests.forEach((test) => {
    test.questions.forEach((tq) => {
      if (!allQuestions.has(tq.question.id)) {
        allQuestions.add(tq.question.id);
        questionsList.push(tq.question);
      }
    });
  });

  console.log(`📝 Найдено ${questionsList.length} уникальных вопросов из ${allTests.length} тестов`);

  // Проверяем, не существует ли уже марафонский тест
  const existingMarathon = await prisma.test.findFirst({
    where: {
      title: 'REST API: Марафон по теме',
    }
  });

  if (existingMarathon) {
    console.log('⚠️  Тест "Марафон по теме REST API" уже существует. Удаляем старый...');
    await prisma.testQuestion.deleteMany({
      where: { testId: existingMarathon.id }
    });
    await prisma.test.delete({
      where: { id: existingMarathon.id }
    });
  }

  // Создаём новый тест
  const marathonTest = await prisma.test.create({
    data: {
      title: 'REST API: Марафон по теме',
      description: `Комплексный тест включающий все ${questionsList.length} вопросов по REST API из всех разделов`,
      difficulty: 'advanced',
    }
  });

  console.log(`✅ Создан тест: "${marathonTest.title}"`);
  console.log(`📋 Добавление ${questionsList.length} вопросов...`);

  // Связываем все вопросы с марафонским тестом
  for (let i = 0; i < questionsList.length; i++) {
    await prisma.testQuestion.create({
      data: {
        testId: marathonTest.id,
        questionId: questionsList[i].id,
        order: i,
      }
    });

    if ((i + 1) % 50 === 0) {
      console.log(`   ... добавлено ${i + 1} вопросов`);
    }
  }

  console.log(`\n🎉 Тест "Марафон по теме REST API" успешно создан!`);
  console.log(`📊 Статистика:`);
  console.log(`   - Название: ${marathonTest.title}`);
  console.log(`   - Сложность: ${marathonTest.difficulty}`);
  console.log(`   - Всего вопросов: ${questionsList.length}`);
  console.log(`   - ID теста: ${marathonTest.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
