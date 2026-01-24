export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface TestWithQuestions {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: Question[];
  createdAt: Date;
}

export interface UserAnswer {
  questionId: string;
  selectedAnswer: number;
}

export interface TestSubmission {
  testId: string;
  answers: UserAnswer[];
}

export interface PomodoroTimer {
  duration: number;
  type: 'work' | 'short_break' | 'long_break';
  isRunning: boolean;
  timeLeft: number;
}

export interface PomodoroStats {
  totalSessions: number;
  todaySessions: number;
  weekSessions: number;
}

export interface TestResultWithDetails {
  id: string;
  testTitle: string;
  score: number;
  completedAt: Date;
  totalQuestions: number;
  correctAnswers: number;
}

export interface DashboardStats {
  totalTestsCompleted: number;
  averageScore: number;
  pomodoroSessionsToday: number;
  recentResults: TestResultWithDetails[];
}
