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
    where: { id: 'cmkmukd8y00001svn4lgq6t69' }
  });

  const conclusionIndex = lecture.content.lastIndexOf('## Заключение');
  if (conclusionIndex !== -1) {
    const conclusion = lecture.content.substring(conclusionIndex);
    console.log('=== ЗАКЛЮЧЕНИЕ UI/UX ЛЕКЦИИ ===');
    console.log(conclusion);
  }

  await prisma.$disconnect();
}

dumpLecture().catch(console.error);
`;

fs.writeFileSync('scripts/dump-uiux.ts', content);
console.log('✅ Скрипт создан!');
