const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const lectureMeta = {
  title: 'CSS: подключение и базовый синтаксис',
  topic: 'CSS',
  file: 'css-connection-syntax.txt'
};

function parseDraft(text) {
  const parts = text.split(/---(CONTENT|SCENARIOS|EXAMPLE|TASKS)---/);
  const sections = {};

  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i];
    const value = (parts[i + 1] || '').trim();
    sections[key] = value;
  }

  const required = ['CONTENT', 'SCENARIOS', 'EXAMPLE', 'TASKS'];
  for (const key of required) {
    if (!sections[key]) {
      throw new Error(`Missing section ${key}`);
    }
  }

  return sections;
}

async function upsertLecture() {
  const filePath = path.resolve(__dirname, lectureMeta.file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const sections = parseDraft(raw);

  const data = {
    title: lectureMeta.title,
    topic: lectureMeta.topic,
    content: sections.CONTENT,
    scenariosContent: sections.SCENARIOS,
    exampleContent: sections.EXAMPLE,
    tasksContent: sections.TASKS
  };

  const existing = await prisma.lecture.findFirst({ where: { title: lectureMeta.title } });

  if (existing) {
    await prisma.lecture.update({ where: { id: existing.id }, data });
    console.log(`updated: ${lectureMeta.title}`);
  } else {
    const created = await prisma.lecture.create({ data });
    console.log(`created: ${lectureMeta.title} (${created.id})`);
  }
}

upsertLecture()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
