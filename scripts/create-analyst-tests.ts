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

async function createAnalystTests() {
  try {
    console.log('🚀 Создание тестов для аналитиков...\n');

    // Найти категорию "Требования к ПО"
    const category = await prisma.category.findFirst({
      where: {
        slug: 'requirements'
      }
    });

    if (!category) {
      throw new Error('❌ Категория "Требования к ПО" не найдена!');
    }

    console.log('✅ Найдена категория:', category.name, '\n');

    // Создать тест "Бизнес-аналитик"
    console.log('📝 Создание теста "Бизнес-аналитик: Роль и обязанности"...');

    let baTest = await prisma.test.findFirst({
      where: {
        title: { contains: 'Бизнес-аналитик' }
      }
    });

    if (!baTest) {
      baTest = await prisma.test.create({
        data: {
          title: 'Бизнес-аналитик: Роль и обязанности',
          description: 'Роль бизнес-аналитика: сбор требований, работа со stakeholders, документирование (BRD, User Stories), техники анализа, навыки и инструменты.',
          difficulty: 'intermediate'
        }
      });

      // Привязать к категории
      const maxOrder = await prisma.categoryTest.findFirst({
        where: { categoryId: category.id },
        orderBy: { order: 'desc' }
      });

      await prisma.categoryTest.create({
        data: {
          categoryId: category.id,
          testId: baTest.id,
          order: (maxOrder?.order || 0) + 1
        }
      });

      console.log(`✅ Создан тест BA: ${baTest.id}`);
    } else {
      console.log(`⚠️  Тест BA уже существует: ${baTest.id}`);
    }

    // Создать тест "Системный аналитик"
    console.log('📝 Создание теста "Системный аналитик: Роль и обязанности"...');

    let saTest = await prisma.test.findFirst({
      where: {
        title: { contains: 'Системный аналитик' }
      }
    });

    if (!saTest) {
      saTest = await prisma.test.create({
        data: {
          title: 'Системный аналитик: Роль и обязанности',
          description: 'Роль системного аналитика: проектирование архитектуры, техническая документация (SRS, API Design, ERD), выбор технологий, UML/BPMN моделирование.',
          difficulty: 'advanced'
        }
      });

      // Привязать к категории
      const maxOrder = await prisma.categoryTest.findFirst({
        where: { categoryId: category.id },
        orderBy: { order: 'desc' }
      });

      await prisma.categoryTest.create({
        data: {
          categoryId: category.id,
          testId: saTest.id,
          order: (maxOrder?.order || 0) + 1
        }
      });

      console.log(`✅ Создан тест SA: ${saTest.id}`);
    } else {
      console.log(`⚠️  Тест SA уже существует: ${saTest.id}`);
    }

    console.log('\n🎉 Готово!');
    console.log(`📝 Тест Бизнес-аналитик ID: ${baTest.id}`);
    console.log(`📝 Тест Системный аналитик ID: ${saTest.id}`);

    // Вернуть IDs для использования в других скриптах
    return { baTestId: baTest.id, saTestId: saTest.id };

  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAnalystTests();
