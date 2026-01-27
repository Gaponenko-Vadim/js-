/**
 * TestResults Component
 *
 * Экран результатов теста с детальным разбором ошибок
 */

import { Test, TestMode } from '@/features/tests/types';
import styles from './TestResults.module.scss';

export interface TestResultsProps {
  /** Данные теста */
  test: Test;
  /** Ответы пользователя */
  userAnswers: number[];
  /** Процент правильных ответов */
  score: number;
  /** Режим теста */
  testMode: TestMode;
  /** Callback для перезапуска теста */
  onRestart: () => void;
  /** Callback для возврата к тестам */
  onBackToTests: () => void;
  /** Callback для просмотра всех результатов */
  onViewResults: () => void;
  /** Callback для открытия лекции */
  onOpenLecture: (questionId?: string) => void;
}

export function TestResults({
  test,
  userAnswers,
  score,
  testMode,
  onRestart,
  onBackToTests,
  onViewResults,
  onOpenLecture
}: TestResultsProps) {
  const correctCount = test.questions.filter(
    (q, i) => userAnswers[i] === q.correctAnswer
  ).length;
  const isMarathon = test.title.includes('Марафон');

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Mode Badge */}
        <div className={styles.modeBadge}>
          {testMode === 'learning' ? '📚 Режим обучения' : '🎯 Режим экзамена'}
        </div>

        {/* Title */}
        <h1 className={styles.title}>Тест завершен!</h1>

        {/* Score Circle */}
        <div className={styles.scoreCircle}>
          <span className={styles.scoreValue}>{score}%</span>
          <span className={styles.scoreLabel}>Ваш результат</span>
        </div>

        {/* Details */}
        <div className={styles.details}>
          <p className={styles.detailsText}>
            Правильных ответов: {correctCount} из {test.questions.length}
          </p>

          {testMode === 'learning' && (
            <p className={styles.learningNote}>
              ℹ️ Результаты не сохранены (режим обучения)
            </p>
          )}

          {testMode === 'exam' && (
            <p className={styles.examNote}>
              ✅ Результаты сохранены в вашу статистику
            </p>
          )}
        </div>

        {/* Review Section */}
        <div className={styles.reviewSection}>
          <div className={styles.reviewHeader}>
            <h2 className={styles.reviewTitle}>Разбор ответов</h2>
            {!isMarathon && (
              <button
                className={styles.lectureButton}
                onClick={() => onOpenLecture()}
              >
                📚 Открыть лекцию по теме
              </button>
            )}
          </div>

          {/* Questions Review */}
          <div className={styles.questionsList}>
            {test.questions.map((question, index) => {
              const isCorrect = userAnswers[index] === question.correctAnswer;
              const userAnswer = userAnswers[index];

              return (
                <div
                  key={question.id || index}
                  className={`${styles.reviewItem} ${
                    isCorrect ? styles.correct : styles.incorrect
                  }`}
                >
                  {/* Header */}
                  <div className={styles.reviewItemHeader}>
                    <span className={styles.questionNumber}>
                      Вопрос {index + 1}
                    </span>
                    <span
                      className={`${styles.resultBadge} ${
                        isCorrect ? styles.correctBadge : styles.incorrectBadge
                      }`}
                    >
                      {isCorrect ? '✓ Правильно' : '✗ Неправильно'}
                    </span>
                  </div>

                  {/* Question Text */}
                  <p className={styles.reviewQuestion}>{question.question}</p>

                  {/* Answer Comparison (if incorrect) */}
                  {!isCorrect && userAnswer !== undefined && (
                    <div className={styles.answerComparison}>
                      <div className={styles.wrongAnswer}>
                        <strong>Ваш ответ:</strong>{' '}
                        {question.options[userAnswer]}
                      </div>
                      <div className={styles.rightAnswer}>
                        <strong>Правильный ответ:</strong>{' '}
                        {question.options[question.correctAnswer]}
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div className={styles.explanation}>
                      <strong>Объяснение:</strong> {question.explanation}
                    </div>
                  )}

                  {/* Lecture Button */}
                  {question.id && (
                    <button
                      className={styles.questionLectureButton}
                      onClick={() => onOpenLecture(question.id)}
                    >
                      📖 Изучить материал по этому вопросу
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.primaryButton} onClick={onBackToTests}>
            К списку тестов
          </button>
          <button className={styles.secondaryButton} onClick={onViewResults}>
            Мои результаты
          </button>
        </div>
      </div>
    </div>
  );
}
