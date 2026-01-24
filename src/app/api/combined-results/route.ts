import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/combined-results - Получить все результаты комбинированных тестов пользователя
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const results = await prisma.combinedTestResult.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: 'desc' },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching combined results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}

// POST /api/combined-results - Сохранить результат комбинированного теста
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { listName, testIds, totalScore, totalQuestions, correctAnswers, testScores } = body;

    if (!listName || !testIds || totalScore === undefined || !totalQuestions || !correctAnswers || !testScores) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Создаем результат марафона
    const result = await prisma.combinedTestResult.create({
      data: {
        userId: user.id,
        listName,
        testIds,
        totalScore,
        totalQuestions,
        correctAnswers,
        testScores,
      },
    });

    // Создаем отдельные результаты для каждого теста из марафона
    for (const testId of testIds) {
      const testScore = testScores[testId];

      if (testScore) {
        try {
          // Создаем фиктивный массив ответов (нам не важен порядок для статистики)
          const answers = Array(testScore.total).fill(0);

          await prisma.testResult.create({
            data: {
              userId: user.id,
              testId: testId,
              score: testScore.score,
              answers: answers,
            },
          });
        } catch (error) {
          console.error(`Error creating test result for test ${testId}:`, error);
        }
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error saving combined result:', error);
    return NextResponse.json(
      { error: 'Failed to save result' },
      { status: 500 }
    );
  }
}
