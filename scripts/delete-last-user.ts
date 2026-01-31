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

async function deleteLastUser() {
  try {
    console.log('Поиск последнего зарегистрированного пользователя...');

    // Найти последнего пользователя (по createdAt)
    const lastUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!lastUser) {
      console.log('❌ Пользователи не найдены в базе данных.');
      return;
    }

    console.log(`✅ Найден последний пользователь:`);
    console.log(`   Email: ${lastUser.email}`);
    console.log(`   Имя: ${lastUser.name}`);
    console.log(`   ID: ${lastUser.id}`);
    console.log(`   Создан: ${lastUser.createdAt}`);
    console.log(`\nУдаление пользователя...`);

    // Удаление пользователя
    await prisma.user.delete({
      where: { id: lastUser.id },
    });

    console.log(`✅ Пользователь ${lastUser.email} успешно удален!`);
  } catch (error) {
    console.error('❌ Ошибка при удалении пользователя:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

deleteLastUser();
