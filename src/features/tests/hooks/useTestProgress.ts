/**
 * useTestProgress Hook
 *
 * Управление прогрессом прохождения теста
 * Автосохранение в sessionStorage
 * Восстановление прогресса
 */

import { useState, useEffect } from 'react';

export interface TestState {
  userAnswers: number[];
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  testMode: 'learning' | 'exam';
  timeLeft?: number;
  endTime?: number | null;
}

export interface UseTestProgressOptions {
  /** ID теста */
  testId: string;
  /** Количество вопросов */
  questionCount: number;
  /** Тест начат */
  testStarted: boolean;
  /** Показаны результаты */
  showResults: boolean;
  /** Режим теста */
  testMode: 'learning' | 'exam' | null;
  /** Текущий timeLeft (для сохранения) */
  timeLeft?: number;
  /** Текущий endTime (для сохранения) */
  endTime?: number | null;
}

export interface SavedTestState extends TestState {
  // Дополнительные поля при необходимости
}

export interface UseTestProgressReturn {
  /** Текущий индекс вопроса */
  currentQuestionIndex: number;
  /** Ответы пользователя */
  userAnswers: number[];
  /** Выбранный ответ для текущего вопроса */
  selectedAnswer: number | null;
  /** Сохраненное состояние (для диалога восстановления) */
  savedState: SavedTestState | null;
  /** Показать диалог восстановления */
  showRestoreDialog: boolean;
  /** Установить текущий индекс вопроса */
  setCurrentQuestionIndex: (index: number) => void;
  /** Установить ответы пользователя */
  setUserAnswers: (answers: number[]) => void;
  /** Установить выбранный ответ */
  setSelectedAnswer: (answer: number | null) => void;
  /** Обработать выбор ответа */
  handleAnswerSelect: (answerIndex: number) => void;
  /** Перейти к следующему вопросу */
  handleNext: (onComplete: (answers: number[]) => void) => void;
  /** Вернуться к предыдущему вопросу */
  handlePrevious: () => void;
  /** Восстановить прогресс */
  restoreProgress: () => void;
  /** Начать заново (очистить прогресс) */
  startFresh: () => void;
  /** Очистить сохранение */
  clearSavedState: () => void;
}

/**
 * Hook для управления прогрессом теста
 *
 * @example
 * ```tsx
 * const {
 *   currentQuestionIndex,
 *   userAnswers,
 *   selectedAnswer,
 *   handleAnswerSelect,
 *   handleNext,
 *   handlePrevious,
 *   showRestoreDialog,
 *   restoreProgress,
 *   startFresh
 * } = useTestProgress({
 *   testId: 'test-123',
 *   questionCount: 20,
 *   testStarted: true,
 *   showResults: false,
 *   testMode: 'exam',
 *   timeLeft: 300,
 *   endTime: Date.now() + 300000
 * });
 * ```
 */
export function useTestProgress({
  testId,
  questionCount,
  testStarted,
  showResults,
  testMode,
  timeLeft,
  endTime
}: UseTestProgressOptions): UseTestProgressReturn {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>(
    new Array(questionCount).fill(-1)
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [savedState, setSavedState] = useState<SavedTestState | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  // Автосохранение в sessionStorage
  useEffect(() => {
    if (testStarted && testId && !showResults && testMode) {
      const testState: TestState = {
        userAnswers,
        currentQuestionIndex,
        selectedAnswer,
        testMode,
        timeLeft,
        endTime
      };
      sessionStorage.setItem(`test_${testId}_state`, JSON.stringify(testState));
    }
  }, [
    testId,
    testStarted,
    userAnswers,
    currentQuestionIndex,
    selectedAnswer,
    testMode,
    timeLeft,
    endTime,
    showResults
  ]);

  // Восстановление из sessionStorage при монтировании
  useEffect(() => {
    if (testId && !testStarted && !showRestoreDialog) {
      const savedStateStr = sessionStorage.getItem(`test_${testId}_state`);

      if (savedStateStr) {
        try {
          const state: SavedTestState = JSON.parse(savedStateStr);

          if (state.testMode === 'exam') {
            // Для экзамена проверяем, не истекло ли время
            const now = Date.now();
            const remaining = state.endTime
              ? Math.max(0, Math.ceil((state.endTime - now) / 1000))
              : 0;

            if (remaining > 0) {
              // Время еще есть - автоматически восстанавливаем
              setUserAnswers(state.userAnswers);
              setCurrentQuestionIndex(state.currentQuestionIndex);
              setSelectedAnswer(state.selectedAnswer);
            } else {
              // Время истекло - удаляем сохранение
              sessionStorage.removeItem(`test_${testId}_state`);
            }
          } else if (state.testMode === 'learning') {
            // Для режима обучения показываем диалог
            setSavedState(state);
            setShowRestoreDialog(true);
          }
        } catch (error) {
          console.error('Ошибка при восстановлении прогресса:', error);
          sessionStorage.removeItem(`test_${testId}_state`);
        }
      }
    }
  }, [testId, testStarted, showRestoreDialog]);

  // Обработчики
  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = (onComplete: (answers: number[]) => void) => {
    if (selectedAnswer === null) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < questionCount - 1) {
      // Переход к следующему вопросу
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(
        newAnswers[nextIndex] >= 0 ? newAnswers[nextIndex] : null
      );
    } else {
      // Последний вопрос - завершаем тест
      onComplete(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setSelectedAnswer(
        userAnswers[prevIndex] >= 0 ? userAnswers[prevIndex] : null
      );
    }
  };

  const restoreProgress = () => {
    if (savedState) {
      setUserAnswers(savedState.userAnswers);
      setCurrentQuestionIndex(savedState.currentQuestionIndex);
      setSelectedAnswer(savedState.selectedAnswer);
      setShowRestoreDialog(false);
    }
  };

  const startFresh = () => {
    sessionStorage.removeItem(`test_${testId}_state`);
    setShowRestoreDialog(false);
    setSavedState(null);
    setUserAnswers(new Array(questionCount).fill(-1));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
  };

  const clearSavedState = () => {
    sessionStorage.removeItem(`test_${testId}_state`);
  };

  return {
    currentQuestionIndex,
    userAnswers,
    selectedAnswer,
    savedState,
    showRestoreDialog,
    setCurrentQuestionIndex,
    setUserAnswers,
    setSelectedAnswer,
    handleAnswerSelect,
    handleNext,
    handlePrevious,
    restoreProgress,
    startFresh,
    clearSavedState
  };
}
