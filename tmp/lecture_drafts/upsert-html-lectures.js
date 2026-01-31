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

const lectures = [
  {
    title: 'HTML: доступность и ARIA основы',
    topic: 'HTML',
    file: 'html-accessibility-aria.txt'
  },
  {
    title: 'HTML: метаданные и SEO',
    topic: 'HTML',
    file: 'html-metadata-seo.txt'
  },
  {
    title: 'HTML: best practices и типичные ошибки',
    topic: 'HTML',
    file: 'html-best-practices-errors.txt'
  }
];

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

async function upsertLecture(lecture) {
  const filePath = path.resolve(__dirname, lecture.file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const sections = parseDraft(raw);

  const data = {
    title: lecture.title,
    topic: lecture.topic,
    content: sections.CONTENT,
    scenariosContent: sections.SCENARIOS,
    exampleContent: sections.EXAMPLE,
    tasksContent: sections.TASKS
  };

  const existing = await prisma.lecture.findFirst({ where: { title: lecture.title } });

  if (existing) {
    await prisma.lecture.update({ where: { id: existing.id }, data });
    console.log(`updated: ${lecture.title}`);
  } else {
    const created = await prisma.lecture.create({ data });
    console.log(`created: ${lecture.title} (${created.id})`);
  }
}

async function main() {
  for (const lecture of lectures) {
    await upsertLecture(lecture);
  }
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
