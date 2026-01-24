/**
 * СОЗДАНИЕ ПРИМЕРОВ КОЛЛЕКЦИЙ
 *
 * Создаёт сборные программы обучения для разных профессий
 * Примеры: "Всё для системного аналитика", "Fullstack Developer Path"
 */

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

async function createExampleCollections() {
  console.log('🎨 СОЗДАНИЕ ПРИМЕРОВ КОЛЛЕКЦИЙ\n');
  console.log('═'.repeat(70));

  try {
    // ============================================================
    // ПОЛУЧАЕМ ТЕСТЫ ПО ТЕГАМ
    // ============================================================
    console.log('\n📦 Получение тестов из БД...');

    const allTests = await prisma.test.findMany({
      select: {
        id: true,
        title: true,
        difficulty: true,
        tags: true
      }
    });

    console.log(`✅ Найдено ${allTests.length} тестов\n`);

    // ============================================================
    // КОЛЛЕКЦИЯ 1: Системный аналитик
    // ============================================================
    console.log('📊 Создание: "Всё для системного аналитика"');

    const analystTests = allTests.filter(t => t.tags.includes('system-analyst'));
    console.log(`   Найдено тестов: ${analystTests.length}`);

    let analystCollection = await prisma.collection.findUnique({
      where: { slug: 'system-analyst-full' }
    });

    if (!analystCollection) {
      analystCollection = await prisma.collection.create({
        data: {
          name: 'Системный аналитик: Полная программа',
          slug: 'system-analyst-full',
          description: 'Комплексная программа обучения для системных аналитиков: REST API, требования к ПО, документирование, приоритизация.',
          icon: '📊',
          type: 'profession',
          targetRole: 'system-analyst',
          estimatedHours: 35,
          level: 'mixed',
          order: 1
        }
      });
      console.log('   ✅ Коллекция создана');
    } else {
      console.log('   ⚠️  Коллекция уже существует');
    }

    // Добавляем тесты в коллекцию
    let order = 1;
    for (const test of analystTests) {
      const existing = await prisma.collectionTest.findFirst({
        where: {
          collectionId: analystCollection.id,
          testId: test.id
        }
      });

      if (!existing) {
        await prisma.collectionTest.create({
          data: {
            collectionId: analystCollection.id,
            testId: test.id,
            order: order++,
            isRequired: true
          }
        });
      }
    }
    console.log(`   ✅ Добавлено тестов: ${analystTests.length}\n`);

    // ============================================================
    // КОЛЛЕКЦИЯ 2: QA Engineer
    // ============================================================
    console.log('🧪 Создание: "QA Engineer: Полная программа"');

    const qaTests = allTests.filter(t => t.tags.includes('qa-engineer'));
    console.log(`   Найдено тестов: ${qaTests.length}`);

    let qaCollection = await prisma.collection.findUnique({
      where: { slug: 'qa-engineer-full' }
    });

    if (!qaCollection) {
      qaCollection = await prisma.collection.create({
        data: {
          name: 'QA Engineer: Полная программа',
          slug: 'qa-engineer-full',
          description: 'Программа для QA инженеров: тестирование API, требования, автоматизация тестов.',
          icon: '🧪',
          type: 'profession',
          targetRole: 'qa-engineer',
          estimatedHours: 40,
          level: 'mixed',
          order: 2
        }
      });
      console.log('   ✅ Коллекция создана');
    } else {
      console.log('   ⚠️  Коллекция уже существует');
    }

    order = 1;
    for (const test of qaTests) {
      const existing = await prisma.collectionTest.findFirst({
        where: {
          collectionId: qaCollection.id,
          testId: test.id
        }
      });

      if (!existing) {
        await prisma.collectionTest.create({
          data: {
            collectionId: qaCollection.id,
            testId: test.id,
            order: order++,
            isRequired: true
          }
        });
      }
    }
    console.log(`   ✅ Добавлено тестов: ${qaTests.length}\n`);

    // ============================================================
    // КОЛЛЕКЦИЯ 3: Frontend Developer
    // ============================================================
    console.log('💻 Создание: "Frontend Developer: Полная программа"');

    const frontendTests = allTests.filter(t => t.tags.includes('frontend'));
    console.log(`   Найдено тестов: ${frontendTests.length}`);

    let frontendCollection = await prisma.collection.findUnique({
      where: { slug: 'frontend-developer-full' }
    });

    if (!frontendCollection) {
      frontendCollection = await prisma.collection.create({
        data: {
          name: 'Frontend Developer: Полная программа',
          slug: 'frontend-developer-full',
          description: 'Программа для frontend разработчиков: работа с REST API, UI/UX, безопасность, производительность.',
          icon: '💻',
          type: 'profession',
          targetRole: 'frontend',
          estimatedHours: 30,
          level: 'mixed',
          order: 3
        }
      });
      console.log('   ✅ Коллекция создана');
    } else {
      console.log('   ⚠️  Коллекция уже существует');
    }

    order = 1;
    for (const test of frontendTests) {
      const existing = await prisma.collectionTest.findFirst({
        where: {
          collectionId: frontendCollection.id,
          testId: test.id
        }
      });

      if (!existing) {
        await prisma.collectionTest.create({
          data: {
            collectionId: frontendCollection.id,
            testId: test.id,
            order: order++,
            isRequired: true
          }
        });
      }
    }
    console.log(`   ✅ Добавлено тестов: ${frontendTests.length}\n`);

    // ============================================================
    // КОЛЛЕКЦИЯ 4: Backend Developer
    // ============================================================
    console.log('⚙️  Создание: "Backend Developer: Полная программа"');

    const backendTests = allTests.filter(t => t.tags.includes('backend'));
    console.log(`   Найдено тестов: ${backendTests.length}`);

    let backendCollection = await prisma.collection.findUnique({
      where: { slug: 'backend-developer-full' }
    });

    if (!backendCollection) {
      backendCollection = await prisma.collection.create({
        data: {
          name: 'Backend Developer: Полная программа',
          slug: 'backend-developer-full',
          description: 'Полная программа для backend разработчиков: REST API, базы данных, архитектура, безопасность.',
          icon: '⚙️',
          type: 'profession',
          targetRole: 'backend',
          estimatedHours: 50,
          level: 'mixed',
          order: 4
        }
      });
      console.log('   ✅ Коллекция создана');
    } else {
      console.log('   ⚠️  Коллекция уже существует');
    }

    order = 1;
    for (const test of backendTests) {
      const existing = await prisma.collectionTest.findFirst({
        where: {
          collectionId: backendCollection.id,
          testId: test.id
        }
      });

      if (!existing) {
        await prisma.collectionTest.create({
          data: {
            collectionId: backendCollection.id,
            testId: test.id,
            order: order++,
            isRequired: true
          }
        });
      }
    }
    console.log(`   ✅ Добавлено тестов: ${backendTests.length}\n`);

    // ============================================================
    // КОЛЛЕКЦИЯ 5: Fullstack Developer
    // ============================================================
    console.log('🌐 Создание: "Fullstack Developer: Полная программа"');

    const fullstackTests = allTests.filter(t => t.tags.includes('fullstack'));
    console.log(`   Найдено тестов: ${fullstackTests.length}`);

    let fullstackCollection = await prisma.collection.findUnique({
      where: { slug: 'fullstack-developer-full' }
    });

    if (!fullstackCollection) {
      fullstackCollection = await prisma.collection.create({
        data: {
          name: 'Fullstack Developer: Полная программа',
          slug: 'fullstack-developer-full',
          description: 'Комплексная программа для fullstack разработчиков: frontend, backend, API, DevOps.',
          icon: '🌐',
          type: 'profession',
          targetRole: 'fullstack',
          estimatedHours: 60,
          level: 'mixed',
          order: 5
        }
      });
      console.log('   ✅ Коллекция создана');
    } else {
      console.log('   ⚠️  Коллекция уже существует');
    }

    order = 1;
    for (const test of fullstackTests) {
      const existing = await prisma.collectionTest.findFirst({
        where: {
          collectionId: fullstackCollection.id,
          testId: test.id
        }
      });

      if (!existing) {
        await prisma.collectionTest.create({
          data: {
            collectionId: fullstackCollection.id,
            testId: test.id,
            order: order++,
            isRequired: true
          }
        });
      }
    }
    console.log(`   ✅ Добавлено тестов: ${fullstackTests.length}\n`);

    // ============================================================
    // ИТОГОВАЯ СТАТИСТИКА
    // ============================================================
    console.log('═'.repeat(70));
    console.log('📊 ИТОГОВАЯ СТАТИСТИКА');
    console.log('═'.repeat(70) + '\n');

    const collections = await prisma.collection.findMany({
      include: {
        tests: true
      },
      orderBy: { order: 'asc' }
    });

    for (const collection of collections) {
      console.log(`${collection.icon} ${collection.name}`);
      console.log(`   Тестов: ${collection.tests.length}`);
      console.log(`   Время: ~${collection.estimatedHours} часов`);
      console.log(`   URL: /collections/${collection.slug}\n`);
    }

    console.log('✅ Все коллекции созданы успешно!\n');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createExampleCollections()
  .then(() => {
    console.log('🎉 Создание коллекций завершено!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Ошибка:', error);
    process.exit(1);
  });
