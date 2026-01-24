import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { shuffleArray, shuffleOptions } from '@/lib/utils';

type TestQuestionWithQuestion = {
  id: string;
  testId: string;
  questionId: string;
  order: number;
  question: {
    id: string;
    question: string;
    options: unknown;
    correctAnswer: number;
    explanation: string;
    createdAt: Date;
  };
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const test = await prisma.test.findUnique({
      where: { id: params.id },
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

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Получаем вопросы через TestQuestion
    const testQuestions = await prisma.testQuestion.findMany({
      where: { testId: params.id },
      include: {
        question: true
      },
      orderBy: { order: 'asc' }
    });

    // Извлекаем вопросы из TestQuestion и перемешиваем варианты ответов
    const questionsWithShuffledOptions = testQuestions.map((tq: TestQuestionWithQuestion) => {
      const question = tq.question;
      const { shuffledOptions, newCorrectAnswer } = shuffleOptions(
        question.options as string[],
        question.correctAnswer
      );

      return {
        id: question.id,
        question: question.question,
        options: shuffledOptions,
        correctAnswer: newCorrectAnswer,
        explanation: question.explanation,
      };
    });

    // Перемешиваем порядок вопросов
    const shuffledQuestions = shuffleArray(questionsWithShuffledOptions);

    return NextResponse.json({
      ...test,
      questions: shuffledQuestions,
    });
  } catch (error) {
    console.error('Error fetching test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
