'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import LectureModal from '@/components/lecture/LectureModal';
import styles from './combined-test.module.scss';

type Question = {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  sourceTestIds?: string[]; // ID тестов, из которых пришел этот вопрос
};

type Test = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  questions: Question[];
  sourceTests?: {
    id: string;
    title: string;
    questionsCount: number;
  }[];
  categories?: {
    category: {
      id: string;
      slug: string;
      name: string;
      icon: string;
    };
  }[];
};

export default function CombinedTestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testsParam = searchParams.get('tests');
  const listName = searchParams.get('listName') || 'Объединенный тест';
  const combinedTestId = testsParam ? `combined_${testsParam.replace(/,/g, '_')}` : 'combined';

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isLectureOpen, setIsLectureOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  // Ref для актуальных userAnswers в таймере
  const userAnswersRef = useRef<number[]>([]);

  // Новые состояния для режимов
  const [testMode, setTestMode] = useState<'learning' | 'exam' | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 минут = 600 секунд
  const [endTime, setEndTime] = useState<number | null>(null); // Точное время окончания
  const [testStarted, setTestStarted] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [savedState, setSavedState] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && combinedTestId) {
      fetchTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, combinedTestId]);

  // Обновляем ref при изменении userAnswers
  useEffect(() => {
    userAnswersRef.current = userAnswers;
  }, [userAnswers]);

  // Сохраняем состояние теста в sessionStorage при изменении
  useEffect(() => {
    if (testStarted && combinedTestId && !showResults) {
      const testState = {
        userAnswers,
        currentQuestionIndex,
        selectedAnswer,
        testMode,
        timeLeft,
        endTime,
      };
      sessionStorage.setItem(`test_${combinedTestId}_state`, JSON.stringify(testState));
    }
  }, [combinedTestId, testStarted, userAnswers, currentQuestionIndex, selectedAnswer, testMode, timeLeft, endTime, showResults]);

  // Восстанавливаем состояние из sessionStorage при монтировании
  useEffect(() => {
    if (combinedTestId && !testStarted && !showRestoreDialog) {
      const savedStateStr = sessionStorage.getItem(`test_${combinedTestId}_state`);

      if (savedStateStr) {
        try {
          const state = JSON.parse(savedStateStr);

          if (state.testMode === 'exam') {
            // Для экзамена проверяем, не истекло ли время
            const now = Date.now();
            const remaining = state.endTime ? Math.max(0, Math.ceil((state.endTime - now) / 1000)) : 0;

            if (remaining > 0) {
              // Время еще есть - автоматически восстанавливаем прогресс
              setUserAnswers(state.userAnswers);
              setCurrentQuestionIndex(state.currentQuestionIndex);
              setSelectedAnswer(state.selectedAnswer);
              setTestMode(state.testMode);
              setTimeLeft(remaining);
              setEndTime(state.endTime);
              setTestStarted(true);
            } else {
              // Время истекло - удаляем сохранение
              sessionStorage.removeItem(`test_${combinedTestId}_state`);
            }
          } else if (state.testMode === 'learning') {
            // Для режима обучения показываем диалог восстановления
            setSavedState(state);
            setShowRestoreDialog(true);
          }
        } catch (error) {
          console.error('Ошибка при восстановлении состояния теста:', error);
          sessionStorage.removeItem(`test_${combinedTestId}_state`);
        }
      }
    }
  }, [combinedTestId, testStarted, showRestoreDialog]);

  // Таймер для режима экзамена с точным отсчетом времени
  useEffect(() => {
    if (testMode === 'exam' && testStarted && !showResults && endTime) {
      const timer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

        setTimeLeft(remaining);

        if (remaining <= 0) {
          // Время вышло - автоматически завершаем тест
          clearInterval(timer);
          submitTest(userAnswersRef.current);
        }
      }, 100); // Проверяем каждые 100мс для точности

      return () => clearInterval(timer);
    }
  }, [testMode, testStarted, showResults, endTime]);

  // Обработчик для пересчета времени когда пользователь возвращается на вкладку
  useEffect(() => {
    if (testMode !== 'exam' || !testStarted || showResults || !endTime) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Пользователь вернулся на вкладку - пересчитываем время
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          submitTest(userAnswersRef.current);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [testMode, testStarted, showResults, endTime]);

  // Отслеживание перезагрузки страницы vs ухода со страницы
  useEffect(() => {
    if (!testStarted || testMode !== 'exam') return;

    // Устанавливаем флаг при перезагрузке страницы
    const handleBeforeUnload = () => {
      if (combinedTestId) {
        sessionStorage.setItem(`test_${combinedTestId}_reloading`, 'true');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup: если компонент размонтируется без перезагрузки - удаляем прогресс
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (combinedTestId && testMode === 'exam' && testStarted && !showResults) {
        const isReloading = sessionStorage.getItem(`test_${combinedTestId}_reloading`) === 'true';

        if (!isReloading) {
          // Уход со страницы (не перезагрузка) - удаляем прогресс
          sessionStorage.removeItem(`test_${combinedTestId}_state`);
        }
      }
    };
  }, [combinedTestId, testMode, testStarted, showResults]);

  // Очищаем флаг перезагрузки после восстановления
  useEffect(() => {
    if (testStarted && testMode === 'exam' && combinedTestId) {
      const reloadingFlag = sessionStorage.getItem(`test_${combinedTestId}_reloading`);
      if (reloadingFlag === 'true') {
        sessionStorage.removeItem(`test_${combinedTestId}_reloading`);
      }
    }
  }, [testStarted, testMode, combinedTestId]);

  const fetchTest = async () => {
    // Загружаем тест если еще не загружен
    if (test) {
      return;
    }

    if (!testsParam) {
      alert('Не указаны тесты для объединения');
      router.push('/my-lists');
      return;
    }

    try {
      const response = await fetch(`/api/combined-test?tests=${testsParam}`);

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Ошибка загрузки теста: ${errorData.error || 'Неизвестная ошибка'}`);
        router.push('/my-lists');
        return;
      }

      const data = await response.json();
      setTest(data);
      // Инициализируем userAnswers только если массив пустой
      if (userAnswers.length === 0) {
        setUserAnswers(new Array(data.questions.length).fill(-1));
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      alert('Ошибка при загрузке теста.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < (test?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(newAnswers[currentQuestionIndex + 1] >= 0 ? newAnswers[currentQuestionIndex + 1] : null);
    } else {
      submitTest(newAnswers);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex - 1] >= 0 ? userAnswers[currentQuestionIndex - 1] : null);
    }
  };

  const openLecture = (questionId?: string) => {
    if (questionId) {
      setSelectedQuestionId(questionId);
      setIsLectureOpen(true);
    } else if (test?.questions[0]?.id) {
      setSelectedQuestionId(test.questions[0].id);
      setIsLectureOpen(true);
    } else {
      alert('Лекция не найдена для этого вопроса');
    }
  };

  const closeLecture = () => {
    setIsLectureOpen(false);
    setSelectedQuestionId(null);
  };

  const startTest = (mode: 'learning' | 'exam') => {
    setTestMode(mode);
    setTestStarted(true);
    if (mode === 'exam') {
      const examDuration = (test?.questions.length || 0) * 20; // 20 секунд на каждый вопрос
      setTimeLeft(examDuration);
      setEndTime(Date.now() + examDuration * 1000); // Устанавливаем точное время окончания
    }
  };

  const handleRestoreTest = () => {
    if (savedState) {
      setUserAnswers(savedState.userAnswers);
      setCurrentQuestionIndex(savedState.currentQuestionIndex);
      setSelectedAnswer(savedState.selectedAnswer);
      setTestMode(savedState.testMode);
      if (savedState.testMode === 'exam') {
        setTimeLeft(savedState.timeLeft);
        setEndTime(savedState.endTime);
      }
      setTestStarted(true);
      setShowRestoreDialog(false);
    }
  };

  const handleStartFresh = () => {
    sessionStorage.removeItem(`test_${combinedTestId}_state`);
    setShowRestoreDialog(false);
    setSavedState(null);
  };

  const handleBackToTests = () => {
    // Для режима экзамена удаляем прогресс при выходе
    // Для режима обучения сохраняем прогресс
    if (combinedTestId && testMode === 'exam') {
      sessionStorage.removeItem(`test_${combinedTestId}_state`);
    }
    // Возвращаемся на страницу моих списков
    router.push('/my-lists');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const submitTest = async (answers: number[]) => {
    if (!test) return;

    let correctCount = 0;
    test.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / test.questions.length) * 100);
    setScore(scorePercentage);
    setShowResults(true);

    // Очищаем сохраненное состояние теста из sessionStorage
    sessionStorage.removeItem(`test_${combinedTestId}_state`);

    // Сохраняем результаты комбинированных тестов в БД только в режиме экзамена
    if (testMode === 'exam' && test.sourceTests) {
      try {
        // Собираем детальные результаты по каждому тесту
        const testScores: Record<string, any> = {};

        test.sourceTests.forEach((sourceTest) => {
          const testQuestions = test.questions.filter((q) =>
            q.sourceTestIds?.includes(sourceTest.id)
          );

          let testCorrect = 0;
          testQuestions.forEach((question) => {
            const questionIndex = test.questions.indexOf(question);
            if (answers[questionIndex] === question.correctAnswer) {
              testCorrect++;
            }
          });

          const testScore = testQuestions.length > 0
            ? Math.round((testCorrect / testQuestions.length) * 100)
            : 0;

          testScores[sourceTest.id] = {
            title: sourceTest.title,
            score: testScore,
            correct: testCorrect,
            total: testQuestions.length,
          };
        });

        // Отправляем результат комбинированного теста
        // API автоматически создаст отдельные результаты для каждого теста
        const testIds = test.sourceTests.map(t => t.id);
        await fetch('/api/combined-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listName,
            testIds,
            totalScore: scorePercentage,
            totalQuestions: test.questions.length,
            correctAnswers: correctCount,
            testScores,
          }),
        });
      } catch (error) {
        console.error('Error saving combined test result:', error);
      }
    }
  };

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (!session || !test) {
    return null;
  }

  // Диалог восстановления прогресса (только для режима обучения)
  if (showRestoreDialog && savedState && savedState.testMode === 'learning') {
    return (
      <div className={styles.container}>
        <div className={styles.restoreDialog}>
          <div className={styles.restoreDialogContent}>
            <h1>🔄 Найден сохранённый прогресс</h1>
            <p className={styles.restoreDialogText}>
              У вас есть незавершённое прохождение теста <strong>{listName}</strong> в режиме обучения
            </p>
            <div className={styles.restoreDialogInfo}>
              <p>📊 Режим: <strong>Обучение</strong></p>
              <p>📝 Текущий вопрос: <strong>{savedState.currentQuestionIndex + 1} из {test.questions.length}</strong></p>
              <p>✅ Отвечено: <strong>{savedState.userAnswers.filter((a: number) => a >= 0).length} вопросов</strong></p>
            </div>
            <div className={styles.restoreDialogActions}>
              <button
                className={styles.primaryButton}
                onClick={handleRestoreTest}
              >
                Продолжить прохождение
              </button>
              <button
                className={styles.secondaryButton}
                onClick={handleStartFresh}
              >
                Начать заново
              </button>
            </div>
            <button
              className={styles.backButton}
              onClick={handleBackToTests}
            >
              ← Назад к списку тестов
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Экран выбора режима
  if (!testMode) {
    return (
      <div className={styles.container}>
        <div className={styles.modeSelection}>
          <h1>Выберите режим прохождения</h1>
          <p className={styles.testTitle}>{listName}</p>
          <p className={styles.testDescription}>{test.description}</p>

          <div className={styles.modeCards}>
            <div className={styles.modeCard}>
              <div className={styles.modeIcon}>📚</div>
              <h2>Режим обучения</h2>
              <ul className={styles.modeFeatures}>
                <li>✅ Доступ к лекциям во время теста</li>
                <li>✅ Без ограничения по времени</li>
                <li>✅ Можно учиться в своём темпе</li>
                <li>❌ Результаты не сохраняются</li>
              </ul>
              <button
                className={styles.learningButton}
                onClick={() => startTest('learning')}
              >
                Начать обучение
              </button>
            </div>

            <div className={styles.modeCard}>
              <div className={styles.modeIcon}>🎯</div>
              <h2>Режим экзамена</h2>
              <ul className={styles.modeFeatures}>
                <li>⏱️ Ограничение: {Math.floor((test.questions.length * 20) / 60)} мин {(test.questions.length * 20) % 60} сек</li>
                <li>✅ Результаты сохраняются</li>
                <li>✅ Засчитывается в статистику</li>
                <li>❌ Нет доступа к лекциям</li>
              </ul>
              <button
                className={styles.examButton}
                onClick={() => startTest('exam')}
              >
                Начать экзамен
              </button>
            </div>
          </div>

          <button
            className={styles.backButton}
            onClick={handleBackToTests}
          >
            ← Назад к списку тестов
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    const correctCount = test.questions.filter((q, i) => userAnswers[i] === q.correctAnswer).length;
    const isMarathon = false; // Комбинированные тесты не являются марафонами

    return (
      <div className={styles.container}>
        <div className={styles.resultsCard}>
          <div className={styles.modeBadge}>
            {testMode === 'learning' ? '📚 Режим обучения' : '🎯 Режим экзамена'}
          </div>
          <h1>Тест завершен!</h1>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreValue}>{score}%</span>
            <span className={styles.scoreLabel}>Ваш результат</span>
          </div>
          <div className={styles.resultsDetails}>
            <p>
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

          {/* Показываем детальный разбор ошибок */}
          <div className={styles.reviewSection}>
            <div className={styles.reviewHeader}>
              <h2>Разбор ответов</h2>
              {!isMarathon && (
                <button className={styles.lectureButton} onClick={() => openLecture()}>
                  📚 Открыть лекцию по теме
                </button>
              )}
            </div>
            {test.questions.map((question, index) => {
              const isCorrect = userAnswers[index] === question.correctAnswer;
              const userAnswer = userAnswers[index];

              return (
                <div
                  key={question.id || index}
                  className={`${styles.reviewItem} ${isCorrect ? styles.correct : styles.incorrect}`}
                >
                  <div className={styles.reviewHeader}>
                    <span className={styles.questionNumber}>Вопрос {index + 1}</span>
                    <span className={`${styles.resultBadge} ${isCorrect ? styles.correctBadge : styles.incorrectBadge}`}>
                      {isCorrect ? '✓ Правильно' : '✗ Неправильно'}
                    </span>
                  </div>

                  <p className={styles.reviewQuestion}>{question.question}</p>

                  {!isCorrect && (
                    <div className={styles.answerComparison}>
                      <div className={styles.wrongAnswer}>
                        <strong>Ваш ответ:</strong> {question.options[userAnswer]}
                      </div>
                      <div className={styles.rightAnswer}>
                        <strong>Правильный ответ:</strong> {question.options[question.correctAnswer]}
                      </div>
                    </div>
                  )}

                  {question.explanation && (
                    <div className={styles.explanation}>
                      <strong>Объяснение:</strong> {question.explanation}
                    </div>
                  )}

                  {question.id && (
                    <button
                      className={styles.questionLectureButton}
                      onClick={() => openLecture(question.id)}
                    >
                      📖 Изучить материал по этому вопросу
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.resultsActions}>
            <button className={styles.primaryButton} onClick={handleBackToTests}>
              К списку тестов
            </button>
            <button className={styles.secondaryButton} onClick={() => router.push('/results')}>
              Мои результаты
            </button>
          </div>
        </div>

        <LectureModal
          questionId={selectedQuestionId || undefined}
          isOpen={isLectureOpen}
          onClose={closeLecture}
        />
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.testHeader}>
        <div className={styles.headerTop}>
          <h1>{listName}</h1>
          {testMode === 'exam' && (
            <div className={`${styles.timer} ${timeLeft <= 60 ? styles.timerWarning : ''}`}>
              ⏱️ {formatTime(timeLeft)}
            </div>
          )}
          {testMode === 'learning' && (
            <div className={styles.modeBadge}>📚 Обучение</div>
          )}
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.questionCounter}>
          Вопрос {currentQuestionIndex + 1} из {test.questions.length}
        </p>
      </div>

      <div className={styles.questionCard}>
        <h2 className={styles.questionText}>{currentQuestion.question}</h2>

        <div className={styles.options}>
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`${styles.option} ${selectedAnswer === index ? styles.selected : ''}`}
              onClick={() => handleAnswerSelect(index)}
            >
              <span className={styles.optionLabel}>{String.fromCharCode(65 + index)}</span>
              <span className={styles.optionText}>{option}</span>
            </button>
          ))}
        </div>

        {currentQuestion.id && testMode === 'learning' && (
          <div className={styles.lectureHint}>
            <button className={styles.hintButton} onClick={() => openLecture(currentQuestion.id)}>
              💡 Нужна подсказка? Открыть лекцию
            </button>
          </div>
        )}

        <div className={styles.navigation}>
          <button
            className={styles.secondaryButton}
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            ← Назад
          </button>
          <button
            className={styles.primaryButton}
            onClick={handleNext}
            disabled={selectedAnswer === null}
          >
            {currentQuestionIndex === test.questions.length - 1 ? 'Завершить' : 'Далее →'}
          </button>
        </div>
      </div>

      <LectureModal
        questionId={selectedQuestionId || undefined}
        isOpen={isLectureOpen}
        onClose={closeLecture}
      />
    </div>
  );
}
