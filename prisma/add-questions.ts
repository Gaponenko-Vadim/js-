import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Типы
type QuestionData = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type TestData = {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: QuestionData[];
};

// Функция для добавления теста с вопросами
async function addTest(testData: TestData) {
  // Проверяем существует ли тест
  const existing = await prisma.test.findFirst({
    where: { title: testData.title }
  });

  if (existing) {
    console.log(`⚠️  Test "${testData.title}" already exists, skipping...`);
    return;
  }

  // Создаем тест
  const test = await prisma.test.create({
    data: {
      title: testData.title,
      description: testData.description,
      difficulty: testData.difficulty,
    }
  });

  // Добавляем вопросы
  for (let i = 0; i < testData.questions.length; i++) {
    const q = testData.questions[i];
    await prisma.question.create({
      data: {
        testId: test.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        order: i,
      }
    });
  }

  console.log(`✅ Added test "${testData.title}" with ${testData.questions.length} questions`);
}

// Данные тестов
const tests: TestData[] = [
  // Добавим сюда все тесты...
  // Пока пример с одним тестом
  {
    title: 'Тестовый тест',
    description: 'Проверка работы новой системы',
    difficulty: 'beginner',
    questions: [
      {
        question: 'Тестовый вопрос 1?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0,
        explanation: 'Тестовое объяснение'
      },
      {
        question: 'Тестовый вопрос 2?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 1,
        explanation: 'Тестовое объяснение 2'
      }
    ]
  }
];

async function main() {
  console.log('🌱 Adding questions to database...');

  for (const testData of tests) {
    await addTest(testData);
  }

  console.log('🎉 All tests added successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
