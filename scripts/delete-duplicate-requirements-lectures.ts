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

const CATEGORY_SLUG = 'requirements';

async function deleteDuplicateRequirementsLectures() {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: CATEGORY_SLUG }
    });

    if (!category) {
      throw new Error(`Category not found for slug: ${CATEGORY_SLUG}`);
    }

    const requirementTests = await prisma.test.findMany({
      where: { categories: { some: { categoryId: category.id } } },
      select: { title: true }
    });
    const requirementTestTitles = new Set(requirementTests.map((test) => test.title));

    const lectures = await prisma.lecture.findMany({
      include: {
        questions: {
          include: {
            tests: {
              include: {
                test: {
                  include: {
                    categories: { select: { categoryId: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    const requirementsLectures = lectures.filter((lecture) => {
      const hasRequirementQuestions = lecture.questions.some((question) =>
        question.tests.some((testQuestion) =>
          testQuestion.test.categories.some((ct) => ct.categoryId === category.id)
        )
      );

      return hasRequirementQuestions || requirementTestTitles.has(lecture.title);
    });

    const groupedByTitle = new Map<string, typeof requirementsLectures>();
    for (const lecture of requirementsLectures) {
      const list = groupedByTitle.get(lecture.title) ?? [];
      list.push(lecture);
      groupedByTitle.set(lecture.title, list);
    }

    const toDelete = Array.from(groupedByTitle.values())
      .filter((group) => group.length > 1)
      .flatMap((group) => group.filter((lecture) => lecture.questions.length === 0));

    if (toDelete.length === 0) {
      console.log('No duplicate requirement lectures with 0 questions found.');
      return;
    }

    console.log(`Found ${toDelete.length} duplicate lectures to delete:`);
    toDelete.forEach((lecture) => {
      console.log(`- ${lecture.title} (${lecture.id})`);
    });

    await prisma.lecture.deleteMany({
      where: { id: { in: toDelete.map((lecture) => lecture.id) } }
    });

    console.log('Done.');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

deleteDuplicateRequirementsLectures();
