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

type Profession = {
  id: string;
  name: string;
  tag: string;
  icon: string;
  description: string;
};

const professions: Profession[] = [
  {
    id: 'system-analyst',
    name: 'Системный аналитик',
    tag: 'system-analyst',
    icon: '📊',
    description: 'Марафон для системных аналитиков - все вопросы по проектированию REST API, документации, требованиям и архитектуре систем.',
  },
  {
    id: 'qa-engineer',
    name: 'QA Engineer',
    tag: 'qa-engineer',
    icon: '🧪',
    description: 'Марафон для QA инженеров - все вопросы по тестированию REST API, валидации, error handling, статус кодам и безопасности.',
  },
  {
    id: 'frontend',
    name: 'Frontend Developer',
    tag: 'frontend',
    icon: '💻',
    description: 'Марафон для Frontend разработчиков - все вопросы по HTTP методам, CORS, авторизации, работе с API в браузере.',
  },
  {
    id: 'backend',
    name: 'Backend Developer',
    tag: 'backend',
    icon: '⚙️',
    description: 'Марафон для Backend разработчиков - все вопросы по REST API, включая проектирование, безопасность, производительность и интеграции.',
  },
  {
    id: 'fullstack',
    name: 'Fullstack Developer',
    tag: 'fullstack',
    icon: '🌐',
    description: 'Марафон для Fullstack разработчиков - все вопросы по REST API, охватывающие frontend, backend, архитектуру и DevOps.',
  },
];

async function createProfessionMarathons() {
  console.log('🚀 Создание марафонских тестов по профессиям...\n');

  try {
    // Получаем все тесты с их вопросами
    const allTests = await prisma.test.findMany({
      include: {
        questions: {
          include: {
            question: true,
          },
        },
      },
    });

    console.log(`📊 Всего тестов в БД: ${allTests.length}\n`);

    for (const profession of professions) {
      console.log(`\n${profession.icon} Создание марафона для: ${profession.name}`);
      console.log('─'.repeat(60));

      // Находим все тесты для этой профессии
      const professionTests = allTests.filter((test) =>
        test.tags.includes(profession.tag)
      );

      console.log(`   Найдено тестов: ${professionTests.length}`);

      // Собираем все уникальные вопросы
      const uniqueQuestionIds = new Set<string>();
      professionTests.forEach((test) => {
        test.questions.forEach((tq) => {
          uniqueQuestionIds.add(tq.questionId);
        });
      });

      const questionCount = uniqueQuestionIds.size;
      console.log(`   Уникальных вопросов: ${questionCount}`);

      if (questionCount === 0) {
        console.log(`   ⚠️  Нет вопросов для профессии ${profession.name}, пропускаем`);
        continue;
      }

      // Проверяем существует ли уже марафон для этой профессии
      const marathonTitle = `${profession.icon} Марафон: ${profession.name}`;
      const existingMarathon = await prisma.test.findFirst({
        where: { title: marathonTitle },
      });

      if (existingMarathon) {
        console.log(`   ⚠️  Марафон уже существует (ID: ${existingMarathon.id})`);
        console.log(`   🗑️  Удаляем старый марафон...`);

        // Удаляем связи TestQuestion
        await prisma.testQuestion.deleteMany({
          where: { testId: existingMarathon.id },
        });

        // Удаляем сам тест
        await prisma.test.delete({
          where: { id: existingMarathon.id },
        });

        console.log(`   ✅ Старый марафон удален`);
      }

      // Создаем новый марафон
      const marathon = await prisma.test.create({
        data: {
          title: marathonTitle,
          description: profession.description,
          difficulty: 'advanced',
          tags: [profession.tag],
          createdAt: new Date(),
        },
      });

      console.log(`   ✅ Марафон создан (ID: ${marathon.id})`);

      // Добавляем все вопросы к марафону
      let order = 1;
      for (const questionId of uniqueQuestionIds) {
        await prisma.testQuestion.create({
          data: {
            testId: marathon.id,
            questionId: questionId,
            order: order++,
          },
        });
      }

      console.log(`   ✅ Добавлено ${questionCount} вопросов`);
      console.log(`   📈 Статистика:`);
      console.log(`      - Название: ${marathon.title}`);
      console.log(`      - Вопросов: ${questionCount}`);
      console.log(`      - Уровень: ${marathon.difficulty}`);
      console.log(`      - Тег: ${marathon.tags.join(', ')}`);
    }

    // Итоговая статистика
    console.log('\n\n' + '═'.repeat(60));
    console.log('📊 ИТОГОВАЯ СТАТИСТИКА');
    console.log('═'.repeat(60));

    const marathons = await prisma.test.findMany({
      where: {
        title: {
          contains: 'Марафон:',
        },
      },
      include: {
        questions: true,
      },
    });

    console.log(`\n✅ Создано марафонов: ${marathons.length}`);
    marathons.forEach((marathon) => {
      console.log(`   ${marathon.title}: ${marathon.questions.length} вопросов`);
    });

    // Общая статистика всех тестов
    const allTestsCount = await prisma.test.count();
    console.log(`\n📚 Всего тестов в системе: ${allTestsCount}`);
    console.log(`   - Обычные тесты: ${allTestsCount - marathons.length}`);
    console.log(`   - Марафоны: ${marathons.length}`);

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createProfessionMarathons()
  .then(() => {
    console.log('\n🎉 Марафоны успешно созданы!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Ошибка:', error);
    process.exit(1);
  });
