import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Отключаем кеширование для этого роута
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');

    // Получаем лекции с фильтрацией по категории
    const lectures = await prisma.lecture.findMany({
      include: {
        questions: {
          include: {
            tests: {
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
                          }
                        }
                      }
                    }
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { topic: 'asc' },
    });

    const lectureTitles = lectures.map((lecture) => lecture.title);
    const testsByTitle = lectureTitles.length > 0
      ? await prisma.test.findMany({
          where: { title: { in: lectureTitles } },
          include: {
            categories: {
              include: {
                category: { select: { slug: true } }
              }
            }
          }
        })
      : [];

    const testCategoriesByTitle = new Map<string, string[]>();
    testsByTitle.forEach((test) => {
      const slugs = test.categories.map((ct) => ct.category.slug);
      testCategoriesByTitle.set(test.title, slugs);
    });

    const lectureCategoriesById = new Map<string, string[]>();
    lectures.forEach((lecture) => {
      const categories = new Set<string>();
      lecture.questions.forEach((question) => {
        question.tests.forEach((testQuestion) => {
          testQuestion.test.categories.forEach((ct) => {
            categories.add(ct.category.slug);
          });
        });
      });

      const fallbackCategories = testCategoriesByTitle.get(lecture.title);
      if (fallbackCategories) {
        fallbackCategories.forEach((slug) => categories.add(slug));
      }

      lectureCategoriesById.set(lecture.id, Array.from(categories));
    });

    // Фильтруем лекции по категории если указана
    let filteredLectures = lectures;

    if (categorySlug) {
      filteredLectures = lectures.filter((lecture) => {
        const categories = lectureCategoriesById.get(lecture.id) ?? [];
        return categories.includes(categorySlug);
      });
    }


    // Преобразуем в удобный формат для фронтенда
    const formattedLectures = filteredLectures.map((lecture) => {
      const categories = lectureCategoriesById.get(lecture.id) ?? [];

      return {
        id: lecture.id,
        title: lecture.title,
        topic: lecture.topic,
        content: lecture.content,
        scenariosContent: lecture.scenariosContent,
        exampleContent: lecture.exampleContent,
        tasksContent: lecture.tasksContent,
        questionsCount: lecture.questions.length,
        categories,
      };
    });

    return NextResponse.json(formattedLectures);
  } catch (error) {
    console.error('Error fetching lectures:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
