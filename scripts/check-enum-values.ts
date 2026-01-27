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

async function checkEnumValues() {
  try {
    console.log('🔍 Проверка значений для ENUM типов...\n');

    // 1. Проверка Test.difficulty
    const difficulties = await prisma.$queryRaw<Array<{ difficulty: string, count: bigint }>>`
      SELECT difficulty, COUNT(*) as count
      FROM "Test"
      GROUP BY difficulty
      ORDER BY count DESC
    `;

    console.log('📊 Test.difficulty:');
    difficulties.forEach(d => {
      const normalized = d.difficulty.toLowerCase();
      const isValid = ['beginner', 'intermediate', 'advanced'].includes(normalized);
      const icon = isValid ? '✅' : '⚠️';
      console.log(`   ${icon} "${d.difficulty}" (${normalized}): ${d.count} тестов`);
    });

    // 2. Проверка PomodoroSession.type
    const pomodoroTypes = await prisma.$queryRaw<Array<{ type: string, count: bigint }>>`
      SELECT type, COUNT(*) as count
      FROM "PomodoroSession"
      GROUP BY type
      ORDER BY count DESC
    `;

    console.log('\n📊 PomodoroSession.type:');
    if (pomodoroTypes.length === 0) {
      console.log('   📭 Нет данных (таблица пустая)');
    } else {
      pomodoroTypes.forEach(t => {
        const isValid = ['work', 'short_break', 'long_break'].includes(t.type.toLowerCase());
        const icon = isValid ? '✅' : '⚠️';
        console.log(`   ${icon} "${t.type}": ${t.count} сессий`);
      });
    }

    // 3. Проверка Collection.type
    const collectionTypes = await prisma.$queryRaw<Array<{ type: string, count: bigint }>>`
      SELECT type, COUNT(*) as count
      FROM "Collection"
      GROUP BY type
      ORDER BY count DESC
    `;

    console.log('\n📊 Collection.type:');
    if (collectionTypes.length === 0) {
      console.log('   📭 Нет данных (таблица пустая)');
    } else {
      collectionTypes.forEach(t => {
        const isValid = ['profession', 'learning_path', 'custom'].includes(t.type.toLowerCase());
        const icon = isValid ? '✅' : '⚠️';
        console.log(`   ${icon} "${t.type}": ${t.count} коллекций`);
      });
    }

    // 4. Проверка Collection.level
    const collectionLevels = await prisma.$queryRaw<Array<{ level: string | null, count: bigint }>>`
      SELECT level, COUNT(*) as count
      FROM "Collection"
      GROUP BY level
      ORDER BY count DESC
    `;

    console.log('\n📊 Collection.level:');
    if (collectionLevels.length === 0) {
      console.log('   📭 Нет данных (таблица пустая)');
    } else {
      collectionLevels.forEach(l => {
        if (l.level === null) {
          console.log(`   ℹ️  NULL: ${l.count} коллекций`);
        } else {
          const isValid = ['beginner', 'intermediate', 'advanced', 'mixed'].includes(l.level.toLowerCase());
          const icon = isValid ? '✅' : '⚠️';
          console.log(`   ${icon} "${l.level}": ${l.count} коллекций`);
        }
      });
    }

    // 5. Проверка TestResult.mode
    const testModes = await prisma.$queryRaw<Array<{ mode: string, count: bigint }>>`
      SELECT mode, COUNT(*) as count
      FROM "TestResult"
      GROUP BY mode
      ORDER BY count DESC
    `;

    console.log('\n📊 TestResult.mode:');
    testModes.forEach(m => {
      const isValid = ['learning', 'exam'].includes(m.mode.toLowerCase());
      const icon = isValid ? '✅' : '⚠️';
      console.log(`   ${icon} "${m.mode}": ${m.count} результатов`);
    });

    // Итоговое заключение
    console.log('\n' + '='.repeat(60));
    console.log('📋 РЕКОМЕНДАЦИИ ПО МИГРАЦИИ:');
    console.log('='.repeat(60));

    const allDifficultiesValid = difficulties.every(d =>
      ['beginner', 'intermediate', 'advanced'].includes(d.difficulty.toLowerCase())
    );

    if (allDifficultiesValid) {
      console.log('✅ Test.difficulty → можно мигрировать на ENUM');
    } else {
      console.log('⚠️  Test.difficulty → требуется нормализация данных');
    }

    if (pomodoroTypes.length === 0 || pomodoroTypes.every(t =>
      ['work', 'short_break', 'long_break'].includes(t.type.toLowerCase())
    )) {
      console.log('✅ PomodoroSession.type → можно мигрировать на ENUM');
    } else {
      console.log('⚠️  PomodoroSession.type → требуется нормализация данных');
    }

    console.log('✅ TestResult.mode → новое поле, можно создать ENUM сразу');

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkEnumValues();
