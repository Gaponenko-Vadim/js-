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

async function verifyCategoryMigration() {
  try {
    console.log('🔍 Проверка миграции категорий...\n');

    // 1. Проверка тестов с category_id
    const testsWithCategoryId = await prisma.$queryRaw<Array<{ id: string, title: string, category_id: string }>>`
      SELECT id, title, category_id
      FROM "Test"
      WHERE category_id IS NOT NULL
    `;

    console.log(`📊 Тесты с category_id: ${testsWithCategoryId.length}`);
    if (testsWithCategoryId.length > 0) {
      console.log('   ⚠️  Найдены тесты с category_id:');
      testsWithCategoryId.forEach(t => console.log(`      - ${t.title} (categoryId: ${t.category_id})`));
    } else {
      console.log('   ✅ Нет тестов с category_id');
    }

    // 2. Проверка тестов без CategoryTest связи
    const testsWithoutCategory = await prisma.$queryRaw<Array<{ id: string, title: string, count: bigint }>>`
      SELECT t.id, t.title, COUNT(ct.id) as count
      FROM "Test" t
      LEFT JOIN category_tests ct ON t.id = ct."testId"
      GROUP BY t.id, t.title
      HAVING COUNT(ct.id) = 0
    `;

    console.log(`\n📊 Тесты без CategoryTest связи: ${testsWithoutCategory.length}`);
    if (testsWithoutCategory.length > 0) {
      console.log('   ⚠️  Найдены тесты без категории:');
      testsWithoutCategory.forEach(t => console.log(`      - ${t.title}`));
    } else {
      console.log('   ✅ Все тесты имеют связь с категориями');
    }

    // 3. Статистика CategoryTest
    const categoryTestStats = await prisma.$queryRaw<Array<{ category_name: string, test_count: bigint }>>`
      SELECT c.name as category_name, COUNT(ct.id) as test_count
      FROM "Category" c
      LEFT JOIN category_tests ct ON c.id = ct."categoryId"
      GROUP BY c.id, c.name
      ORDER BY test_count DESC
    `;

    console.log('\n📊 Статистика категорий:');
    categoryTestStats.forEach(stat => {
      console.log(`   ${stat.category_name}: ${stat.test_count} тестов`);
    });

    // 4. Проверка целостности foreign keys
    const orphanedCategoryTests = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT ct.id
      FROM category_tests ct
      LEFT JOIN "Test" t ON ct."testId" = t.id
      LEFT JOIN "Category" c ON ct."categoryId" = c.id
      WHERE t.id IS NULL OR c.id IS NULL
    `;

    console.log(`\n🔎 Orphaned CategoryTest записи: ${orphanedCategoryTests.length}`);
    if (orphanedCategoryTests.length > 0) {
      console.log('   ⚠️  Найдены orphaned записи (нужно почистить)');
    } else {
      console.log('   ✅ Все CategoryTest связи валидны');
    }

    // 5. Итоговое решение
    console.log('\n' + '='.repeat(60));
    console.log('📋 ИТОГОВОЕ ЗАКЛЮЧЕНИЕ:');
    console.log('='.repeat(60));

    const canRemoveCategoryId =
      testsWithCategoryId.length === 0 &&
      testsWithoutCategory.length === 0 &&
      orphanedCategoryTests.length === 0;

    if (canRemoveCategoryId) {
      console.log('✅ БЕЗОПАСНО удалить поле Test.categoryId');
      console.log('   - Все тесты мигрированы на CategoryTest');
      console.log('   - categoryId не используется');
      console.log('   - Данные целостны');
    } else {
      console.log('⚠️  НЕ РЕКОМЕНДУЕТСЯ удалять поле Test.categoryId');
      console.log('   - Требуется завершить миграцию');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

verifyCategoryMigration();
