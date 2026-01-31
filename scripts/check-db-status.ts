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

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Проверка состояния базы данных...\n');

    // Проверка таблиц
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    console.log('📊 Таблицы в БД:', tables.length);
    tables.forEach(t => console.log('  -', t.tablename));

    console.log('\n📈 Статистика:');
    const users = await prisma.user.count();
    const tests = await prisma.test.count();
    const questions = await prisma.question.count();
    const categories = await prisma.category.count();
    const testResults = await prisma.testResult.count();
    const lectures = await prisma.lecture.count();

    console.log(`  Users: ${users}`);
    console.log(`  Tests: ${tests}`);
    console.log(`  Questions: ${questions}`);
    console.log(`  Categories: ${categories}`);
    console.log(`  TestResults: ${testResults}`);
    console.log(`  Lectures: ${lectures}`);

    // Проверка индексов на TestResult
    console.log('\n🔎 Индексы на TestResult:');
    const indexes = await prisma.$queryRaw<Array<{ indexname: string, indexdef: string }>>`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'TestResult'
      AND schemaname = 'public'
      ORDER BY indexname
    `;
    if (indexes.length === 0) {
      console.log('  ⚠️  Нет индексов на TestResult!');
    } else {
      indexes.forEach(idx => console.log(`  - ${idx.indexname}`));
    }

    // Проверка индексов на PomodoroSession
    console.log('\n🔎 Индексы на PomodoroSession:');
    const pomodoroIndexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'PomodoroSession'
      AND schemaname = 'public'
      ORDER BY indexname
    `;
    if (pomodoroIndexes.length === 0) {
      console.log('  ⚠️  Нет индексов на PomodoroSession!');
    } else {
      pomodoroIndexes.forEach(idx => console.log(`  - ${idx.indexname}`));
    }

    // Проверка Many-to-Many связей
    console.log('\n🔍 Проверка Many-to-Many связей:');
    const categoryTests = await prisma.categoryTest.count();
    const collectionTests = await prisma.collectionTest.count();
    const testQuestions = await prisma.testQuestion.count();
    console.log(`  CategoryTest связи: ${categoryTests}`);
    console.log(`  CollectionTest связи: ${collectionTests}`);
    console.log(`  TestQuestion связи: ${testQuestions}`);

    // Проверка наличия поля mode в TestResult
    console.log('\n🔍 Проверка поля mode в TestResult:');
    const hasMode = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'TestResult'
        AND column_name = 'mode'
      ) as exists
    `;
    console.log(`  Поле mode существует: ${hasMode[0].exists ? '✅' : '❌'}`);

    console.log('\n✅ Проверка завершена!');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkDatabaseStatus();
