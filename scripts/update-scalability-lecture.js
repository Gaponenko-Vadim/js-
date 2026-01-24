const fs = require('fs');
const path = require('path');

// Read the new lecture content from v2 file
const v2FilePath = path.join(__dirname, 'create-scalability-reliability-test-v2.ts');
const v2Content = fs.readFileSync(v2FilePath, 'utf-8');

// Extract lectureContent from the file
const match = v2Content.match(/const lectureContent = `([^`]+(?:`(?!;)[^`]*)*)`/s);
if (!match) {
  console.log('❌ Could not find lectureContent in v2 file');
  process.exit(1);
}

const newLectureContent = match[1];

// Create update script
const updateScript = `import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const newContent = \`${newLectureContent.replace(/`/g, '\\`')}\`;

async function updateLecture() {
  try {
    const lectureId = 'cmkmowzz70000y0vn800781mc'; // Scalability lecture ID

    console.log('📝 Обновление лекции "Требования к масштабируемости и надежности"...');

    const updated = await prisma.lecture.update({
      where: { id: lectureId },
      data: { content: newContent }
    });

    console.log('✅ Лекция успешно обновлена!');
    console.log('📊 Размер нового контента:', newContent.length, 'символов');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

updateLecture();
`;

fs.writeFileSync(path.join(__dirname, 'update-scalability-lecture.ts'), updateScript);
console.log('✅ Скрипт обновления создан!');
