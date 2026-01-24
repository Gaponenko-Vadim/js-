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

async function dumpLecture() {
  const lecture = await prisma.lecture.findUnique({
    where: { id: 'cmkmowzz70000y0vn800781mc' }
  });

  if (!lecture) {
    console.log('Лекция не найдена!');
    return;
  }

  console.log('Лекция:', lecture.title);
  console.log('Размер:', lecture.content.length);
  console.log('\\n=== СОДЕРЖИМОЕ ===\\n');
  console.log(lecture.content);

  await prisma.$disconnect();
}

dumpLecture().catch(console.error);
`;

fs.writeFileSync('scripts/dump-lecture.ts', content);
console.log('✅ Скрипт создан!');
