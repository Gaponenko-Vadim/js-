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

    // Фильтруем лекции по категории если указана
    let filteredLectures = lectures;

    if (categorySlug) {
      filteredLectures = lectures.filter((lecture) => {
        // Проверяем есть ли у лекции вопросы связанные с тестами данной категории
        return lecture.questions.some((question) =>
          question.tests.some((testQuestion) =>
            testQuestion.test.categories.some(
              (ct) => ct.category.slug === categorySlug
            )
          )
        );
      });
    }

    // Преобразуем в удобный формат для фронтенда
    const formattedLectures = filteredLectures.map((lecture) => {
      // Определяем категории для каждой лекции
      const categories = new Set<string>();
      lecture.questions.forEach((question) => {
        question.tests.forEach((testQuestion) => {
          testQuestion.test.categories.forEach((ct) => {
            categories.add(ct.category.slug);
          });
        });
      });

      return {
        id: lecture.id,
        title: lecture.title,
        topic: lecture.topic,
        content: lecture.content,
        questionsCount: lecture.questions.length,
        categories: Array.from(categories),
      };
    });

    return NextResponse.json(formattedLectures);
  } catch (error) {
    console.error('Error fetching lectures:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
