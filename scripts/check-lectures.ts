import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lectures = await prisma.lecture.findMany({
    select: { id: true, title: true, topic: true },
    orderBy: { topic: 'asc' }
  });

  console.log('Всего лекций:', lectures.length);
  console.log('\nСписок лекций:');
  lectures.forEach(l => {
    console.log(`- [${l.topic}] ${l.title}`);
  });
}

main()
  .finally(() => prisma.$disconnect());
