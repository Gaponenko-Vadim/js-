const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const oldText = 'Зачем нужен label у поля формы?';
const newText = 'Почему label важен для поля формы?';
const options = [
  'Он связывает поле и подпись, улучшая доступность',
  'Он заменяет атрибут name при отправке',
  'Он делает поле обязательным',
  'Он отключает автозаполнение'
];
const explanation = 'Label объясняет, что вводить, и делает поле доступным. Он не заменяет name и не управляет обязательностью.';

async function main() {
  const [accessLecture, bestLecture, bestTest] = await Promise.all([
    prisma.lecture.findFirst({ where: { title: 'HTML: доступность и ARIA основы' } }),
    prisma.lecture.findFirst({ where: { title: 'HTML: best practices и типичные ошибки' } }),
    prisma.test.findFirst({ where: { title: 'HTML: best practices и типичные ошибки' } })
  ]);

  if (!accessLecture || !bestLecture || !bestTest) {
    throw new Error('Required lecture or test not found');
  }

  const oldQuestion = await prisma.question.findFirst({ where: { question: oldText } });
  if (oldQuestion) {
    await prisma.question.update({
      where: { id: oldQuestion.id },
      data: { lectureId: accessLecture.id }
    });

    await prisma.testQuestion.deleteMany({
      where: { testId: bestTest.id, questionId: oldQuestion.id }
    });
  }

  let newQuestion = await prisma.question.findFirst({ where: { question: newText } });
  if (!newQuestion) {
    newQuestion = await prisma.question.create({
      data: {
        question: newText,
        options,
        correctAnswer: 0,
        explanation,
        lectureId: bestLecture.id
      }
    });
  } else {
    await prisma.question.update({
      where: { id: newQuestion.id },
      data: { options, correctAnswer: 0, explanation, lectureId: bestLecture.id }
    });
  }

  const linkExists = await prisma.testQuestion.findFirst({
    where: { testId: bestTest.id, questionId: newQuestion.id }
  });

  if (!linkExists) {
    const maxOrder = await prisma.testQuestion.findFirst({
      where: { testId: bestTest.id },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    await prisma.testQuestion.create({
      data: {
        testId: bestTest.id,
        questionId: newQuestion.id,
        order: (maxOrder?.order || 0) + 1
      }
    });
  }

  console.log('Fixed label question linkage.');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
