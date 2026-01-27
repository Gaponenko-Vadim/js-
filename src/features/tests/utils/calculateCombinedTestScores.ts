/**
 * calculateCombinedTestScores
 *
 * Вычисляет результаты для каждого теста в комбинированном тесте
 */

import type { Question, SourceTest, TestScore } from '../types';

/**
 * Вычисляет детализированные результаты по каждому источнику теста
 *
 * @param questions - Массив всех вопросов комбинированного теста
 * @param answers - Ответы пользователя
 * @param sourceTests - Информация об исходных тестах
 * @returns Record с результатами по каждому тесту
 *
 * @example
 * ```typescript
 * const testScores = calculateCombinedTestScores(
 *   test.questions,
 *   userAnswers,
 *   test.sourceTests
 * );
 *
 * // testScores = {
 * //   'test-1-id': { title: 'HTTP Методы', score: 85, correct: 17, total: 20 },
 * //   'test-2-id': { title: 'Статус коды', score: 90, correct: 18, total: 20 }
 * // }
 * ```
 */
export function calculateCombinedTestScores(
  questions: Question[],
  answers: number[],
  sourceTests?: SourceTest[]
): Record<string, TestScore> {
  if (!sourceTests || sourceTests.length === 0) {
    return {};
  }

  const testScores: Record<string, TestScore> = {};

  sourceTests.forEach((sourceTest) => {
    // Найти вопросы, принадлежащие этому тесту
    const testQuestions = questions.filter((q) =>
      q.sourceTestIds?.includes(sourceTest.id)
    );

    // Подсчитать правильные ответы для этого теста
    let testCorrect = 0;
    testQuestions.forEach((question) => {
      const questionIndex = questions.indexOf(question);
      if (
        questionIndex >= 0 &&
        questionIndex < answers.length &&
        answers[questionIndex] === question.correctAnswer
      ) {
        testCorrect++;
      }
    });

    // Вычислить процент правильных ответов
    const testScore =
      testQuestions.length > 0
        ? Math.round((testCorrect / testQuestions.length) * 100)
        : 0;

    testScores[sourceTest.id] = {
      title: sourceTest.title,
      score: testScore,
      correct: testCorrect,
      total: testQuestions.length
    };
  });

  return testScores;
}
