import { NextResponse } from 'next/server';
import { withAuth } from '@/shared/api/middleware/authMiddleware';
import { prisma } from '@/lib/prisma';

// GET /api/combined-results - Получить все результаты комбинированных тестов пользователя
export const GET = withAuth(async (req, { user }) => {
  try {
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
});

// POST /api/combined-results - Сохранить результат комбинированного теста
export const POST = withAuth(async (request: Request, { user }) => {
  try {
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
});
