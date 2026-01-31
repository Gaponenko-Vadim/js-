import { NextResponse } from 'next/server';
import { withAuth } from '@/shared/api/middleware/authMiddleware';
import { prisma } from '@/lib/prisma';
import { shuffleArray, shuffleOptions } from '@/lib/utils';

// GET /api/combined-test?tests=id1,id2,id3
// Получить объединенный тест из нескольких тестов
export const GET = withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const testsParam = searchParams.get('tests');

    if (!testsParam) {
      return NextResponse.json(
        { error: 'tests parameter is required' },
        { status: 400 }
      );
    }

    const testIds = testsParam.split(',').filter(id => id.trim());

    if (testIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one test ID is required' },
        { status: 400 }
      );
    }

    // Получаем все вопросы из выбранных тестов
    const tests = await prisma.test.findMany({
      where: {
        id: { in: testIds },
      },
      include: {
        questions: {
          include: {
            question: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (tests.length === 0) {
      return NextResponse.json({ error: 'No tests found' }, { status: 404 });
    }

    // Собираем все вопросы из всех тестов с информацией о принадлежности к тестам
    const allQuestions: any[] = [];
    const questionToTestsMap = new Map<string, Set<string>>(); // questionId -> Set<testId>

    tests.forEach((test) => {
      test.questions.forEach((tq) => {
        if (!questionToTestsMap.has(tq.question.id)) {
          questionToTestsMap.set(tq.question.id, new Set());
          allQuestions.push({
            id: tq.question.id,
            question: tq.question.question,
            options: tq.question.options,
            correctAnswer: tq.question.correctAnswer,
            explanation: tq.question.explanation,
            sourceTestIds: [], // Будет заполнено ниже
          });
        }
        questionToTestsMap.get(tq.question.id)!.add(test.id);
      });
    });

    // Заполняем sourceTestIds для каждого вопроса
    allQuestions.forEach((q) => {
      q.sourceTestIds = Array.from(questionToTestsMap.get(q.id) || []);
    });

    // Перемешиваем варианты ответов для каждого вопроса
    const questionsWithShuffledOptions = allQuestions.map((q) => {
      const { shuffledOptions, newCorrectAnswer } = shuffleOptions(
        q.options as string[],
        q.correctAnswer
      );

      return {
        ...q,
        options: shuffledOptions,
        correctAnswer: newCorrectAnswer,
      };
    });

    // Перемешиваем порядок вопросов
    const shuffledQuestions = shuffleArray(questionsWithShuffledOptions);

    // Формируем информацию о комбинированном тесте
    const combinedTest = {
      id: `combined_${testIds.join('_')}`,
      title: `Объединенный тест (${tests.length} ${tests.length === 1 ? 'тест' : tests.length < 5 ? 'теста' : 'тестов'})`,
      description: `Комбинированный тест из ${allQuestions.length} уникальных вопросов`,
      difficulty: 'mixed',
      questionsCount: allQuestions.length,
      questions: shuffledQuestions,
      sourceTests: tests.map(t => ({
        id: t.id,
        title: t.title,
        questionsCount: t.questions.length,
      })),
    };

    return NextResponse.json(combinedTest);
  } catch (error) {
    console.error('Error creating combined test:', error);
    return NextResponse.json(
      { error: 'Failed to create combined test' },
      { status: 500 }
    );
  }
});
