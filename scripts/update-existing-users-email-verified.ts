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

async function updateExistingUsers() {
  try {
    console.log('Обновление существующих пользователей...');

    // Установить emailVerified для всех пользователей, у которых он null
    const result = await prisma.user.updateMany({
      where: {
        emailVerified: null,
      },
      data: {
        emailVerified: new Date(),
      },
    });

    console.log(`✅ Обновлено пользователей: ${result.count}`);
    console.log('Существующие пользователи считаются подтвержденными.');
  } catch (error) {
    console.error('Ошибка при обновлении:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

updateExistingUsers();
