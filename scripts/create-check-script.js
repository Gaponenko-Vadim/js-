const fs = require('fs');

const content = `import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkLectures() {
  const lectureIds = [
    'cmkmowzz70000y0vn800781mc',
    'cmkmuk9l20000ygvn1l1r1chs',
    'cmkmunsri000068vn0d98ev59',
    'cmkmukd8y00001svn4lgq6t69'
  ];

  for (const id of lectureIds) {
    const lecture = await prisma.lecture.findUnique({ where: { id } });

    if (!lecture) {
      console.log('Лекция ' + id + ' не найдена!');
      continue;
    }

    console.log('\\n📚 Лекция: ' + lecture.title);
    console.log('🆔 ID: ' + lecture.id);
    console.log('📏 Размер: ' + lecture.content.length + ' символов');

    const hasPractical = lecture.content.includes('## Практические сценарии');
    const hasMistakes = lecture.content.includes('## Типичные ошибки');

    console.log('✅ Практические сценарии: ' + (hasPractical ? 'ЕСТЬ' : 'НЕТ'));
    console.log('✅ Типичные ошибки: ' + (hasMistakes ? 'ЕСТЬ' : 'НЕТ'));

    const scenarios = lecture.content.match(/### Сценарий \\d+:/g);
    const mistakes = lecture.content.match(/### Ошибка \\d+:/g);

    console.log('📊 Сценариев: ' + (scenarios ? scenarios.length : 0));
    console.log('📊 Ошибок: ' + (mistakes ? mistakes.length : 0));
  }

  await prisma.$disconnect();
}

checkLectures().catch(console.error);
`;

fs.writeFileSync('scripts/check-lectures.ts', content);
console.log('✅ Скрипт создан!');
