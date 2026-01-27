/**
 * TypeScript типы для Results Feature
 */

export interface TestResult {
  id: string;
  testId: string;
  userId: string;
  score: number;
  answers: number[];
  mode: 'learning' | 'exam';
  createdAt: string;
  test?: {
    id: string;
    title: string;
    difficulty: string;
    questionsCount: number;
  };
}

export interface CombinedTestResult {
  id: string;
  userId: string;
  testIds: string[];
  listName: string;
  totalScore: number; // Changed from 'score'
  totalQuestions: number; // Changed from 'answers: number[]'
  correctAnswers: number; // Added
  completedAt: string; // Changed from 'createdAt'
  testScores?: Record<string, {
    score: number;
    correct: number;
    total: number;
    title: string;
  }>;
}

export interface ResultsStats {
  totalTests: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  recentTests: TestResult[];
}
