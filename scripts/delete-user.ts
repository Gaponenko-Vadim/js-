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

async function deleteUser(email: string) {
  try {
    console.log(`Поиск пользователя с email: ${email}...`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ Пользователь с email ${email} не найден.`);
      return;
    }

    console.log(`✅ Найден пользователь: ${user.name} (ID: ${user.id})`);
    console.log(`Удаление пользователя и всех связанных данных...`);

    // Удаление пользователя (все связанные записи удалятся автоматически через onDelete: Cascade)
    await prisma.user.delete({
      where: { email },
    });

    console.log(`✅ Пользователь ${email} успешно удален из базы данных!`);
  } catch (error) {
    console.error('❌ Ошибка при удалении пользователя:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Email пользователя для удаления
const emailToDelete = 'gaponenko-21@inbox.ru';
deleteUser(emailToDelete);
