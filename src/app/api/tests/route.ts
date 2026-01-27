import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get('difficulty');
    const profession = searchParams.get('profession');
    const categorySlug = searchParams.get('category');

    // Если указана категория, используем новую Many-to-Many структуру
    if (categorySlug) {
      // Находим категорию по slug
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug }
      });

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }

      // Получаем тесты через CategoryTest
      const testFilter: any = {};
      if (difficulty) testFilter.difficulty = difficulty;
      if (profession) testFilter.tags = { has: profession };

      const categoryTests = await prisma.categoryTest.findMany({
        where: {
          categoryId: category.id,
          ...(Object.keys(testFilter).length > 0 && { test: testFilter })
        },
        include: {
          test: {
            include: {
              categories: {
                include: {
                  category: {
                    select: {
                      id: true,
                      slug: true,
                      name: true,
                      icon: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { order: 'asc' }
      });

      const tests = categoryTests.map(ct => ct.test);
      return NextResponse.json(tests);
    }

    // Если категория не указана, получаем все тесты
    const whereFilter: any = {};
    if (difficulty) whereFilter.difficulty = difficulty;
    if (profession) whereFilter.tags = { has: profession };

    const tests = await prisma.test.findMany({
      where: whereFilter,
      include: {
        categories: {
          include: {
            category: {
              select: {
                id: true,
                slug: true,
                name: true,
                icon: true
              }
            }
          }
        }
      }
    });

    // Сортировка по уровню сложности: beginner → intermediate → advanced
    const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    const sortedTests = tests.sort((a, b) => {
      const orderA = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 999;
      const orderB = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 999;
      return orderA - orderB;
    });

    return NextResponse.json(sortedTests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
