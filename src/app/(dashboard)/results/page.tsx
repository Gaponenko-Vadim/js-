'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import styles from './results.module.scss';

type TestResult = {
  id: string;
  score: number;
  completedAt: string;
  test: {
    id: string;
    title: string;
    difficulty: string;
  };
};

type GroupedResults = {
  testId: string;
  testTitle: string;
  difficulty: string;
  results: TestResult[];
  bestScore: number;
  attemptsCount: number;
};

type CombinedTestResult = {
  id: string;
  listName: string;
  testIds: string[];
  totalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  testScores: Record<string, {
    title: string;
    score: number;
    correct: number;
    total: number;
  }>;
  completedAt: string;
};

export default function ResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [results, setResults] = useState<TestResult[]>([]);
  const [combinedResults, setCombinedResults] = useState<CombinedTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [expandedCombined, setExpandedCombined] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'regular' | 'combined'>('regular');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchResults();
      fetchCombinedResults();
    }
  }, [session]);

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/results');
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCombinedResults = async () => {
    try {
      const response = await fetch('/api/combined-results');
      if (response.ok) {
        const data = await response.json();
        setCombinedResults(data);
      }
    } catch (error) {
      console.error('Error fetching combined results:', error);
    }
  };

  if (status === 'loading' || loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (!session) {
    return null;
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Начальный';
      case 'intermediate':
        return 'Средний';
      case 'advanced':
        return 'Продвинутый';
      default:
        return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return styles.beginner;
      case 'intermediate':
        return styles.intermediate;
      case 'advanced':
        return styles.advanced;
      default:
        return '';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return styles.excellent;
    if (score >= 60) return styles.good;
    return styles.needsWork;
  };

  // Группировка результатов по тестам
  const groupResultsByTest = (): GroupedResults[] => {
    const grouped = new Map<string, GroupedResults>();

    results.forEach((result) => {
      const testId = result.test.id;

      if (!grouped.has(testId)) {
        grouped.set(testId, {
          testId: testId,
          testTitle: result.test.title,
          difficulty: result.test.difficulty,
          results: [],
          bestScore: 0,
          attemptsCount: 0,
        });
      }

      const group = grouped.get(testId)!;
      group.results.push(result);
      group.attemptsCount++;
      group.bestScore = Math.max(group.bestScore, result.score);
    });

    // Сортируем результаты внутри каждой группы по дате (новые сначала)
    grouped.forEach((group) => {
      group.results.sort((a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
    });

    // Преобразуем Map в массив и сортируем по дате последней попытки
    return Array.from(grouped.values()).sort((a, b) =>
      new Date(b.results[0].completedAt).getTime() - new Date(a.results[0].completedAt).getTime()
    );
  };

  const toggleTestExpanded = (testId: string) => {
    setExpandedTests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  };

  const toggleCombinedExpanded = (id: string) => {
    setExpandedCombined((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const groupedResults = groupResultsByTest();

  // Статистика для обычных тестов
  const uniqueTestsCount = groupedResults.length;
  const averageScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;
  const completedTests = results.length;
  const excellentResults = results.filter((r) => r.score >= 80).length;

  // Статистика для комбинированных тестов
  const combinedTestsCount = combinedResults.length;
  const combinedAverageScore = combinedResults.length > 0
    ? Math.round(combinedResults.reduce((sum, r) => sum + r.totalScore, 0) / combinedResults.length)
    : 0;
  const totalCombinedQuestions = combinedResults.reduce((sum, r) => sum + r.totalQuestions, 0);
  const excellentCombinedResults = combinedResults.filter((r) => r.totalScore >= 80).length;

  return (
    <div className={styles.container}>
      <DashboardHeader />

      <div className={styles.pageHeader}>
        <h1>Мои результаты</h1>
        <p>История прохождения тестов</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'regular' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('regular')}
        >
          📝 Тесты
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'combined' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('combined')}
        >
          🏃 Марафоны по спискам
        </button>
      </div>

      <main className={styles.main}>
        {activeTab === 'regular' ? (
          <>
            <div className={styles.stats}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{uniqueTestsCount}</span>
                <span className={styles.statLabel}>Уникальных тестов</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{completedTests}</span>
                <span className={styles.statLabel}>Всего попыток</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{averageScore}%</span>
                <span className={styles.statLabel}>Средний балл</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{excellentResults}</span>
                <span className={styles.statLabel}>Отличных результатов</span>
              </div>
            </div>

            {results.length === 0 ? (
              <div className={styles.noResults}>
                <p>У вас пока нет результатов</p>
                <Link href="/tests" className={styles.primaryButton}>
                  Пройти первый тест
                </Link>
              </div>
            ) : (
              <div className={styles.resultsList}>
                <h2>История тестов</h2>
            {groupedResults.map((group) => {
              const isExpanded = expandedTests.has(group.testId);
              const bestResult = group.results.find((r) => r.score === group.bestScore)!;

              return (
                <div key={group.testId} className={styles.groupedResultCard}>
                  {/* Лучший результат - всегда виден */}
                  <div className={styles.resultCard}>
                    <div className={styles.resultHeader}>
                      <div className={styles.resultInfo}>
                        <h3>{group.testTitle}</h3>
                        <div className={styles.badges}>
                          <span className={`${styles.badge} ${getDifficultyColor(group.difficulty)}`}>
                            {getDifficultyLabel(group.difficulty)}
                          </span>
                          {group.attemptsCount > 1 && (
                            <span className={styles.attemptsBadge}>
                              {group.attemptsCount} {group.attemptsCount === 1 ? 'попытка' : group.attemptsCount < 5 ? 'попытки' : 'попыток'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`${styles.score} ${getScoreColor(group.bestScore)}`}>
                        {group.bestScore}%
                      </div>
                    </div>
                    <div className={styles.resultFooter}>
                      <span className={styles.date}>
                        Лучший результат • {new Date(bestResult.completedAt).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <div className={styles.actions}>
                        {group.attemptsCount > 1 && (
                          <button
                            onClick={() => toggleTestExpanded(group.testId)}
                            className={styles.expandButton}
                          >
                            {isExpanded ? '▲ Свернуть' : `▼ Показать все (${group.attemptsCount})`}
                          </button>
                        )}
                        <Link href={`/tests/${group.testId}`} className={styles.retakeButton}>
                          Пройти снова
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Остальные попытки - показываются при раскрытии */}
                  {isExpanded && group.attemptsCount > 1 && (
                    <div className={styles.expandedResults}>
                      <h4>Все попытки:</h4>
                      {group.results.map((result, index) => (
                        <div key={result.id} className={styles.attemptCard}>
                          <div className={styles.attemptInfo}>
                            <div className={styles.attemptNumber}>
                              <span className={styles.attemptIcon}>🎯</span>
                              <span className={styles.attemptLabel}>Попытка</span>
                              <span className={styles.attemptBadge}>#{group.attemptsCount - index}</span>
                            </div>
                            <span className={styles.attemptDate}>
                              {new Date(result.completedAt).toLocaleDateString('ru-RU', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className={`${styles.attemptScore} ${getScoreColor(result.score)}`}>
                            {result.score}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </>
    ) : (
      <>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{combinedTestsCount}</span>
            <span className={styles.statLabel}>Пройдено списков</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{totalCombinedQuestions}</span>
            <span className={styles.statLabel}>Всего вопросов</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{combinedAverageScore}%</span>
            <span className={styles.statLabel}>Средний балл</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{excellentCombinedResults}</span>
            <span className={styles.statLabel}>Отличных результатов</span>
          </div>
        </div>

        {combinedResults.length === 0 ? (
          <div className={styles.noResults}>
            <p>У вас пока нет результатов по своим спискам</p>
            <Link href="/my-lists" className={styles.primaryButton}>
              Перейти к спискам
            </Link>
          </div>
        ) : (
          <div className={styles.resultsList}>
            <h2>История прохождения своих списков</h2>
            {combinedResults.map((result) => {
              const isExpanded = expandedCombined.has(result.id);
              const testScoresArray = Object.entries(result.testScores);

              return (
                <div key={result.id} className={styles.groupedResultCard}>
                  <div className={styles.resultCard}>
                    <div className={styles.resultHeader}>
                      <div className={styles.resultInfo}>
                        <h3>{result.listName}</h3>
                        <div className={styles.badges}>
                          <span className={styles.badge}>
                            📋 {result.testIds.length} {result.testIds.length === 1 ? 'тест' : result.testIds.length < 5 ? 'теста' : 'тестов'}
                          </span>
                          <span className={styles.badge}>
                            {result.totalQuestions} {result.totalQuestions === 1 ? 'вопрос' : result.totalQuestions < 5 ? 'вопроса' : 'вопросов'}
                          </span>
                        </div>
                      </div>
                      <div className={`${styles.score} ${getScoreColor(result.totalScore)}`}>
                        {result.totalScore}%
                      </div>
                    </div>
                    <div className={styles.resultFooter}>
                      <span className={styles.date}>
                        {new Date(result.completedAt).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <div className={styles.actions}>
                        <button
                          onClick={() => toggleCombinedExpanded(result.id)}
                          className={styles.expandButton}
                        >
                          {isExpanded ? '▲ Свернуть' : `▼ Показать детали`}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={styles.expandedResults}>
                      <h4>Результаты по тестам:</h4>
                      {testScoresArray.map(([testId, testData]) => (
                        <div key={testId} className={styles.attemptCard}>
                          <div className={styles.attemptInfo}>
                            <div className={styles.attemptNumber}>
                              <span className={styles.attemptIcon}>📝</span>
                              <span className={styles.attemptLabel}>{testData.title}</span>
                            </div>
                            <span className={styles.attemptDate}>
                              {testData.correct} из {testData.total} правильных
                            </span>
                          </div>
                          <div className={`${styles.attemptScore} ${getScoreColor(testData.score)}`}>
                            {testData.score}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </>
    )}
      </main>
    </div>
  );
}
