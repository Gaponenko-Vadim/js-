/**
 * useTestSubmit Hook
 *
 * Логика отправки теста и подсчета результатов
 * Поддерживает как обычные, так и комбинированные тесты
 */

import { useState } from 'react';
import type { Question, SourceTest, TestScore } from '../types';
import { calculateCombinedTestScores } from '../utils/calculateCombinedTestScores';

export interface UseTestSubmitOptions {
  /** ID теста */
  testId: string;
  /** Вопросы теста */
  questions: Question[];
  /** Режим теста */
  testMode: 'learning' | 'exam';
  /** Callback после отправки */
  onSubmitComplete?: (score: number) => void;
  /** Комбинированный тест (опционально) */
  isCombined?: boolean;
  /** Название списка для combined test */
  listName?: string;
  /** Исходные тесты для combined test */
  sourceTests?: SourceTest[];
}

export interface TestResult {
  /** Процент правильных ответов */
  score: number;
  /** Количество правильных ответов */
  correctCount: number;
  /** Общее количество вопросов */
  totalQuestions: number;
}

export interface UseTestSubmitReturn {
  /** Идет отправка */
  isSubmitting: boolean;
  /** Результат теста */
  result: TestResult | null;
  /** Ошибка при отправке */
  error: string | null;
  /** Отправить тест */
  submitTest: (answers: number[]) => Promise<void>;
  /** Сбросить результат */
  resetResult: () => void;
}

/**
 * Hook для отправки теста и подсчета результатов
 *
 * @example
 * ```tsx
 * const { isSubmitting, result, submitTest } = useTestSubmit({
 *   testId: 'test-123',
 *   questions: test.questions,
 *   testMode: 'exam',
 *   onSubmitComplete: (score) => {
 *     console.log('Результат:', score);
 *   }
 * });
 *
 * // При завершении теста
 * await submitTest(userAnswers);
 *
 * // Показать результаты
 * if (result) {
 *   return <div>Ваш результат: {result.score}%</div>;
 * }
 * ```
 */
export function useTestSubmit({
  testId,
  questions,
  testMode,
  onSubmitComplete,
  isCombined = false,
  listName,
  sourceTests
}: UseTestSubmitOptions): UseTestSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitTest = async (answers: number[]) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Подсчитываем правильные ответы
      let correctCount = 0;
      questions.forEach((question, index) => {
        if (answers[index] === question.correctAnswer) {
          correctCount++;
        }
      });

      const scorePercentage = Math.round(
        (correctCount / questions.length) * 100
      );

      const testResult: TestResult = {
        score: scorePercentage,
        correctCount,
        totalQuestions: questions.length
      };

      setResult(testResult);

      // 2. Сохраняем результаты только в режиме экзамена
      if (testMode === 'exam') {
        try {
          if (isCombined && sourceTests && listName) {
            // Для комбинированного теста вычисляем результаты по каждому тесту
            const testScores = calculateCombinedTestScores(
              questions,
              answers,
              sourceTests
            );

            const response = await fetch('/api/combined-results', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                listName,
                testIds: sourceTests.map((t) => t.id),
                totalScore: scorePercentage,
                totalQuestions: questions.length,
                correctAnswers: correctCount,
                testScores
              })
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.error || 'Ошибка при сохранении результатов'
              );
            }
          } else {
            // Для обычного теста
            const response = await fetch('/api/results', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                testId,
                answers,
                score: scorePercentage
              })
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.error || 'Ошибка при сохранении результатов'
              );
            }
          }
        } catch (apiError) {
          console.error('Error saving result:', apiError);
          // Не прерываем процесс - результаты уже подсчитаны
          setError('Результаты подсчитаны, но не сохранены на сервере');
        }
      }

      // 3. Вызываем callback
      onSubmitComplete?.(scorePercentage);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      console.error('Error submitting test:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    isSubmitting,
    result,
    error,
    submitTest,
    resetResult
  };
}
